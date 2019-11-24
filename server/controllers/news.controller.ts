import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { INewDocument } from '../interfaces/INewDocument';
import { News, NewsError } from '../models/new';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';

export default class NewsController {
  private static _router: ExpressRouter = ExpressRouter();
  private static _totalcount: number;

	public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getNewsPage.bind(this));
    this._router.get(`${path}get`, this.getNewsList.bind(this));
    this._router.get(`${path}content`, this.getContentNews.bind(this));
		this._router.post(`${path}add`, checkAuth, this.addNews.bind(this));
		this._router.post(`${path}edit`, checkAuth, this.editNews.bind(this));
		this._router.post(`${path}delete`, checkAuth, this.deleteNews.bind(this));
		this._router.post(`${path}upload`, this.uploadNews.bind(this));

		return this._router;
  }
  
  private static async getNewsPage(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await News.get();
      this._totalcount = await News.countDocuments({});
      
      res.render("news", {
        news: news,
        total_count: this._totalcount
      });
    } catch (err) {
      next(err);
    }
  }

  private static async getNewsList(req: Request, res: Response, next: NextFunction) {
    try {
      const news = await News.get();
      this._totalcount = await News.countDocuments({});

      res.send({
        news: news,
        total_count: this._totalcount
      });
    } catch (err) {
      next(err);
    }
  }

  private static async addNews(req: Request, res: Response, next: NextFunction) {
    try {
      const data: INewDocument = req.body;
      const news: INewDocument = await News.add(data);
  
      res.send({
        news: news,
        total_count: this._totalcount
      });
    } catch (err) {
      if (err instanceof NewsError)
        return next(new HttpError(406, err.message));
        
			next(err);
    }
  }

  private static async editNews(req: Request, res: Response, next: NextFunction) {
    try {
      const data: INewDocument = req.body;
      const news: INewDocument = await News.edit(data);
  
      res.send({ news });
    } catch (err) {
      if (err instanceof NewsError) 
        return next(new HttpError(406, err.message));

			next(err);
    }
  }

  private static async deleteNews(req: Request, res: Response, next: NextFunction) {
    try {      
      const id: string = req.body.id;
      const count = await News.delete(id);

      this._totalcount = count;
      res.send({ total_count: count });
    } catch (err) {
      if (err instanceof NewsError) 
        return next(new HttpError(406, err.message));

			next(err);
    }
  }

  private static async uploadNews(req: Request, res: Response, next: NextFunction) {
    const count: number = +req.body.count;
    const news: INewDocument[] = await News.upload(count);
    const total_elements: boolean = count + 10 >= this._totalcount;

    res.send({
      news,
      total_elements
    });
  }

  private static async getContentNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      const news = await News.findById(id).exec();
      
      res.send({ news });
    } catch (err) {
      res.send({ news: '' });
    }
  }
}