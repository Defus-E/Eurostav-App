import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { Table, TableError } from '../models/table';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';
import CreateTable from './html';
import * as pdf from 'html-pdf';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as fs from 'fs';

export default class TablesController {
  private static _router: ExpressRouter = ExpressRouter();

	public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getTablesPage.bind(this));
    this._router.get(`${path}list`, this.getTablesList);
    this._router.post(`${path}change`, checkAuth, this.changeTable);
    this._router.post(`${path}archive`, checkAuth, this.archiveTable.bind(this));
    this._router.post(`${path}info`, this.getInfoForTable);
    this._router.post(`${path}add`, this.addTable);

		return this._router;
  }

  private static async getTablesPage(req: Request, res: Response, next: NextFunction) {
    try {
      const params: { date?: string, worker?: string, address?: string } = req.query;

      if (Object.keys(params).length < 1) {
        const response = await Table.fetch();

        res.render('tables', response);
      } else if (params.date && (!params.worker && !params.address)) {
        const dataDate: string = params.date;
        const response = await Table.workers(dataDate);

        res.render('tableWs', response);
      } else if (params.date && params.worker && !params.address) {
        const { date, worker } = params;
        const response = await Table.worker(date, worker);

        res.render('tableW', response);
      } else if (params.date && params.worker && params.address) {
        const { date, worker, address } = params;
        const response = await Table.address(date, worker, address);

        res.send(response);
      } else {
        next(new HttpError(404, 'Страница не найдена!'));
      }
    } catch (err) {
      next(new HttpError(404, 'Страница не найдена!'));
    }
  }

  private static async archiveTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.body;
      const options = { format: 'Letter' };
      const tables = await Table.archive(date);

      if (!tables)
        return next(new HttpError(404, "К сожалению, никто ещё не отметился на этом месяце."));

      mkdirp(path.join(__dirname, `../tables/html`));
      mkdirp(path.join(__dirname, `../tables/${date}`), err => {
        if (err) return console.error(err);

        for (let i = 0; i < tables.length; i++) {
          const html: string = CreateTable(tables[i]);
          const file_w = fs.writeFileSync(path.join(__dirname, `../tables/html/$${i}index.html`), html);
          const file_r = fs.readFileSync(path.join(__dirname, `../tables/html/$${i}index.html`), 'utf-8'); 

          pdf.create(file_r, options).toFile(path.join(__dirname, `../tables/${date}/${tables[i].login}-${tables[i].address}.pdf`), err => 0);
        }

        rimraf(path.join(__dirname, `../tables/html`), () => res.send({}));
      });
    } catch (err) {
      if (err instanceof TableError) return next(new HttpError(406, err.message));
			next(err);
    }
  }

  private static async getTablesList(req: Request, res: Response, next: NextFunction) {
    const tables = await Table.get();
    res.send({ tables });
  }

  private static async changeTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      await Table.change(data);
      res.send({});
    } catch (err) {
      if (err instanceof TableError) return next(new HttpError(406, err.message));
			next(err);
    }
  }

  private static async addTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      await Table.add(data);
      res.send({});
    } catch (err) {
      if (err instanceof TableError) return next(new HttpError(406, err.message));
			next(err);
    }
  }

  private static async getInfoForTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, date } = req.body;
      const info = await Table.info(id, date);
      res.send({ info })
    } catch (err) {
      if (err instanceof TableError) return next(new HttpError(406, err.message));
			next(err);
    }
  }
}