import { Response, NextFunction } from 'express';
import { IRequest } from '../interfaces/IRequest';
import { User } from '../models/user';

export default async (req: IRequest, res: Response, next: NextFunction) => {
	try {
		req.user = res.locals.user = null;
		req.place = res.locals.place = null;

		if (!req.session.user) 
			return next();
		
		const user = await User.findById(req.session.user).exec();
		req.place = res.locals.place = req.session.place;
		req.user = res.locals.user = user;

		next();
	} catch (err) {
		next(err);
	}
}