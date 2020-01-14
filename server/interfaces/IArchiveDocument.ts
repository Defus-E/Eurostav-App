import { Document } from 'mongoose';

export interface IArchiveMessage {
  salt: string;
  sender: string;
  text: string;
  image: boolean;
  time?: Date | string;
}

export interface IArchiveDocument extends Document {
  room: string;
  messages: IArchiveMessage[];
  password?: string;
  count?: number;
}