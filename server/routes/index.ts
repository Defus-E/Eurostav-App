import { Router as ExpressRouter } from 'express';
import IndexController from '../controllers/index.controller';
import ErrorController from '../controllers/error.controller';

export default class Router {
	private static _router: ExpressRouter = ExpressRouter();

	public static get routes() {
		this._router.use('/', IndexController.routes);
		this._router.use('*', ErrorController.routes);

		return this._router;
	}
}