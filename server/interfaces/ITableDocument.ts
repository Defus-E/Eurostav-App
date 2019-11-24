import { Document, Schema } from 'mongoose';

export interface IUserTable {
  _id: Schema.Types.ObjectId;
  username: string;
  phone: string;
  lunch: string;
  coming: string;
  leaving: string;
  address: string;
  crane: string;
  login?: string;
  day?: number;
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
  _id: Schema.Types.ObjectId;
  username: string;
  login: string;
  address?: string;
  otherData?: IUserTable[];
  phones?: string[];
  cranes?: string[];
  date?: string;
}

export interface IAddTable {
  date: string;
  table_d: IUserTable
}

export interface INewTable {
  date: string;
  [key: string]: any;
}

export interface ITableDocument extends Document {
  date: Date;
  saved?: boolean;
  users?: IUserTable[]
}

export interface IGrouppedTable {
  _id: { 
    year: number;
    month: number;
  };
  doc: INewTable[];
  count: number;
}

export interface ITablesPerMonth {
  tables?: IGrouppedTable[];
  total_elements?: boolean;
}

export interface IDate {
  year: number;
  month: number;
  currentDay?: number;
}

export interface IUserTableChange {
  date: string;
  addresses: string[];
  tablesForAddress: IUserTable[];
  staticData: {
    phones: string[];
    cranes: string[];
    username: string;
  }
}