import express from "express"
import dotenv from "dotenv"
import cors from 'cors'; 
import bodyParser from 'body-parser';
import pkg from 'pg';
import { ApolloServer } from 'apollo-server-express';
import { resolvers } from './graphql/resolvers/index.js';
import { typeDefs } from './graphql/typeDefs/index.js';

const { Pool } = pkg;
const app = express();
app.use(cors()); 
app.use(bodyParser.json()); 
dotenv.config();



const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'chatapp',
    password: '12345678',
    port: 5432,
  });


async function testDbConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('PostgreSQL connected:', result.rows);
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
  }
}

testDbConnection();

const server = new ApolloServer({
  typeDefs,   
  resolvers,  
});

await server.start(); 

server.applyMiddleware({ app, path: '/graphql' }); 

const port = process.env.PORT || 7000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}/graphql`);
});
