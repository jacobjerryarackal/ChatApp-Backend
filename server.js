import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import pkg from "pg";
import { ApolloServer } from "apollo-server-express";
import http from "http";
import { Server } from "socket.io";

import { resolvers } from "./graphql/resolvers/index.js";
import { typeDefs } from "./graphql/typeDefs/index.js";

const { Pool } = pkg;
const app = express();
app.use(cors());
app.use(bodyParser.json());
dotenv.config();

// PostgreSQL connection setup
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "chatapp",
  password: "12345678",
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});

async function testDbConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    console.log("PostgreSQL connected:", result.rows);
    client.release();
  } catch (err) {
    console.error("Database connection error:", err);
  }
}

testDbConnection();

// Apollo GraphQL server setup
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

await server.start();
server.applyMiddleware({ app, path: "/graphql" });

// Create an HTTP server to be used for WebSocket and GraphQL
const httpServer = http.createServer(app);

// Attach Socket.IO to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Update this with your frontend URL
    methods: ["GET", "POST"],
  },
});

// WebSocket logic for managing active users, messages, and video calls
let activeUsers = [];

io.on("connection", (socket) => {
  console.log(`New socket connection: ${socket.id}`);

  // Add new user when they connect
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({
        userId: newUserId,
        socketId: socket.id,
      });
    }
    console.log("Connected Users:", activeUsers);
    io.emit("get-users", activeUsers);
  });

  // Remove user on disconnection
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter(user => user.socketId !== socket.id);
    console.log("User Disconnected:", activeUsers);
    io.emit("get-users", activeUsers); 
  });

  // Handle sending and receiving messages
  socket.on("send-message", (data) => {
    const { chatId, message } = data;
    socket.to(chatId).emit("receive-message", message);
    console.log(`Message sent in chat ${chatId}:`, message);
  });

  // Handle message deletion
  socket.on("delete-message", (data) => {
    const { chatId, messageId } = data;
    io.to(chatId).emit("message-deleted", { messageId });
    console.log(`Message deleted in chat ${chatId}: ${messageId}`);
  });

  
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
    console.log(`User ${socket.id} joined chat : ${chatId}`);
  });

  socket.on("call-user", (data) => {
    try {
      const { offer, userId } = data;
      io.to(userId).emit("receive-call", offer);
      console.log(`Call offer sent to user ${userId}`);
    } catch (error) {
      console.error("Error sending call offer:", error);
    }
  });

  socket.on("answer-call", (data) => {
    const { answer, userId } = data;
    io.to(userId).emit("call-answered", answer);
    console.log(`Call answer sent to user ${userId}`);
  });

  socket.on("ice-candidate", (data) => {
    const { candidate, userId } = data;
    io.to(userId).emit("new-ice-candidate", candidate);
    console.log(`ICE candidate sent to user ${userId}`);
  });
});

const port = process.env.PORT || 7000;
httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});
