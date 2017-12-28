const fs = require('fs');
const path = require('path');
const config = require('../../../config');
const _ = require('lodash');

export const Sequelize = require('sequelize');

export const sequelize = new Sequelize(config.mysql.connectionString(), {
  timezone: '+08:00',
  pool: {
    maxConnections: 20
  },
  dialectOptions: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  logging: text => {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'development') {
      // console.log(text);
    }
  }
});

fs
  .readdirSync(__dirname)
  .filter(file => {
    return /\.(js)$/.test(file) && file !== 'index.js';
  })
  .forEach(file => {
    sequelize.import(path.join(__dirname, file));
  });

Object.keys(sequelize.models).forEach(modelName => {
  if ('associate' in sequelize.models[modelName]) {
    sequelize.models[modelName].associate(sequelize.models);
  }
});

export const models = sequelize.models;

export const pickModelAttributes = (fields, model, fieldPath = '') => {
  if (!model.attributeNames) {
    model.attributeNames = _.keys(model.attributes);
  }

  if (!fields) {
    return model.attributeNames;
  }

  if (fields && fieldPath && fieldPath.length > 0) {
    const paths = fieldPath.split('/');
    for (let p = 0; p < paths.length; p++) {
      if (fields[paths[p]]) {
        fields = fields[paths[p]];
      } else {
        break;
      }
    }
  }
  const initNames = _.keys(fields);
  let names = [];
  if (!fields || !model) {
    names = [];
  } else {
    names = _.keys(_.pick(fields, model.attributeNames));
  }
  if (names.length === 0 && initNames.length > 0) {
    names = ['id'];
  }
  return names;
};

export default models;
