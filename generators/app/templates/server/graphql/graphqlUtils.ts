import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLString
} from 'graphql';

import {typeMapper} from 'graphql-sequelize';
import {offsetToCursor} from 'graphql-relay';
import {models} from '../models/mysql';

const _ = require('lodash');

const PAGE_MAX_COUNT = 100;

export const idField = (description = 'generate an output id field') => {
  return {
    name: 'id',
    description,
    type: GraphQLID
  };
};

export const inputIdField = (description = 'generate an input id filed') => {
  return {
    name: 'id',
    description,
    type: new GraphQLNonNull(GraphQLID)
  };
};

const attributeFields = (Model, options): any => {
  const cache = options.cache || {};
  const result = Object.keys(Model.rawAttributes).reduce((memo, key) => {
    if (options.exclude) {
      if (typeof options.exclude === 'function' && options.exclude(key)) {
        return memo;
      }
      if (Array.isArray(options.exclude) && ~options.exclude.indexOf(key)) {
        return memo;
      }
    }
    if (options.only) {
      if (typeof options.only === 'function' && !options.only(key)) {
        return memo;
      }
      if (Array.isArray(options.only) && !~options.only.indexOf(key)) {
        return memo;
      }
    }

    const attribute = Model.rawAttributes[key];
    const type = attribute.type;

    if (options.map) {
      if (typeof options.map === 'function') {
        key = options.map(key) || key;
      } else {
        key = options.map[key] || key;
      }
    }

    memo[key] = {
      type: typeMapper.toGraphQL(type, Model.sequelize.constructor)
    };

    if (memo[key].type instanceof GraphQLEnumType) {
      const typeName = `${Model.name}${key}EnumType`;

      if (cache[typeName]) {
        memo[key].type = cache[typeName];
      } else {
        memo[key].type.name = typeName;
        cache[typeName] = memo[key].type;
      }
    }

    if (!options.allowNull) {
      if (attribute.allowNull === false || attribute.primaryKey === true) {
        memo[key].type = new GraphQLNonNull(memo[key].type);
      }
    }

    if (options.commentToDescription) {
      if (typeof attribute.comment === 'string') {
        memo[key].description = attribute.comment;
      }
    }

    return memo;
  }, {});

  result['id'] = idField();

  return result;
};

const pageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  description: 'pagination information',
  fields: function fields() {
    return {
      hasNextPage: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'whether have more items when page down'
      },
      hasPreviousPage: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description: 'whether have more items when page up'
      },
      startCursor: {
        type: GraphQLString,
        description: 'the cursor position of the begin item when page up'
      },
      endCursor: {
        type: GraphQLString,
        description: 'the cursor position of the begin item when page down'
      }
    };
  }
});

export const parsePageArgs = pageArgs => {
  pageArgs = pageArgs || {};
  return {
    offset: pageArgs.offset || 0,
    limit: pageArgs.limit === -1 ? 0 : pageArgs.limit || 100,
    before: pageArgs.before ? JSON.parse(pageArgs.before) : undefined,
    after: pageArgs.after ? JSON.parse(pageArgs.after) : undefined
  };
};

const PageArgsType = new GraphQLInputObjectType({
  description: 'pagination arguments',
  name: 'PageArgs',
  fields: {
    before: {
      description: 'page up from this position, not include the current item',
      type: GraphQLString
    },
    after: {
      description: 'page down from this position, not include the current item',
      type: GraphQLString
    },
    offset: {
      description: 'the offset of the position, begin from 0(pageNo * itemsPerPage)',
      type: GraphQLInt
    },
    limit: {
      description: 'the count of one page',
      type: GraphQLInt
    },
    order: {
      description: 'the order filed',
      type: new GraphQLList(GraphQLString)
    }
  }
});

export const pageArgsFields = (orderDescription = null) => {
  return {
    pageArgs: {
      description: `分页参数，排序字段: ${orderDescription ? 'orderDescription' : '无'}`,
      type: PageArgsType
    }
  };
};

export const defineListType = (typename, type) => {
  const rowType = new GraphQLObjectType({
    name: typename + 'Row',
    description: 'the single row information',
    fields: {
      data: {
        description: 'the original data of the row',
        type
      },
      cursor: {
        description: 'position of the current item',
        type: new GraphQLNonNull(GraphQLString)
      }
    }
  });

  const listType = new GraphQLObjectType({
    name: typename + 'List',
    description: 'list type',
    fields: {
      count: {
        description: 'the total count of the items that match the condition',
        type: GraphQLInt
      },
      rows: {
        description: 'item list',
        type: new GraphQLList(rowType)
      },
      pageInfo: {
        description: 'pagination arguments',
        type: new GraphQLNonNull(pageInfoType)
      }
    }
  });

  return {rowType, listType};
};

export const defineTypesFromModel = (model, exclude = [], extraFields = null): {primitiveType: any; listType: any} => {
  exclude.push('modelType', 'deletedAt');
  const fields = attributeFields(model, {
    exclude,
    allowNull: true,
    commentToDescription: true
  });
  if (fields.id) {
    fields.id.description = 'identify/key';
  }
  if (fields.createdAt) {
    fields.createdAt.description = 'create time';
  }
  if (fields.updatedAt) {
    fields.updatedAt.description = 'update time';
  }
  if (extraFields) {
    for (const k in extraFields) {
      fields[k] = extraFields[k];
    }
  }

  const primitiveType = new GraphQLObjectType({
    description: model.comment,
    name: model.name,
    fields
  });
  return {primitiveType, listType: defineListType(model.name, primitiveType).listType};
};

export const getListResult = async (resultPromised, pageArgs) => {
  const {count, rows: rowsData, startCursor, endCursor} = await resultPromised;
  const {offset} = parsePageArgs(pageArgs);
  const sliceRowsData = rowsData.slice(0, PAGE_MAX_COUNT);
  const rows = sliceRowsData.map((rowData, index) => {
    return {
      cursor: offsetToCursor(offset + index),
      data: rowData
    };
  });

  const connection = {
    count,
    rows,
    pageInfo: {
      startCursor: startCursor ? JSON.stringify(startCursor) : offsetToCursor(offset),
      endCursor: endCursor ? JSON.stringify(endCursor) : offsetToCursor(offset + rowsData.length - 1),
      hasPreviousPage: offset > 0,
      hasNextPage: offset + rowsData.length < count
    }
  };
  return connection;
};

export const getElasticSearchResult = async (resultPromised, pageArgs) => {
  const elasticSearchData = await resultPromised;
  if (
    elasticSearchData &&
    elasticSearchData.hits &&
    elasticSearchData.hits.hits &&
    elasticSearchData.hits.hits.length > 0
  ) {
    let count: any;
    const rowsData = elasticSearchData.hits.hits;
    if (rowsData[0]._source.count) {
      count = rowsData[0]._source.count;
    } else {
      count = elasticSearchData.hits.total;
    }
    if (!pageArgs) {
      pageArgs = {};
    }
    if (pageArgs.before) {
      _.reverse(rowsData);
    }
    const {offset} = parsePageArgs(pageArgs);
    const startCursor = rowsData[0].sort;
    const endCursor = rowsData[rowsData.length - 1].sort;
    const rows = rowsData.map((rowData, index) => {
      const location = {
        lat: rowData._source.location ? rowData._source.location.lat : 0,
        lng: rowData._source.location ? rowData._source.location.lon : 0
      };
      const data = {
        ...rowData._source,
        location
      };
      return {
        cursor: startCursor && endCursor ? JSON.stringify(rowData.sort) : offsetToCursor(offset + index),
        data
      };
    });

    const connection = {
      count,
      rows,
      pageInfo: {
        startCursor: startCursor ? JSON.stringify(startCursor) : offsetToCursor(offset),
        endCursor: endCursor ? JSON.stringify(endCursor) : offsetToCursor(offset + rowsData.length - 1),
        hasPreviousPage: offset > 0,
        hasNextPage: offset + rowsData.length < count
      }
    };
    return connection;
  } else {
    let sum = 0;
    if (elasticSearchData && elasticSearchData.hits && elasticSearchData.hits.total) {
      sum = elasticSearchData.hits.total;
    }
    return {
      count: sum,
      rows: [],
      pageInfo: {
        startCursor: null,
        endCursor: null,
        hasPreviousPage: false,
        hasNextPage: false
      }
    };
  }
};

export const resultMetaFields = codeDescription => {
  return {
    errCode: {
      description: codeDescription,
      type: GraphQLInt,
      resolve: parent => parent.errCode || 0
    },
    errText: {
      description: 'error description',
      type: GraphQLString,
      resolve: parent => parent.errText || ''
    }
  };
};

export const parseQueryFields = (ast): any => {
  const traverseNodesRecursive = selectionSet => {
    const obj = {};
    if (selectionSet && selectionSet.selections) {
      selectionSet.selections.map(selection => {
        obj[selection.name.value] = traverseNodesRecursive(selection.selectionSet);
      });
    }
    return obj;
  };
  const fields = traverseNodesRecursive(ast.fieldNodes[0].selectionSet);
  return fields;
};

export const attachAssociateTypes = (type, associateTypes) => {
  for (const fieldName in associateTypes) {
    const associateType = associateTypes[fieldName];
    type._typeConfig.fields[fieldName] = {
      description: '',
      type: associateType
    };
  }
};

export const getModelTypeFields = (
  typeName,
  {input = true, includeId = true, timeFieldNames = [], include = [], exclude = null} = {}
) => {
  let fields = attributeFields(models[typeName], {
    exclude: [],
    allowNull: true,
    commentToDescription: true
  });
  delete fields.modelType;

  if (include && !exclude) {
    if (include.length > 0) {
      if (includeId) {
        include = [...include, 'id'];
      }
      include = [...include, ...timeFieldNames];
      fields = _.pick(fields, include);
    } else {
      if (!includeId) {
        delete fields.id;
      }
      const timeFieldNamesAll = ['createdAt', 'updatedAt', 'deletedAt'];
      timeFieldNamesAll.forEach(timeFieldName => {
        if (!_.includes(timeFieldNames, timeFieldName)) {
          if (fields[timeFieldName]) {
            delete fields[timeFieldName];
          }
        }
      });
    }
  } else {
    if (exclude) {
      exclude.forEach(excludeFieldName => {
        if (fields[excludeFieldName]) {
          delete fields[excludeFieldName];
        }
      });
    }
    if (!includeId) {
      if (fields['id']) {
        delete fields['id'];
      }
    }
    const timeFieldNamesAll = ['createdAt', 'updatedAt', 'deletedAt'];
    timeFieldNamesAll.forEach(timeFieldName => {
      if (!_.includes(timeFieldNames, timeFieldName)) {
        if (fields[timeFieldName]) {
          delete fields[timeFieldName];
        }
      }
    });
  }

  if (input) {
    const fieldNames = _.keys(fields);
    fieldNames.forEach(name => {
      delete fields[name].resolve;
    });
  }

  return fields;
};


export const orderReverseIfBefore = (sort, before) => {
  if (!before) {
    return;
  }
  sort.map(sortItem => {
    for (const fieldName in sortItem) {
      const orderObject = sortItem[fieldName];
      if (orderObject) {
        if (orderObject.order === 'desc') {
          orderObject.order = 'asc';
        } else {
          orderObject.order = 'desc';
        }
      }
    }
  });
};
