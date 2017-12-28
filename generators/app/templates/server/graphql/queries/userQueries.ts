import {GraphQLObjectType, GraphQLID} from 'graphql';

import UserService from '../../services/user';

import {
  getListResult,
  parseQueryFields
} from '../graphqlUtils';

import {User, UserList} from '../types/modelTypes';

const getUsers = {
  description: 'get the all users',
  type: UserList,
  args: {},
  resolve: (parent, {pageArgs}, req, ast) => {
    return getListResult(UserService.getUsers(req.user, parseQueryFields(ast).rows.item), pageArgs);
  }
};

const getUser = {
  description: 'get the all users',
  type: User,
  args: {
    id: {
      description: 'the user id',
      type: GraphQLID
    }
  },
  resolve: async (parent, {id, pageArgs}, req, ast) => {
    const result = await UserService.getUser(req.user, id, parseQueryFields(ast));
    return result;
  }
};

export default {
  user: {
    description: 'user query operations',
    type: new GraphQLObjectType({
      description: 'user query operations',
      name: 'UserQueries',
      fields: {
        getUsers,
        getUser,
      }
    }),
    resolve: () => {
      return {};
    }
  }
};
