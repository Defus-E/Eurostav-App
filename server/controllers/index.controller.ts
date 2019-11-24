import { Router as ExpressRouter } from 'express';
import RootController from './root.controller';
import NewsController from './news.controller';
import UserController from './user.controller';
import TablesController from './tables.controller';
import SafetyController from './safety.controller';
import SettingsController from './settings.controller';
import AuthorizeController from './authorize.controller';
import ArchiveController from './archive.controller';
import AddressController from './address.controller';
import LoadController from './load.controller';

import { Urls } from '../constans/Urls';

export default class Router {
	private static _router: ExpressRouter = ExpressRouter();

	public static get routes() {
		this._router.use(Urls.main, RootController.routes());
		this._router.use(Urls.news, NewsController.routes());
		this._router.use(Urls.login, AuthorizeController.routes());
		this._router.use(Urls.workers, UserController.routes());
		this._router.use(Urls.tables, TablesController.routes());
		this._router.use(Urls.settings, SettingsController.routes());
		this._router.use(Urls.safety, SafetyController.routes());
		this._router.use(Urls.building, AddressController.routes());
		this._router.use(Urls.archive, ArchiveController.routes());
		this._router.use(Urls.load, LoadController.routes());
		
		return this._router;
	}
}