import { Document } from 'mongoose';

export interface INewDocument extends Document {
	id?: string;
	title: string;
	content: string;
	date: Date
}