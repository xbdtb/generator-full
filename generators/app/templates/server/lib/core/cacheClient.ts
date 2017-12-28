import * as redis from 'redis';

export default class CacheClient {
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

  set(type, key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(type + ':' + key, JSON.stringify(value), (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
  }

  setex(type, key, seconds, value) {
    return new Promise((resolve, reject) => {
      this.client.setex(type + ':' + key, seconds, JSON.stringify(value), (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
  }

  get(type, key): any {
    return new Promise((resolve, reject) => {
      this.client.get(type + ':' + key, (err, reply) => {
        if (err) {
          reject(err);
        }
        if (reply) {
          const o = JSON.parse(reply);
          resolve(o);
        } else {
          resolve(null);
        }
      });
    });
  }

  del(type, key) {
    return new Promise((resolve, reject) => {
      this.client.del(type + ':' + key, (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
  }

  expire(type, key, seconds) {
    return new Promise((resolve, reject) => {
      this.client.expire(type + ':' + key, seconds, (err, reply) => {
        if (err) {
          reject(err);
        }
        resolve(reply);
      });
    });
  }

  mget(type, keys) {
    return new Promise((resolve, reject) => {
      const typeKeys = [];
      keys.forEach(key => {
        typeKeys.push(type + ':' + key);
      });
      this.client.mget(typeKeys, (err, replies) => {
        if (err) {
          reject(err);
        }

        if (replies != null) {
          const objects = [];
          replies.forEach(reply => {
            const o = JSON.parse(reply);
            objects.push(o);
          });
          resolve(objects);
        } else {
          resolve(null);
        }
      });
    });
  }
}

export const defaultCacheClient = new CacheClient();
