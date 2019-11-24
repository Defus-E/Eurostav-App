import * as express from 'express';
import { Request, NextFunction, Application } from 'express';
import * as path from 'path';
import * as morgan from 'morgan';
import * as helmet from 'helmet';
import * as cors from 'cors';
import * as http from 'http';
import * as mongoose from 'mongoose';
import * as statics from 'serve-static';
import * as favicon from 'serve-favicon';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';
import * as session from 'express-session';
import * as errorHandler from 'express-error-handler';

import Socket from './socket';
import HttpError from './error';
import Router from './routes';
import nconf from './config';

import sessionStore from './libs/sessionStore';
import loadUser from './middleware/loadUser';
import sendHttpError from './middleware/sendHttpError';

const PORT: number = +process.env.PORT || 3000;
const allowedOrigins: string[] = [
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8100'
];

export class App {
	private static _instance: App;
	private readonly _port: number;
	private _app: Application;
	private _db: any;

	private constructor(port: number = PORT) {
		this._app = express();
		this._port = port;

		this._app.engine('ejs', require('ejs-locals'));
		this._app.set('views', path.join(__dirname, 'views'));
		this._app.set('view engine', 'ejs');
		this._app.set('trust proxy', 1);

		this._app.use(favicon(path.join(__dirname, 'public/icons/favicon.ico')));
		this._app.use(cors({origin: allowedOrigins}));
		this._app.use(helmet());

		this._app.disable('x-powered-by');
 
		this.setHandlineMiddlewares();
		this.setCustomMiddlewares();
		this.setDataBase();
		
		this._app.use('/', Router.routes);
		this._app.use(this.errorHandler.bind(this));
	}

	public init(): void {
		const server = http.createServer(this._app).listen(this._port, () => console.log(`\x1b[32mServer started!\x1b[0m`));
		const io = Socket.init(server);
	}

	public static get Instance(): App {
		return this._instance || (this._instance = new this());
	}

	private setHandlineMiddlewares(): void {
		this._app.use(statics(path.join(__dirname, 'public')));

		this._app.use(morgan('prod'));
		this._app.use(bodyParser.urlencoded({ extended: true }));
		this._app.use(bodyParser.json());

		this._app.use(cookieParser(nconf.get('session:secret')));
		this._app.use(session({
			secret: nconf.get('session:secret'),
			name: nconf.get('session:name'),
			cookie: nconf.get('session:cookie'),
			resave: true,
    	rolling: true,
    	saveUninitialized: false,
			store: sessionStore
		}));
	}

	private setCustomMiddlewares(): void {
		this._app.use(sendHttpError);
		this._app.use(loadUser);
	}

	private setDataBase(): void {
		mongoose.connect(nconf.get('mongoose:uri'), nconf.get('mongoose:options'));
		// mongoose.set('debug', true);

		this._db = mongoose.connection;
		this._db.on('error', console.error.bind(console, 'MongoDB Connection error'));
	}

	private errorHandler(err: Error, req: Request, res: {[key: string]: any}, next: NextFunction): void {
		if (err instanceof HttpError) {
			res.sendHttpError(err);
		} else {
			console.error(err);
			if (this._app.get('env') === 'development') {
				errorHandler()(err, req, res, next);
			} else {
				err = new HttpError(500);
				res.sendHttpError(err);
			}
		}
	}
}

const app = App.Instance;
app.init();