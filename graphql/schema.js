import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './typeDefs';
import { resolvers } from './resolvers';

export const server = new ApolloServer({ typeDefs, resolvers });
