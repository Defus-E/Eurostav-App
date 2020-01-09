import { Request, Response, NextFunction } from 'express';
import HttpError from '../error';

export default class ErrorConroller {
	public static routes(req: Request, res: Response, next: NextFunction) {
		return next(new HttpError(404, "Страница не найдена!"));
	}
}