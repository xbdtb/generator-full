const passport = require('passport');
const BearerStrategy = require('passport-http-bearer');
const config = require('../../config');

export default (app, router) => {
  passport.serializeUser((user, cb) => {
    cb(null, user);
  });

  passport.deserializeUser((user, cb) => {
    cb(null, user);
  });

  passport.use(
    new BearerStrategy((token, done) => {
      if (token === config.systemBearerToken) {
        return done(null, {});
      }
    })
  );
};
