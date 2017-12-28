const getServiceHost = (clusterServiceName, defaultValue) => {
  if (process.env.CLUSTER_MODE) {
    return clusterServiceName;
  } else {
    return defaultValue;
  }
};

let config = {
  env: process.env.NODE_ENV || 'development',
  systemBearerToken: 'full',
  serverPort: process.env.SERVER_PORT || 4000,
  // GENERATOR_PLACEHODER_REDIS_CONFIG
  // GENERATOR_PLACEHODER_MYSQL_CONFIG_1
  // GENERATOR_PLACEHODER_ELASTICSEARCH_CONFIG
  // GENERATOR_PLACEHODER_MONGODB_CONFIG
  // GENERATOR_PLACEHODER_ZOOKEEPER_CONFIG
  // GENERATOR_PLACEHODER_KAFKA_CONFIG
};

console.log(config);

config.__DEV__ = config.env === 'development';

// GENERATOR_PLACEHODER_MYSQL_CONFIG_2

module.exports = config;
