import { ApolloError } from 'apollo-server-errors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const chatResolvers = {
  Query: {
    getAllChats: async () => {
      try {
        return await prisma.chat.findMany({
          include: { users: true, latestMessage: true, groupAdmin: true },
        });
      } catch (error) {
        console.error('Error fetching all chats:', error);
        throw new ApolloError('Failed to fetch chats');
      }
    },
    getChatById: async (_, { id }) => {
      try {
        return await prisma.chat.findUnique({
          where: { id },
          include: { users: true, messages: true, latestMessage: true, groupAdmin: true },
        });
      } catch (error) {
        console.error('Error fetching chat by ID:', error);
        throw new ApolloError('Failed to fetch chat');
      }
    },
  },
  Mutation: {
    createChat: async (_, { chatName, isGroupChat, userIds, groupAdminId }) => {
      try {
        return await prisma.chat.create({
          data: {
            chatName,
            isGroupChat,
            users: { connect: userIds.map((id) => ({ id })) },
            groupAdmin: groupAdminId ? { connect: { id: groupAdminId } } : undefined,
          },
        });
      } catch (error) {
        console.error('Error creating chat:', error);
        throw new ApolloError('Failed to create chat');
      }
    },

    updateChat: async (_, { id, chatName, isGroupChat, userIds, groupAdminId }) => {
      try {
        return await prisma.chat.update({
          where: { id },
          data: {
            chatName,
            isGroupChat,
            users: userIds ? { set: userIds.map((id) => ({ id })) } : undefined,
            groupAdmin: groupAdminId ? { connect: { id: groupAdminId } } : undefined,
          },
        });
      } catch (error) {
        console.error('Error updating chat:', error);
        throw new ApolloError('Failed to update chat');
      }
    },

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

    addMessageToChat: async (_, { chatId, content, senderId }) => {
      try {
        return await prisma.message.create({
          data: {
            content,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
        });
      } catch (error) {
        console.error('Error adding message to chat:', error);
        throw new ApolloError('Failed to add message to chat');
      }
    },

    addUsersToGroupChat: async (_, { chatId, userIds }) => {
      try {
        return await prisma.chat.update({
          where: { id: chatId },
          data: {
            users: { connect: userIds.map((id) => ({ id })) },
          },
        });
      } catch (error) {
        console.error('Error adding users to group chat:', error);
        throw new ApolloError('Failed to add users to group chat');
      }
    },

    removeUsersFromGroupChat: async (_, { chatId, userIds }) => {
      try {
        return await prisma.chat.update({
          where: { id: chatId },
          data: {
            users: { disconnect: userIds.map((id) => ({ id })) },
          },
        });
      } catch (error) {
        console.error('Error removing users from group chat:', error);
        throw new ApolloError('Failed to remove users from group chat');
      }
    },

    renameGroupChat: async (_, { id, newChatName }) => {
      try {
        return await prisma.chat.update({
          where: { id },
          data: { chatName: newChatName },
        });
      } catch (error) {
        console.error('Error renaming group chat:', error);
        throw new ApolloError('Failed to rename group chat');
      }
    },

    deleteGroupChat: async (_, { id }) => {
      try {
        const chat = await prisma.chat.findUnique({ where: { id } });
        if (!chat) {
          throw new ApolloError('Chat not found');
        }
        if (!chat.isGroupChat) {
          throw new ApolloError('Cannot delete a non-group chat');
        }
        await prisma.chat.delete({ where: { id } });
        return chat;
      } catch (error) {
        console.error('Error deleting group chat:', error);
        throw new ApolloError('Failed to delete group chat');
      }
    },
  },
};

export default chatResolvers;
