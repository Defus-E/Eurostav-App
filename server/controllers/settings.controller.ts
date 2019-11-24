import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { User, AuthError } from '../models/user';
import { IRequest } from '../interfaces/IRequest';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';
import session = require('express-session');

export default class SafetyController {
  private static _router: ExpressRouter = ExpressRouter();

	public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getSettingsPage);
    this._router.post(`${path}add`, checkAuth, this.addAdmin);
    this._router.post(`${path}edit`, checkAuth, this.editAdmin);
    this._router.post(`${path}delete`, checkAuth, this.deleteAdmin);

		return this._router;
  }

  private static async getSettingsPage(req: Request, res: Response, next: NextFunction) {
    const admins = await User.get(true);  
    res.render('settings', { admins });
  }

  private static async addAdmin(req: Request, res: Response, next: NextFunction) {
    try {
			const data = req.body;
			const { _id, login, username } = await User.register(data, true);
	
			res.send({ 
				id: _id, 
				login: login, 
				username: username 
			});
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));

			next(err);
		}
	}
	
	private static async editAdmin(req: Request, res: Response, next: NextFunction) {
		try {
			const data = req.body;
			const { _id, login, username } = await User.edit(data);
		
			res.send({
				id: _id,
				login: login,
				username: username
			});
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));
			
			next(err);
		}
	}
	
	private static async deleteAdmin(req: IRequest, res: Response, next: NextFunction) {
		try {
			const { id } = req.body;
			const userID = req.session.user;
			User.findByIdAndRemove(id).exec();
			
			if (userID == id)  {
				req.user = res.locals.user = null;
				req.session.destroy(() => {});
				res.redirect('/login');
			} else {
				res.send({});
			}
		} catch (err) {
			
		}
	}
}