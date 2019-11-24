import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IRequest } from '../interfaces/IRequest';
import checkAuth from '../middleware/checkAuth';

export default class RootConroller {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes(path: string = '/') {
		this._router.get(`${path}`, checkAuth, this.getNewsPage);
		this._router.get(`${path}map`, checkAuth, this.getMapPage);
		this._router.get(`${path}login`, this.getLoginPage);

		return this._router;
	}

	private static getNewsPage(req: Request, res: Response, next: NextFunction) {
		res.redirect('/news');
	}

	private static getLoginPage(req: IRequest, res: Response, next: NextFunction) {
		req.user = res.locals.user = null;
		req.session.destroy(() => res.render('login'));
	}

	private static getMapPage(req: Request, res: Response, next: NextFunction) {
		res.render('map', { place: req.session.place });
	}
}