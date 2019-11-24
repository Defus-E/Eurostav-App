import { Schema, Model, Types, model } from 'mongoose';
import { INewDocument } from '../interfaces/INewDocument';

export interface INewModel extends Model<INewDocument> {
  get(): INewDocument[];
  delete(id: string): number;
	add(data: INewDocument): INewDocument;
	edit(data: INewDocument): INewDocument;
	upload(count: number): INewDocument[];
}

const schema: Schema = new Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

schema.static('get', async () => {
  const news: INewDocument[] = await News.aggregate([
    { $sort: { date: -1 } },
    { $limit: 10 }
  ]).exec();

  return news;
});

schema.static('add', async (data: INewDocument) => {
  if (!data) throw new NewsError('Отсутствие данных для дальнейшей обработки запроса.');
  if (!data.title || !data.content) throw new NewsError('Данные заполнены не полностью.');

  const { title, content } = data;
  const news = new News({ title, content });

  return news.save();
});

schema.static('edit', async (data: INewDocument) => {
  if (!data) throw new NewsError('Отсутствие данных для дальнейшей обработки запроса.');
  if (!data.id || !data.title || !data.content) throw new NewsError('Данные заполнены не полностью.');
  if (!Types.ObjectId.isValid(data.id)) throw new NewsError('Неверный индентификатор.');

  const { id, title, content } = data;
  const news = await News.findById(id).exec();

  news.title = title;
  news.content = content;

  return news.save();
});

schema.static('upload', async (count: number) => {
  if (!count) return [];

  const news: INewDocument[] = await News.aggregate([
    { $sort: { date: -1 } },
    { skip: count },
    { $limit: 10 }
  ]).exec();

  return news;
});

schema.static('delete', async (id: string) => {
  if (!Types.ObjectId.isValid(id)) throw new NewsError("Неверный индентификатор.");

  await News.findByIdAndRemove(id).exec();
  return await News.countDocuments({});
});

export const News: INewModel = model<INewDocument, INewModel>("New", schema);

class NewsError extends Error {
  public message: string;

	constructor(message: string) {
		super(...arguments);

		Error.captureStackTrace(this, NewsError);
		Object.setPrototypeOf(this, NewsError.prototype);

		this.message = message;
	}

	get name() {
		return 'NewsError';
	}
}

export { NewsError };