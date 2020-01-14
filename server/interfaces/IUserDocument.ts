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
	tabled?: boolean;
	tables?: ITable[]
}

export interface ITable {
	date: Date;
	phone: string;
	lunch: string;
	coming: string;
	leaving: string;
	address: string;
	crane: string;
	login: string;
	day: number;
}

export interface IGrouppedTable {
	addresses: unknown[],
	tablesForAddress: ITable[],
	staticData: staticData,
	date: string
}

export interface staticData {
	login: string;
	username: string;
	phones: unknown[];
	cranes: unknown[];
}

export interface ITableChange {
  date: string;
  address: string;
  login: string;
  staticData: {
    day: string;
    coming: string;
    leaving: string;
    lunch: string;
  }[];
}

export interface IUserNames {
  _id: any;
  username: string;
  login: string;
  address?: string;
  tables?: ITable[];
  phones?: string[];
  cranes?: string[];
  date?: string;
}