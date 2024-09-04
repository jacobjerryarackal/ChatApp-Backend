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
            latestMessage: true,
            groupAdmin: true,
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
            messages: true,
            latestMessage: true,
            groupAdmin: true,
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
            latestMessage: true,
            groupAdmin: true,
          },
        });
      } catch (error) {
        console.error('Error fetching user chats:', error);
        throw new ApolloError('Failed to fetch user chats');
      }
    },
  },

  Mutation: {
    // Create or fetch a one-on-one or group chat
    createChat: async (_, { chatName, isGroupChat, userIds, groupAdminId }) => {
      try {
        console.log('Creating chat with user IDs:', userIds);
        let defaultChatName = chatName;

        // Determine the default chat name if it's a one-on-one chat
        if (!isGroupChat && !chatName) {
          const users = await prisma.user.findMany({
            where: {
              id: { in: userIds },
            },
            select: {
              name: true,
            },
          });

          if (users.length === 2) {
            defaultChatName = `Chat with ${users[1].name}`;
          }
        }

        const chat = await prisma.chat.create({
          data: {
            chatName: defaultChatName,
            isGroupChat,
            users: { connect: userIds.map((id) => ({ id })) },
            groupAdmin: groupAdminId ? { connect: { id: groupAdminId } } : undefined,
          },
          include: {
            users: true,
            latestMessage: true,
            groupAdmin: true,
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

    // Update chat details like name, group status, users, and admin
    updateChat: async (_, { id, chatName, isGroupChat, userIds, groupAdminId }) => {
      try {
        const chat = await prisma.chat.update({
          where: { id },
          data: {
            chatName,
            isGroupChat,
            users: userIds ? { set: userIds.map((id) => ({ id })) } : undefined,
            groupAdmin: groupAdminId ? { connect: { id: groupAdminId } } : undefined,
          },
          include: {
            users: true,
            latestMessage: true,
            groupAdmin: true,
          },
        });

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

    // Add a message to a chat
    addMessageToChat: async (_, { chatId, content, senderId }) => {
      try {
        const chat = await prisma.chat.findUnique({
          where: { id: chatId },
          include: { users: true },
        });

        if (!chat) {
          throw new ApolloError('Chat not found');
        }

        const message = await prisma.message.create({
          data: {
            content,
            chat: { connect: { id: chatId } },
            sender: { connect: { id: senderId } },
          },
          include: { sender: true },
        });

        // Update the latest message in the chat
        await prisma.chat.update({
          where: { id: chatId },
          data: { latestMessage: { connect: { id: message.id } } },
        });

        return message;
      } catch (error) {
        console.error('Error adding message to chat:', error);
        throw new ApolloError('Failed to add message to chat');
      }
    },

    // Add users to an existing group chat
    addUsersToGroupChat: async (_, { chatId, userIds }) => {
      try {
        const chat = await prisma.chat.update({
          where: { id: chatId },
          data: {
            users: { connect: userIds.map((id) => ({ id })) },
          },
          include: {
            users: true,
            latestMessage: true,
            groupAdmin: true,
          },
        });

        return chat;
      } catch (error) {
        console.error('Error adding users to group chat:', error);
        throw new ApolloError('Failed to add users to group chat');
      }
    },

    // Remove users from a group chat
    removeUsersFromGroupChat: async (_, { chatId, userIds }) => {
      try {
        const chat = await prisma.chat.update({
          where: { id: chatId },
          data: {
            users: { disconnect: userIds.map((id) => ({ id })) },
          },
          include: {
            users: true,
            latestMessage: true,
            groupAdmin: true,
          },
        });

        return chat;
      } catch (error) {
        console.error('Error removing users from group chat:', error);
        throw new ApolloError('Failed to remove users from group chat');
      }
    },

    // Rename a group chat
    renameGroupChat: async (_, { id, newChatName }) => {
      try {
        const chat = await prisma.chat.update({
          where: { id },
          data: { chatName: newChatName },
          include: {
            users: true,
            latestMessage: true,
            groupAdmin: true,
          },
        });

        return chat;
      } catch (error) {
        console.error('Error renaming group chat:', error);
        throw new ApolloError('Failed to rename group chat');
      }
    },

    // Delete a group chat (ensuring it's a group chat)
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
