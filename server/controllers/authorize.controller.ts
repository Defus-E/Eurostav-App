import { Router as ExpressRouter, Response, NextFunction } from 'express';
import { Archive, ArchiveError } from '../models/archive';
import { IRequest } from '../interfaces/IRequest';
import { User, AuthError } from '../models/user';
import HttpError from '../error';
import checkAuth from '../middleware/checkAuth';

export default class AuthorizeController {
	private static _router: ExpressRouter = ExpressRouter();

	public static routes (path: string = '/') {
		this._router.post(`${path}add`, checkAuth, this.addAuthToChat);
		this._router.post(`${path}chat`, this.authorizeToChat);
		this._router.post(`${path}admin`, this.authorizeAdmin);
		this._router.post(`${path}user`, this.authorizeUser);

		return this._router;
	}

	private static async authorizeAdmin(req: IRequest, res: Response, next: NextFunction) {
		try {
			const data = req.body;
 			const { _id } = await User.authorize(data, true);

			req.session.user = _id;
			req.session.place = 'Чехия';
			res.send({});
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));

			next(err);
		}
	}

	private static async authorizeUser(req: IRequest, res: Response, next: NextFunction) {
		try {
			const data = req.body;
			const { _id, isAdmin, username } = await User.authorize(data, false);

			res.send({
				id: _id, 
				isAdmin: isAdmin, 
				username: username
			});
		} catch (err) {
			if (err instanceof AuthError) {
				return next(new HttpError(403, err.message));
			}

			next(err);
		}
	}

	private static async addAuthToChat(req: IRequest, res: Response, next: NextFunction) {
    try {
      const data: { room: string, password: string, confirm: string } = req.body;
			const room: string = await Archive.addAuth(data);

      res.send({ room });
    } catch (err) {
      if (err instanceof ArchiveError)
				return next(new HttpError(403, err.message));

			next(err);
    }
  }
	
	private static async authorizeToChat(req: IRequest, res: Response, next: NextFunction) {
    try {
      const { roomId, psswd } = req.body;
			await Archive.auth(roomId, psswd);
      res.send({});
    } catch (err) {
      if (err instanceof ArchiveError)
				return next(new HttpError(err.status, err.message));

			next(err);
    }
	}
}