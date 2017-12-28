const fs = require('fs');
const mainConfig = require('./index');

const config = {
  "development": {
    "host": mainConfig.host,
    "port": mainConfig.port,
    "username": mainConfig.user,
    "password": mainConfig.password,
    "database": mainConfig.db,
    "dialect": "mysql"
  }
};

fs.writeFileSync(__dirname + '/config.json', JSON.stringify(config, null, 2));
