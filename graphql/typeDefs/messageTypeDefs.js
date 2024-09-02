import { gql } from 'apollo-server-express';

export const messageTypeDefs = gql`
  type Message {
    id: Int!
    content: String!
    timestamp: String!
    sender: User!
    chat: Chat!
  }

  extend type Query {
    getAllMessages: [Message!]!
    getMessageById(id: Int!): Message
  }

  extend type Mutation {
    createMessage(content: String!, chatId: Int!, senderId: Int!): Message!
    updateMessage(id: Int!, content: String, timestamp: String): Message!
    deleteMessage(id: Int!): Message!
    sendMessage(content: String!, chatId: Int!, senderId: Int!): Message!
  }
`;
