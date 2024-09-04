import { gql } from 'apollo-server-express';

export const messageTypeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
    profilePic: String
    createdAt: String!
    updatedAt: String!
    chats: [Chat!]!
    messages: [Message!]!
  }

  type Chat {
    id: Int!
    users: [User!]!
    messages: [Message!]!
    createdAt: String!
  }

  type Message {
    id: Int!
    text: String!
    timestamp: String!
    sender: User!
    chat: Chat!
  }

  extend type Query {
    getAllMessages: [Message!]!
    getMessageById(id: Int!): Message
    getMessagesByChat(chatId: Int!): [Message!]!
  }

  extend type Mutation {
    createMessage(text: String!, chatId: Int!, senderId: Int!): Message!
    updateMessage(id: Int!, text: String, timestamp: String): Message!
    deleteMessage(id: Int!): Message!
    sendMessage(text: String!, chatId: Int!, senderId: Int!): Message!
  }
`;
