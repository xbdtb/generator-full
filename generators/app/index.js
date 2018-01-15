'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const replacer = require('./replacer');

module.exports = class extends Generator {
  prompting() {
    // Have Yeoman greet the user.
    this.log(
      yosay('Welcome to the lovely ' + chalk.red('generator-full') + ' generator!')
    );

    const prompts = [
      {
        type: 'confirm',
        name: 'enableGraphQLServer',
        message: 'Would you like to enable graphql server?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableRedisSessionStore',
        message: 'Would you like to enable the redis session store?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableMysql',
        message: 'Would you like to enable mysql and sequelize feature?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableElasticSearch',
        message: 'Would you like to enable elasticsearch feature?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableMongoDB',
        message: 'Would you like to enable mongodb feature?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableKafka',
        message: 'Would you like to enable kafka feature?',
        default: true
      },
      {
        type: 'confirm',
        name: 'generateReactClient',
        message: 'Would you like to generate react client app?',
        default: true
      },
      {
        type: 'confirm',
        name: 'enableK8sAndJenkins',
        message: 'Would you like to enable the k8s and jenkins ci/cd feature?',
        default: true
      },
      {
        type: 'confirm',
        name: 'generateDockerfile',
        message: 'Would you like to generate a sample Dockerfile?',
        default: true
      }
    ];

    return this.prompt(prompts).then(props => {
      // To access props later use this.props.someAnswer;
      this.props = props;
    });
  }

  writing() {
    const files = [
      'client/static/favicon.ico',
      // 'config/index.js',
      'server/controllers/passport.ts',
      'server/controllers/version.ts',
      // 'server/lib/core/cacheClient.ts',
      'server/index.ts',
      '.babelrc',
      '.dockerignore',
      '.editorconfig',
      // '.gitignore',
      '.npmrc',
      // 'Dockerfile',
      // 'index.js',
      // 'Jenkinsfile',
      // 'k8sAppConfig.yaml',
      // 'k8sAppDeploy.yaml',
      // 'k8sAppInitJob.yaml',
      // 'package.json',
      'ts.prettierrc',
      'tsconfig.json',
      'tslint.json',
      'index.js'
    ];
    if (this.props.enableGraphQLServer) {
      files.push('server/graphql/types/modelTypes.ts');
      files.push('server/graphql/queries/userQueries.ts');
      files.push('server/graphql/mutations/userMutations.ts');
      files.push('server/graphql/schema.ts');
      files.push('server/graphql/graphqlUtils.ts');
      files.push('server/services/user.ts');
    }
    if (this.props.enableRedisSessionStore) {
      files.push('server/lib/core/cacheClient.ts');
    }
    if (this.props.enableMysql) {
      files.push('server/models/mysql/index.ts');
      files.push('server/models/mysql/user.ts');
    }
    if (this.props.enableK8sAndJenkins) {
      files.push('Jenkinsfile');
      files.push('k8sAppConfig.yaml');
      files.push('k8sAppDeploy.yaml');
      files.push('k8sAppInitJob.yaml');
    }
    if (this.props.generateDockerfile) {
      files.push('Dockerfile');
    }

    files.map(file => {
      this.fs.copy(this.templatePath(file), this.destinationPath(file));
    });

    const replaceConfig = replacer.getReplaceConfig(this.templatePath('.replace.config.yaml'));

    let serverIndex = this.fs.read(this.templatePath('server/index.ts'), {});
    serverIndex = replacer.replacePlaceHolders(serverIndex, replaceConfig.graphqlServerIndex, !this.props.enableGraphQLServer);
    serverIndex = replacer.replacePlaceHolders(serverIndex, replaceConfig.redisSessionIndex, !this.props.enableRedisSessionStore);
    this.fs.write(this.destinationPath('server/index.ts'), serverIndex);

    let config = this.fs.read(this.templatePath('config/index.js'), {});
    config = replacer.replacePlaceHolders(config, replaceConfig.redisConfig, !this.props.enableRedisSessionStore);
    config = replacer.replacePlaceHolders(config, replaceConfig.mysqlConfig, !this.props.enableMysql);
    config = replacer.replacePlaceHolders(config, replaceConfig.elasticsearchConfig, !this.props.enableElasticSearch);
    config = replacer.replacePlaceHolders(config, replaceConfig.mongodbConfig, !this.props.enableMongoDB);
    config = replacer.replacePlaceHolders(config, replaceConfig.kafkaConfig, !this.props.enableKafka);
    this.fs.write(this.destinationPath('config/index.js'), config);

    let pkg = this.fs.read(this.templatePath('package.json'), {});
    pkg = replacer.replacePlaceHolders(pkg, replaceConfig.migrateScript, !this.props.enableMysql);
    this.fs.write(this.destinationPath('package.json'), pkg);

    let gitIgnore = this.fs.read(this.templatePath('gitignore'), {});
    this.fs.write(this.destinationPath('.gitignore'), gitIgnore);
  }

  install() {
    this.npmInstall();
    if (this.props.enableGraphQLServer) {
      this.npmInstall(['graphql', 'graphql-relay', 'graphql-sequelize', 'graphql-server-express']);
    }
    if (this.props.enableRedisSessionStore) {
      this.npmInstall(['connect-redis']);
      this.npmInstall(['hiredis'], {'save-optional': true});
    }
    if (this.props.enableMysql) {
      this.npmInstall(['mysql2', 'sequelize']);
    }
    if (this.props.enableElasticSearch) {
      this.npmInstall(['elasticsearch']);
    }
    if (this.props.enableMongoDB) {
      this.npmInstall(['mongoose']);
    }
    if (this.props.enableKafka) {
      this.npmInstall(['kafka']);
    }
    if (this.props.generateReactClient) {
    }
  }
};
