import { Document } from 'mongoose';

export interface IUserDocument extends Document {
	id?: string;
	firstname?: string;
	lastname?: string;
	middlename?: string;
	username: string;
	login: string;
	isAdmin: boolean;
	salt?: string;
	hashedPassword?: string;
	password: string;
	dob?: Date;
	location?: string;
	residence?: string;
	crimrecord?: string;
	nationality?: string;
	phoneUA?: string;
	phoneCZ?: string;
	education?: string;
	addressCZ?: string;
	experience?: string;
	skills?: string;
	documents?: string;
	currentposition?: string;
	notation?: string;
	avatar?: string;
	clearPathAvatar?: string;
	businesstrips?: string;
	anotherinformation?: string;
}