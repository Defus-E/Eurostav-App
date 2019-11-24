import { Schema, Model, Types, model } from 'mongoose';
import { IAddressDocument, IAddress } from '../interfaces/IAddressDocument';

export interface IAddressModel extends Model<IAddressDocument> {
  get(place: string): IAddressDocument[];
	upload(count: number, place: string): IAddressDocument[];
	add(data: IAddress): IAddressDocument;
  edit(data: IAddress): IAddressDocument;
  delete(id: string, place: string): number;
  search(place: string, searchString: string): { addresses: IAddressDocument[], total: boolean };
}

const schema: Schema = new Schema({
  title: {
    type: String,
    unique: true,
    required: true
  },
  place: {
    type: String,
    required: true
  },
  cords: {
    type: [String],
    required: true
  },
  cranes: {
    marks: {
      type: [String],
      required: true
    },
    series: {
      type: [String],
      required: true
    }
  }
});

// Statics
schema.static('get', async (place: string) => {
  const addresses = await Address.find({ place }).limit(10).exec();
  return addresses;
});

schema.static('add', async (data: IAddressDocument) => {
  if (!data) throw new AddressError('Отсутствие данных для дальнейшей обработки запроса.');
  if (!data.title || !data.cords || !data.cranes || !data.place) throw new AddressError("Данные заполнены не полностью.");

  const { title, cords, cranes, place } = data;
  const doubleTitle = await Address.findOne({ title }).exec();

  if (doubleTitle)
    throw new AddressError("Локация должна быть уникальнойю");

  const address = new Address({
    title,
    cords,
    cranes,
    place
  });

  return address.save();
});

schema.static('edit', async (data: IAddressDocument) => {
  if (!data) throw new AddressError('Отсутствие данных для дальнейшей обработки запроса.');
  if (!data.id || !data.title || !data.cords || !data.cranes || !data.place) throw new AddressError("Данные заполнены не полностью.");
  if (!Types.ObjectId.isValid(data.id)) throw new AddressError("Неверный индентификатор.");

  const { id, title, cords, cranes, place } = data;
  const address = await Address.findById(id).exec();
  const doubleTitle = await Address.find({ title }).exec();

  if (doubleTitle.length > 1)
    throw new AddressError("Локация должна быть уникальной.");

  address.title = title;
  address.place = place;
  address.cords = cords;
  address.cranes = cranes;

  return address.save();
});

schema.static('upload', async (count: number, place: string) => {
  if (!count || !place) throw new AddressError('Данные заполнены не полностью.');

  const addresses = await Address.aggregate([
    { $match: { place } },
    { $skip: count },
    { $limit: 10 }
  ]).exec();

  return addresses;
});

schema.static('delete', async (id: string, place: string) => {
  if (!Types.ObjectId.isValid(id)) throw new AddressError("Неверный индентификатор.");

  await Address.findByIdAndRemove(id).exec();
  return await Address.countDocuments({ place});
});

schema.static('search', async (place: string, searchString: string) => {
	const response: { addresses: IAddressDocument[], total: boolean } = { addresses: [], total: false};

	if (searchString.trim() == '') {
		response.addresses = await Address.find({ place }).limit(10).exec();
		response.total = response.addresses.length === 10;
	} else {
		response.addresses = await Address.aggregate([{ $match: { title: { $regex: new RegExp('^' + searchString, 'gi') }, place: place } }]);
		response.total = false;
  }
  
	return response;
});

export const Address: IAddressModel = model<IAddressDocument, IAddressModel>("Addr", schema);

// Address Error Handler
class AddressError extends Error {
  public message: string;

	constructor(message: string) {
		super(...arguments);

		Error.captureStackTrace(this, AddressError);
		Object.setPrototypeOf(this, AddressError.prototype);

		this.message = message;
	}

	get name() {
		return 'AddressError';
	}
}

export { AddressError };