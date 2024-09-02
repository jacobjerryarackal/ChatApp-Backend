import { ApolloError } from 'apollo-server-errors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const userResolvers = {
  Query: {
    getAllUsers: async () => {
      try {
        return await prisma.user.findMany();
      } catch (error) {
        console.error('Error fetching all users:', error);
        throw new ApolloError('Failed to fetch users');
      }
    },
    getUserById: async (_, { id }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          throw new ApolloError('User not found');
        }
        return user;
      } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw new ApolloError('Failed to fetch user');
      }
    },
  },

  Mutation: {
    createUser: async (_, { name, email, password, profilePic }) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        return await prisma.user.create({
          data: { name, email, password: hashedPassword, profilePic },
        });
      } catch (error) {
        console.error('Error creating user:', error);
        throw new ApolloError('Failed to create user');
      }
    },

    loginUser: async (_, { email, password }) => {
      try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new ApolloError('Invalid email or password');
        }

       
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
          throw new ApolloError('Invalid email or password');
        }
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return { token, user };
      } catch (error) {
        console.error('Error logging in user:', error);
        throw new ApolloError('Failed to log in user');
      }
    },

    updateUser: async (_, { id, name, email, password, profilePic }) => {
      try {
        const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
        return await prisma.user.update({
          where: { id },
          data: {
            name,
            email,
            password: hashedPassword,
            profilePic,
          },
        });
      } catch (error) {
        console.error('Error updating user:', error);
        throw new ApolloError('Failed to update user');
      }
    },

    deleteUser: async (_, { id }) => {
      try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
          throw new ApolloError('User not found');
        }

        await prisma.user.delete({ where: { id } });
        return user;
      } catch (error) {
        console.error('Error deleting user:', error);
        throw new ApolloError('Failed to delete user');
      }
    },
  },
};

export default userResolvers;
