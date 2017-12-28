import {
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID
} from 'graphql';

import {mutationWithClientMutationId} from 'graphql-relay';
import UserService from '../../services/user';

import {
  resultMetaFields
} from '../graphqlUtils';

const addUser = mutationWithClientMutationId({
  description: 'add an user',
  name: 'AddUser',
  inputFields: {
    username: {
      description: 'user name',
      type: GraphQLString
    },
    nickname: {
      description: 'nick name',
      type: GraphQLString
    }
  },
  outputFields: {
    ...resultMetaFields('0: success')
  },
  mutateAndGetPayload: async (
    {username, nickname},
    req
  ) => {
    return UserService.addUser(req.user, {username, nickname});
  }
});

const updateUser = mutationWithClientMutationId({
  description: 'update an user',
  name: 'UpdateUser',
  inputFields: {
    nickname: {
      description: 'nick name',
      type: GraphQLString
    }
  },
  outputFields: {
    ...resultMetaFields('0: success；1：unauthorized, make sure you are logged in')
  },
  mutateAndGetPayload: async (
    {nickname},
    req
  ) => {
    return UserService.updateUser(req.user, {nickname});
  }
});

const deleteUser = mutationWithClientMutationId({
  description: 'delete an user',
  name: 'DeleteUser',
  inputFields: {
    id: {
      description: 'the user id to delete',
      type: new GraphQLNonNull(GraphQLID)
    }
  },
  outputFields: {
    ...resultMetaFields('0: success；1：unauthorized, make sure you are logged in')
  },
  mutateAndGetPayload: async (
    {nickname},
    req
  ) => {
    return UserService.updateUser(req.user, {nickname});
  }
});

export default {
  user: {
    description: 'user mutate operations',
    type: new GraphQLObjectType({
      description: 'user operations',
      name: 'UserMutations',
      fields: {
        addUser,
        updateUser,
        deleteUser
      }
    }),
    resolve: () => {
      return {};
    }
  }
};
