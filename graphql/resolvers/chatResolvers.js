import { ApolloError } from 'apollo-server-errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const chatResolvers = {
  Query: {
    // Fetch all chats with related data
    getAllChats: async () => {
      try {
        return await prisma.chat.findMany({
          include: {
            users: true,
            messages: {
              include: {
                sender: true,
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching all chats:', error);
        throw new ApolloError('Failed to fetch chats');
      }
    },

    // Fetch a single chat by ID with related data
    getChatById: async (_, { id }) => {
      try {
        const chat = await prisma.chat.findUnique({
          where: { id },
          include: {
            users: true,
            messages: {
              include: {
                sender: true,
              },
            },
          },
        });

        if (!chat) {
          throw new ApolloError('Chat not found');
        }

        return chat;
      } catch (error) {
        console.error('Error fetching chat by ID:', error);
        throw new ApolloError('Failed to fetch chat');
      }
    },

    // Fetch all chats for a specific user
    getUserChats: async (_, { userId }) => {
      try {
        return await prisma.chat.findMany({
          where: {
            users: { some: { id: userId } },
          },
          include: {
            users: true,
            messages: {
              include: {
                sender: true,
              },
            },
          },
        });
      } catch (error) {
        console.error('Error fetching user chats:', error);
        throw new ApolloError('Failed to fetch user chats');
      }
    },
  },

  Mutation: {
    // Create a new chat with users
    createChat: async (_, { userIds }) => {
      try {
        const chat = await prisma.chat.create({
          data: {
            users: { connect: userIds.map((id) => ({ id })) },
          },
          include: {
            users: true,
            messages: true,
          },
        });

        console.log('Created chat:', chat);
        return chat;
      } catch (error) {
        console.error('Error creating chat:', error);
        throw new ApolloError('Failed to create chat');
      }
    },

    // Update chat details, e.g., users
    updateChat: async (_, { id, userIds }) => {
      try {
        const chat = await prisma.chat.update({
          where: { id },
          data: {
            users: userIds ? { set: userIds.map((id) => ({ id })) } : undefined,
          },
          include: {
            users: true,
            messages: true,
          },
        });

        console.log('Updated chat:', chat);
        return chat;
      } catch (error) {
        console.error('Error updating chat:', error);
        throw new ApolloError('Failed to update chat');
      }
    },

    // Delete a chat
    deleteChat: async (_, { id }) => {
      try {
        const chat = await prisma.chat.findUnique({ where: { id } });
        if (!chat) {
          throw new ApolloError('Chat not found');
        }

        await prisma.chat.delete({ where: { id } });
        return chat;
      } catch (error) {
        console.error('Error deleting chat:', error);
        throw new ApolloError('Failed to delete chat');
      }
    },
  },
};

export default chatResolvers;
