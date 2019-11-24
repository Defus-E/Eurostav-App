import * as crypto from 'crypto';
import * as rimraf from 'rimraf';
import { Schema, Model, Types, model } from 'mongoose';
import { IUserDocument } from '../interfaces/IUserDocument';

export interface IUser extends IUserDocument {
	encryptPassword(password: string): string;
	checkPassword(password: string): boolean;
}

export interface IUserModel extends Model<IUser> {
	authorize(data: IUser, admin: boolean): IUser;
	register(data: IUser, admin: boolean): IUser;
	profile(data: IUser): IUser;
	edit(data: IUser): IUser;
	delete(id: string): number;
	get(admin: boolean): IUser[];
	search(searchString: string): { workers: IUser[], total: boolean };
	avatar(login: string, path: string, clearPath: string): void;
	info(id: string): IUser;
	upload(count: number, onlyWorkers: boolean): IUser[];
	list(): IUser[];
}

interface IUploadAggr {
	$sort?: { username: number };
	$skip?: number;
	$project?: { login: number, username: number };
	$limit?: number;
	$match?: { isAdmin: boolean }
}

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
	anotherinformation: String
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

schema.static('avatar', async (login: string, path: string, clearPath: string) => {
	const worker = await User.findOne({ login }).exec();

	if (worker.clearPathAvatar && worker.clearPathAvatar !== '')
		await rimraf(worker.clearPathAvatar, () => {});
	
	worker.clearPathAvatar = clearPath;
	worker.avatar = path;
	worker.save();
});

schema.static('list', async () => {
	const workers = await User.aggregate([
		{ $project: { username: 1, login: 1 } },
		{ $sort: { username: 1 } },
		{ $limit: 10 }
	]).exec();
	
	return workers;
});

schema.static('search', async (searchString: string) => {
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

schema.static('authorize', async (data: IUser, admin: boolean) => {
	if (!data.login || admin == undefined) throw new AuthError("Данные заполнены не полностью.");

	const { login, password } = data;
	const findData: { login: string, isAdmin?: boolean } = { login };
		
	if (admin)
    findData.isAdmin = true;

	const user: IUser = await User.findOne(findData).exec();
		
	if (!user) throw new AuthError("Неверный логин");
	if (!password || !user.checkPassword(password)) throw new AuthError("Неверный пароль");
		
	return user;
});

schema.static('register', async (data: IUser, admin: boolean) => {
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

schema.static('edit', async (data: IUser) => {
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

schema.static('profile', async (data: IUser) => {
	if (!Types.ObjectId.isValid(data.id)) throw new AuthError("Неверный индентификатор.");
	
	const user = await User.findById(data.id).exec();
	const props: string[] = [
		'middlename', 'dob', 'location', 'residence', 'crimrecord', 'nationality', 
		'phoneUA', 'phoneCZ', 'education', 'addressCZ', 'experience', 'documents', 'skills', 'currentposition', 
		'notation', 'businesstrips', 'anotherinformation'
	];

	user.username = `${data.firstname} ${data.lastname}`;

	for (let i = 0; i < props.length; i++)
		user[props[i]] = data[props[i]];

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

schema.static('delete', async (id: string) => {
	if (!Types.ObjectId.isValid(id)) throw new AuthError("Неверный индентификатор.");

	await User.findByIdAndRemove(id).exec();
	return await User.countDocuments({ isAdmin: false });
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