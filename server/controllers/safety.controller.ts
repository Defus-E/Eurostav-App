import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Safety } from '../models/safety';
import checkAuth from '../middleware/checkAuth';

export default class SafetyController {
  private static _router: ExpressRouter = ExpressRouter();

	public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getSafetyPage);
    this._router.get(`${path}content`, this.getSafetyContent);
    this._router.post(`${path}edit`, checkAuth, this.editSafetyContent);

		return this._router;
  }

  private static async getSafetyPage(req: Request, res: Response, next: NextFunction) {
    const content = await Safety.get();
    res.render('safety', { content });
  }

  private static async getSafetyContent(req: Request, res: Response, next: NextFunction) {
    const content = await Safety.get();
    res.send({ content });
  }

  private static async editSafetyContent(req: Request, res: Response, next: NextFunction) {
    const data = req.body;
    await Safety.edit(data);
    res.send({});
  }
}