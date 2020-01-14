import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Archive, IRoomId, ArchiveError } from '../models/archive';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';

export default class ArchiveController {
  private static _router: ExpressRouter = ExpressRouter();

  public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getChatPage);
    this._router.post(`${path}get`, this.getMessages.bind(this));
    this._router.post(`${path}upload`, this.uploadMessages);

		return this._router;
  }

  public static generateRoomId(idSender: string, idReciever: string): IRoomId | string {
    const roomId: IRoomId = {
      sr: `${idSender}&&${idReciever}`,
      rs: `${idReciever}&&${idSender}`
    };

    return idReciever === 'all' ? 'all' : idReciever === 'czech' ? 'czech' : idReciever === 'slovakia' ? 'slovakia' : roomId;
  }

  private static async getChatPage(req: Request, res: Response, next: NextFunction) {
    const { messages, total } = await Archive.get('all');
    res.render('chat', { messages, total });
  }

  private static async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { idSender, idReciever } = req.body;
      const room = this.generateRoomId(idSender, idReciever);
      const { messages, total } = await Archive.get(room);
      
      res.send({ messages, total, serverTime: new Date() });
    } catch (err) {
      if (err instanceof ArchiveError)
				return next(new HttpError(404, err.message));

			next(err);
    }
  }

  private static async uploadMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.body;
      const { messages, total } = await Archive.upload(roomId);

      res.send({ messages, total });
    } catch (err) {
      if (err instanceof ArchiveError)
				return next(new HttpError(404, err.message));

			next(err);
    }
  }
}