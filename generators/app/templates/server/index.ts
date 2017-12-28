import * as path from 'path';
import * as fs from 'fs';
import * as morgan from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as methodOverride from 'method-override';
import * as http from 'http';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';

// GENERATOR_PLACEHODER_REDIS_SESSION_INDEX_1
// GENERATOR_PLACEHODER_GRAPHQL_SERVER_INDEX_1

const config = require('./../config');

// GENERATOR_PLACEHODER_REDIS_SESSION_INDEX_2

export default class Server {
  private _app;
  private _rootRouter = express.Router();

  public start() {
    // GENERATOR_PLACEHODER_REDIS_SESSION_INDEX_3
    const app = express();
    app.disable('x-powered-by');
    this._app = app;
    this.mountMiddlewares(app);
    const server = http.createServer(app);
    server.listen(config.serverPort, () => {
      console.log(`server started at port ${config.serverPort}.`);
    });
  }

  private mountControllers(controllerPath, baseUrlPath = '/') {
    const fullPath = path.resolve(__dirname) + controllerPath;
    this.loadControllersRecursive(fullPath, baseUrlPath);
    this._app.use(baseUrlPath, this._rootRouter);
  }

  private loadControllersRecursive(dir, url) {
    try {
      if (!fs.existsSync(dir)) {
        return;
      }
      fs.readdirSync(dir).forEach(file => {
        const path = dir + '/' + file;
        const stats = fs.lstatSync(path);
        if (stats.isDirectory()) {
          let baseUrl = url;
          if (baseUrl === '/') {
            baseUrl = baseUrl + file;
          } else {
            baseUrl = baseUrl + '/' + file;
          }
          this.loadControllersRecursive(path, baseUrl);
        } else if (/\.(js)$/.test(path)) {
          const router = express.Router();
          require(path).default(this._app, router);
          this._rootRouter.use(url, router);
        }
      });
    } catch (err) {
      console.log(err.stack);
    }
  }

  mountMiddlewares(app) {
    app.use(morgan('dev'));

    const staticPath = process.cwd() + '/client/static';
    app.use(express.static(staticPath));

    app
      .use(cookieParser())
      .use(compression({}))
      .use(bodyParser.json())
      .use(methodOverride())
      .use(
        bodyParser.urlencoded({
          extended: true
        })
      );

    app.use((req, res, next) => {
      if (req && req.headers.authorization && req.headers.authorization.indexOf('Bearer') === 0) {
        app.use(passport.initialize());
        passport.authenticate('bearer', {session: false})(req, res, next);
      } else {
        const sessionMiddleware = express.Router();
        sessionMiddleware.use(
          session({
            cookie: {maxAge: 60000 * 60 * 24},
            // GENERATOR_PLACEHODER_REDIS_SESSION_INDEX_4
            secret: 'full',
            resave: true,
            rolling: true,
            saveUninitialized: true
          })
        );
        sessionMiddleware.use(passport.initialize());
        sessionMiddleware.use(passport.session());
        sessionMiddleware(req, res, next);
      }
    });

    this.mountControllers('/controllers');

    // GENERATOR_PLACEHODER_GRAPHQL_SERVER_INDEX_2

    return null;
  }
}
