import { Request, NextFunction } from 'express';
import { Error, IResponse } from '../interfaces/IResponse';

export default (req: Request, res: IResponse, next: NextFunction) => {
	res.sendHttpError = (error: Error) => {
		res.status(error.status);

		let xhr: boolean = req.xhr;
		let accpt: string = req.headers.accept;
		
		if (!accpt || xhr || accpt.indexOf('json') > -1) {
			res.json(error);
		} else {
			res.render("error", { error: error });
		}
	};

	next();
}