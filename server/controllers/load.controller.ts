import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import checkAuth from '../middleware/checkAuth';
import * as formidable from 'formidable';
import * as path from 'path';

export default class LoadController {
  private static _router: ExpressRouter = ExpressRouter();

	public static routes (path: string = '/') {
    this._router.post(`${path}chat`, this.loadImageForChat);
    this._router.post(`${path}safety`, checkAuth, this.loadImageForSafety);

		return this._router;
  }

  private static loadImageForChat(req: Request, res: Response, next: NextFunction) {
    let form: formidable = new formidable.IncomingForm();
    let salt: string = Math.floor(Math.random() * 1e8) + '';
    let pathImg: string;

    form.multiples = true;
      
    form.parse(req);
    form.on('fileBegin', (name: string, file) => {
      pathImg = `http://77.240.101.171:3000/img/chat/${salt}${file.name[0]}.${file.name.match(/[^.]*$/g)[0]}`;
      file.path = path.join(__dirname, `../public/img/chat/${salt}${file.name[0]}.${file.name.match(/[^.]*$/g)[0]}`);

      res.send({ pathImg });
    });
  }

  private static loadImageForSafety(req: Request, res: Response, next: NextFunction) {
    let form: formidable = new formidable.IncomingForm();
    let salt: string = Math.floor(Math.random() * 1e8) + '';
    let pathImg: string;

    form.multiples = true;
      
    form.parse(req);
    form.on('fileBegin', (name: string, file) => {
      pathImg = `http://77.240.101.171:3000/img/safety/${salt}${file.name[0]}.${file.name.match(/[^.]*$/g)[0]}`;
      file.path = path.join(__dirname, `../public/img/safety/${salt}${file.name[0]}.${file.name.match(/[^.]*$/g)[0]}`);

      res.send({ pathImg });
    });
  }
}