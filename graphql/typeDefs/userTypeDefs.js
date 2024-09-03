import { gql } from 'apollo-server-express';

export const userTypeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
    password: String!
    profilePic: String
    chats: [Chat!]
    messages: [Message!]
  }

  type AuthPayload {
    token: String!
    user: User
  }

  extend type Query {
    getAllUsers: [User!]!
    getUserById(id: Int!): User
    searchUsersByName(name: String!): [User!]!
  }

  extend type Mutation {
    createUser(name: String!, email: String!, password: String!, profilePic: String): User!
    loginUser(email: String!, password: String!): AuthPayload
    updateUser(id: Int!, name: String, email: String, password: String, profilePic: String): User!
    deleteUser(id: Int!): User!
  }
`;
