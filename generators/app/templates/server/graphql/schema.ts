import {GraphQLObjectType, GraphQLSchema} from 'graphql';
import userQueries from './queries/userQueries';
import userMutations from './mutations/userMutations';

const Query = new GraphQLObjectType({
  description: 'query operations',
  name: 'Query',
  fields: {
    ...userQueries,
  }
});

const Mutation = new GraphQLObjectType({
  description: 'mutate operation',
  name: 'Mutation',
  fields: {
    ...userMutations,
  }
});

const schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
});

export default schema;
