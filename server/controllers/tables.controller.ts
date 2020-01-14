import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';
import CreateTable from './html';
import * as pdf from 'html-pdf';
import * as rimraf from 'rimraf';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as fs from 'fs';
import { User, AuthError } from '../models/user';
import { ITable } from '../interfaces/IUserDocument';

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
        const { tables } = await User.fetch();
        
        res.render('tables', { tables });
      } else if (params.date && (!params.worker && !params.address)) {
        const date: string = params.date;
        const workers: { login: string, username: string }[] = await User.workers(date);

        res.render('tableWs', { date, workers });
      } else if (params.date && params.worker && !params.address) {
        const { date, worker } = params;
        const response = await User.worker(date, worker);

        res.render('tableW', response);
      } else if (params.date && params.worker && params.address) {
        const { date, worker, address } = params;
        const response = await User.address(date, worker, address);

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
      const tables = await User.archive(date);

      if (!tables)
        return next(new HttpError(404, "К сожалению, никто ещё не отметился в этом месяце."));

      mkdirp(path.join(__dirname, '../tables/html'));
      mkdirp(path.join(__dirname, `../tables/${date}`), err => {
        if (err) return console.error(err);

        for (let i = 0; i < tables.length; i++) {
          const table = tables[i];
          const html = CreateTable(table);
          const file_w = fs.writeFileSync(path.join(__dirname, `../tables/html/$${i}index.html`), html);
          const file_r = fs.readFileSync(path.join(__dirname, `../tables/html/$${i}index.html`), 'utf-8'); 
          const _path = path.join(__dirname, `../tables/${date}/${table._id.login}/${table._id.address}.pdf`);

          pdf.create(file_r, options).toFile(_path, err => 0);
        }

        rimraf(path.join(__dirname, `../tables/html`), () => res.send({}));
      });
    } catch (err) {
      (err instanceof AuthError) ? next(new HttpError(406, err.message)) : next(err);
    }
  }

  private static async changeTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      await User.change(data);
      res.send({});
    } catch (err) {
      (err instanceof AuthError) ? next(new HttpError(406, err.message)) : next(err);
    }
  }

  private static async addTable(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      await User.add(data);
      res.send({});
    } catch (err) {
      (err instanceof AuthError) ? next(new HttpError(406, err.message)) : next(err);
    }
  }

  private static async getTablesList(req: Request, res: Response, next: NextFunction) {
    const newDate: Date = new Date();
    const date: { year: number; month: number; currentDay: number } = {
      year: newDate.getFullYear(),
      month: newDate.getMonth(),
      currentDay: newDate.getDate()
    }
    const nextSixDays: boolean = date.currentDay >= 1 && date.currentDay <= 6;
    const currentMonth: number = nextSixDays ? date.month - 1 : date.month;
    const daysInMonth: number = new Date(date.year, currentMonth, 0).getDate();
    const tables: { days: number; month: number } = { days: daysInMonth, month: currentMonth };

    res.send({ tables, nextSixDays });
  }

  private static async getInfoForTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, date } = req.body;
      const info: ITable = await User.table(id, date);
      res.send({ info });
    } catch (err) {
      (err instanceof AuthError) ? next(new HttpError(406, err.message)) : next(err);
    }
  }
}