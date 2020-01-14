import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { User, AuthError, IUser } from '../models/user';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';

import * as formidable from 'formidable';
import * as path from 'path';

export default class UserController {
	private static _router: ExpressRouter = ExpressRouter();
	private static _totalcount_a: number;
	private static _totalcount_w: number;

	public static routes (path: string = '/') {
		this._router.get(`${path}`, checkAuth, this.getWorkersPage.bind(this));
		this._router.get(`${path}list`, this.getUsersList.bind(this));
		this._router.get(`${path}profile`, checkAuth, this.getUserProfile);
		this._router.post(`${path}place`, checkAuth, this.changePlace);
		this._router.post(`${path}search`, checkAuth, this.searchWorker);
		this._router.post(`${path}profile/save`, checkAuth, this.saveUserProfile);
		this._router.post(`${path}add`, checkAuth, this.addUser.bind(this));
		this._router.post(`${path}edit`, checkAuth, this.editUser.bind(this));
		this._router.post(`${path}delete`, checkAuth, this.deleteUser.bind(this));
		this._router.post(`${path}upload`, this.uploadUsers.bind(this));
		this._router.post(`${path}upload_w`, this.uploadWorkers.bind(this));

		return this._router;
	}

	private static async getUsersList(req: Request, res: Response, next: NextFunction) {
		const users = await User.list();
		const total = await User.countDocuments({});
			
		this._totalcount_a = total;

		res.send({ users, total });
	}

	private static async getWorkersPage(req: Request, res: Response, next: NextFunction) {
		try {
			const workers = await User.get(false);
			const count = await User.countDocuments({ isAdmin: false });
			
			this._totalcount_w = count;
		
			res.render('workers', {
				workers,
				total_count: count
			});
		} catch (err) {
			next(err);
		}
	}

	private static async changePlace(req: Request, res: Response, next: NextFunction) {
		const { place } = req.body;
		
		if (!place || place !== 'Чехия' && place !== 'Словакия') {
			next(new HttpError(404, 'Отсутствие нужных данных.'));
		} else {
			req.session.place = place;
			res.send({});
		}
	}

	private static async searchWorker(req: Request, res: Response, next: NextFunction) {
		const { searchString } = req.body;
		const response: { workers: IUser[], total: boolean } = await User.search(searchString);
		console.log(response);
		res.send(response);
	}

	private static async addUser(req: Request, res: Response, next: NextFunction) {
		try {
			const data = req.body;
			const { _id, login, username } = await User.register(data, false);
	
			res.send({ 
				id: _id, 
				login: login, 
				username: username 
			});
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));

			next(err);
		}
	}

	private static async editUser(req: Request, res: Response, next: NextFunction) {
		try {
			const data = req.body;
			const { _id, login, username } = await User.edit(data);
		
			res.send({
				id: _id,
				login: login,
				username: username
			});
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));
			
			next(err);
		}
	}

	private static async deleteUser(req: Request, res: Response, next: NextFunction) {
		try {
			const id: string = req.body.id;
      const count = await User.delete(id);

      this._totalcount_a = count;
      
      res.send({ total_count: count });
		} catch (err) {
			if (err instanceof AuthError)
				return next(new HttpError(403, err.message));
			
			next(err);
		}
	}

	private static async uploadUsers(req: Request, res: Response, next: NextFunction) {
		try {
			const count: number = +req.body.count;
			const workers = await User.upload(count, false);
			const total_count: number = await User.countDocuments({ isAdmin: false });
			const total: boolean = count + 10 >= this._totalcount_a;

			res.send({
				workers,
				total
			});
		} catch (err) {
			next(err);
		}
	}

	private static async uploadWorkers(req: Request, res: Response, next: NextFunction) {
		try {
			const count: number = +req.body.count;
			const workers = await User.upload(count, true);
			const total: boolean = count + 10 >= this._totalcount_w;

			res.send({
				workers,
				total_elements: total
			});
		} catch (err) {
			next(err);
		}
	}

	private static async getUserProfile(req: Request, res: Response, next: NextFunction) {
		try {
			const { id, npage } = req.query;
			const response = await User.info(id);
			const props: string[] = [
				'middlename', 'dob', 'location', 'residence', 'crimrecord', 'nationality', 
				'phoneUA', 'phoneCZ', 'education', 'addressCZ', 'experience', 'skills', 'documents', 'currentposition', 
				'notation', 'businesstrips', 'anotherinformation', 'avatar'
			];

			response.salt = undefined;
			response.hashedPassword = undefined;
		
			for (let i = 0; i < props.length; i++)
				if (!response[props[i]] || response[props[i]] == null || response[props[i]] == undefined) 
					response[props[i]] = '';

			npage === 'true' ? res.send(response) : res.render('profile', response);
    } catch (err) {
      next(new HttpError(404, 'Страница не найдена!'));
    }
	}

	private static async saveUserProfile(req: Request, res: Response, next: NextFunction) {
		const form: formidable = new formidable.IncomingForm();
		const salt: string = Math.floor(Math.random() * 1e8) + '';
		const validImageTypes: string[] = ['image/tiff', 'image/jpeg', 'image/png', 'image/webp', 'image/pjpeg'];
		let filename: string;

		form.parse(req, (err, fields, files) => {
			try {
				if (filename === '') return res.send(412);
				let image: string = filename ? `/img/avatars/${filename}` : null;

				User.profile(fields, image);
				res.send({});
			} catch (err) {
				(err instanceof AuthError) ? next(new HttpError(406, err.message)) : next(err);
			}
		});

		form.on('fileBegin', (name: string, file) => {
			if (!validImageTypes.includes(file.type)) return filename = '';
			filename = salt + file.name[0] + '.' + file.name.match(/[^.]*$/g)[0];
			file.path = path.join(__dirname, `../public/img/avatars/${filename}`);
		});
	}
}