import { IUserDocument } from './IUserDocument';
import { Request } from 'express';

export interface IRequest extends Request {
	session: any;
	user?: IUserDocument;
	[key: string]: any;
}