import { ApolloError } from 'apollo-server-errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const messageResolvers = {
  Query: {
    // Fetch all messages with related data
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

    // Fetch a single message by ID with related data
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

    // Fetch messages by chat ID
    getMessagesByChat: async (_, { chatId }) => {
      try {
        return await prisma.message.findMany({
          where: { chatId },
          include: { sender: true, chat: true },
        });
      } catch (error) {
        console.error('Error fetching messages by chat ID:', error);
        throw new ApolloError('Failed to fetch messages for chat');
      }
    },
  },

  Mutation: {
    // Create a new message
    createMessage: async (_, { text, chatId, senderId }) => {
      try {
        return await prisma.message.create({
          data: {
            text,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
          include: {
            sender: true,
            chat: true,
          },
        });
      } catch (error) {
        console.error('Error creating message:', error);
        throw new ApolloError('Failed to create message');
      }
    },

    // Update an existing message
    updateMessage: async (_, { id, text, timestamp }) => {
      try {
        return await prisma.message.update({
          where: { id },
          data: {
            text,
            timestamp: timestamp ? new Date(timestamp) : undefined,
          },
        });
      } catch (error) {
        console.error('Error updating message:', error);
        throw new ApolloError('Failed to update message');
      }
    },

    // Delete a message by ID
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

    // Send a message within a chat
    sendMessage: async (_, { text, chatId, senderId }) => {
      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { users: true },
        });
        if (!chat) {
          throw new ApolloError('Chat not found');
        }
        const sender = chat.users.find((user) => user.id === senderId);
        if (!sender) {
          throw new ApolloError('Sender is not part of the chat');
        }

        const message = await prisma.message.create({
          data: {
            text,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
          include: {
            sender: true,
            chat: true,
          },
        });

        return message;
      } catch (error) {
        console.error('Error sending message:', error);
        throw new ApolloError('Failed to send message');
      }
    },
  },
};

export default messageResolvers;
