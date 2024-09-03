import { gql } from 'apollo-server-express';

export const chatTypeDefs = gql`
  type Chat {
    id: Int!
    chatName: String!
    isGroupChat: Boolean!
    users: [User!]!
    latestMessage: Message
    groupAdmin: User
    messages: [Message!]
  }

  extend type Query {
    getAllChats: [Chat!]!
    getChatById(id: Int!): Chat
  }

  extend type Mutation {
    createChat(chatName: String!, isGroupChat: Boolean!, userIds: [Int!]!, groupAdminId: Int): Chat!
    updateChat(id: Int!, chatName: String, isGroupChat: Boolean, userIds: [Int], groupAdminId: Int): Chat!
    deleteChat(id: Int!): Chat!
    addMessageToChat(chatId: Int!, content: String!, senderId: Int!): Message!
    addUsersToChat(chatId: Int!, userIds: [Int!]!): Chat!
    removeUsersFromChat(chatId: Int!, userIds: [Int!]!): Chat!
    renameGroupChat(id: Int!, newChatName: String!): Chat!
  }
`;
