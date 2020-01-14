import { Schema, Model, model } from 'mongoose';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { IArchiveMessage, IArchiveDocument } from '../interfaces/IArchiveDocument';

export interface IRoomId {
  sr: string;
  rs: string;
} 

export interface IArchiveModel extends Model<IArchiveDocument> {
  add(roomId: any, salt: string, sender: string, text: string, image: boolean): IArchiveMessage
  get(roomId: any): IResponseMessages;
  auth(roomId: string, password: string): void;
  addAuth(data: { room: string, password: string, confirm: string }): string;
  upload(roomId: string | IRoomId): IResponseMessages;
  delete(roomId: string | IRoomId, salt: string): string
}

export interface IResponseMessages { 
  messages?: IArchiveMessage[];
  total?: boolean;
  [key: string]: any;
}

const schema: Schema = new Schema({
  room: {
    type: String,
    required: true,
    unique: true
  },
  messages: [{
    salt: String,
    sender: String,
    text: String,
    image: Boolean,
    time: Date
  }],
  password: String
});

let count = -10;

schema.static('add', async (roomId: string | IRoomId, salt: string, sender: string, text: string, image: boolean): Promise<IArchiveMessage> => {
  let sr: string, rs: string, all: string;
  let response: IArchiveDocument;

  if (typeof roomId === 'string') {
    sr = null;
    rs = null;
    all = roomId;
  } else {
    sr = roomId.sr;
    rs = roomId.rs;
    all = null;
  }

  const archive = await Archive.findOne({room: {$in: [sr, rs, all]}}).exec();

  if (!archive) {
    const newArchive: IArchiveDocument = new Archive({
      room: sr || roomId,
      messages: [{ salt, sender, image, text, time: new Date() }]
    });

    response = await newArchive.save();
  } else {
    archive.messages.push({ salt, sender, image, text, time: new Date() });
    response = await archive.save();
  }

  return response.messages[response.messages.length - 1];
});

schema.static('get', async (roomId: string | IRoomId) => {
  let sr: string, 
      rs: string, 
      room: string;

  if (!roomId) {
    throw new ArchiveError('Индентификатор комнаты не обнаружен.');
  } else if (typeof roomId === 'string') {
    sr = null;
    rs = null;
    room = roomId;
  } else {
    sr = roomId.sr;
    rs = roomId.rs;
    room = null;
  }

  count = -10;
  
  const archive: IArchiveDocument[] = await Archive.aggregate([
    { $match: { room: {$in: [sr, rs, room]} } },
    {
      $project: {
        count: { $size: "$messages", },
        messages: { $slice: ['$messages', -10] }
      }
    }
  ]).exec();

  const response: IResponseMessages = {};

  if (archive.length < 1) {
    response.messages = [];
    response.total = true;

    return response;
  }

  const messages = archive[0].messages;
  const length = archive[0].count;

  if (10 >= length) {
    response.messages = messages;
    response.total = true;
  } else {
    response.messages = messages;
    response.total = false;
  }

  return response;
});

schema.static('upload', async (roomId: string | IRoomId) => {
  let sr: string,
      rs: string,
      room: string;

  if (!roomId) {
    throw new ArchiveError('Индентификатор комнаты не обнаружен.');
  } else if (typeof roomId === 'string') {
    sr = null;
    rs = null;
    room = roomId;
  } else {
    sr = roomId.sr;
    rs = roomId.rs;
    room = null;
  }

  count -= 10;

  const archive: IArchiveDocument[] = await Archive.aggregate([
    { $match: { room: {$in: [sr, rs, room]} } },
    { 
      $project: { 
        count: { $size: "$messages" }, 
        messages: { $slice: ['$messages', count, 10] } 
      } 
    }
  ]).exec();

  const response: IResponseMessages = {};
  const messages = archive[0].messages;
  const length = archive[0].count;

  if (-count >= length) {
    response.messages = messages;
    response.total = true;
  } else {
    response.messages = messages;
    response.total = false;
  }

  return response;
});

schema.static('delete', async (roomId: string | IRoomId, salt: string) => {
  let sr: string,
      rs: string,
      all: string;

  if (!roomId || !salt) {
    throw new ArchiveError('Индентификатор комнаты или сообщения не обнаружен.');
  } else if (typeof roomId === 'string') {
    sr = null;
    rs = null;
    all = roomId;
  } else {
    sr = roomId.sr;
    rs = roomId.rs;
    all = null;
  }

  const archive: IArchiveDocument = await Archive.findOne({room: {$in: [sr, rs, all]}}).exec();
  const element: IArchiveMessage = archive.messages.find(message => message.salt === salt);
  const index: number = archive.messages.findIndex(message => message.salt === salt);

  if (element.image && element.text !== '') rimraf(path.join(__dirname, '../public/img/chat', element.text.match(/\/([^\/]+)\/?$/)[1]), () => {});
  if (index >= 0) archive.messages.splice(index, 1);
    
  archive.save();

  return salt;
});

schema.static('addAuth', async (data: { room: string, password: string, confirm: string }) => {
  if (!data) throw new ArchiveError('Отсутствие данных для дальнейшей обработки запроса.');
  
  const { room, password, confirm } = data;
  const archive = await Archive.findOne({ room }).exec();

  if (!archive) {
    const newArchive: IArchiveDocument = new Archive({
      room: room,
      messages: [],
      password: password
    });

    newArchive.save();
    return room;
  } else if (password !== confirm) {
    throw new ArchiveError('Пароли не совпадают.');
  } else {
    archive.password = password;
    archive.save();
    return room;
  }
});

schema.static('auth', async (roomId: string, password: string) => {
  const archive = await Archive.findOne({ room: roomId }).exec();

  if (!archive) throw new ArchiveError('Комната не найнена.', 404);
  if (archive.password !== password) throw new ArchiveError('Неверный пароль.', 403);
});

export const Archive: IArchiveModel = model<IArchiveDocument, IArchiveModel>("Archive", schema);

class ArchiveError extends Error {
  public status: number;
  public message: string;
  
	constructor(message: string, status?: number) {
		super(...arguments);

		Error.captureStackTrace(this, ArchiveError);
		Object.setPrototypeOf(this, ArchiveError.prototype);

    this.message = message;
    this.status = status;
	}

	get name() {
		return 'AuthError';
	}
}

export { ArchiveError };