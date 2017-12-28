import * as redis from 'redis';

export default class PubSubClient {
  client: any;

  initialize(option = {host: 'localhost', port: 6379, pass: '', database: ''}) {
    const client = redis.createClient(option.port, option.host);
    client.on('error', err => {
      return console.log(err.stack);
    });
    client.on('connect', () => {
      return console.log('redis connected!');
    });

    if (option.pass) {
      client.auth(option.pass);
    }

    if (option.database) {
      client.select(option.database);
    }

    client.on('error', err => {
      console.log('Error ' + err);
    });

    this.client = client;
  }
}

export const defaultPubSubClient = new PubSubClient();
