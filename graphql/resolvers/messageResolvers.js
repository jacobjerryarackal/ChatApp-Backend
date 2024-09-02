import { ApolloError } from 'apollo-server-errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const messageResolvers = {
  Query: {
    getAllMessages: async () => {
      try {
        return await prisma.message.findMany({
          include: { sender: true, chat: true },
        });
      } catch (error) {
        console.error('Error fetching all messages:', error);
        throw new ApolloError('Failed to fetch messages');
      }
    },
    getMessageById: async (_, { id }) => {
      try {
        return await prisma.message.findUnique({
          where: { id },
          include: { sender: true, chat: true },
        });
      } catch (error) {
        console.error('Error fetching message by ID:', error);
        throw new ApolloError('Failed to fetch message');
      }
    },
  },
  Mutation: {
    createMessage: async (_, { content, chatId, senderId }) => {
      try {
        return await prisma.message.create({
          data: {
            content,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
        });
      } catch (error) {
        console.error('Error creating message:', error);
        throw new ApolloError('Failed to create message');
      }
    },

    updateMessage: async (_, { id, content, timestamp }) => {
      try {
        return await prisma.message.update({
          where: { id },
          data: {
            content,
            timestamp,
          },
        });
      } catch (error) {
        console.error('Error updating message:', error);
        throw new ApolloError('Failed to update message');
      }
    },

    deleteMessage: async (_, { id }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id } });
        if (!message) {
          throw new ApolloError('Message not found');
        }
        await prisma.message.delete({ where: { id } });
        return message;
      } catch (error) {
        console.error('Error deleting message:', error);
        throw new ApolloError('Failed to delete message');
      }
    },

    sendMessage: async (_, { content, chatId, senderId }) => {
      try {
        return await prisma.message.create({
          data: {
            content,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
        });
      } catch (error) {
        console.error('Error sending message:', error);
        throw new ApolloError('Failed to send message');
      }
    },
  },
};

export default messageResolvers;
