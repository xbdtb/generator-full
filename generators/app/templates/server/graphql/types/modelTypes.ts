import {models} from '../../models/mysql';
import {defineTypesFromModel} from '../graphqlUtils';

let types = defineTypesFromModel(
  models.User,
  ['password'],
  {}
);

export const User = types.primitiveType;
export const UserList = types.listType;

