import { Schema, Model, model } from 'mongoose';
import { ISafetyDocument } from '../interfaces/ISafetyDocument';

export interface ISafetyModel extends Model<ISafetyDocument> {
  get(): string;
  edit(data: ISafetyDocument): void;
}

const schema: Schema = new Schema({
  content: {
    type: String,
    required: true
  },
  created: {
    type: Date,
    default: Date.now
  }
});

// Static
schema.static('get', async () => {
  const safety = await Safety.findOne({}).exec();

  if (safety)
    return safety.content;

  return "";
});

schema.static('edit', async (data: ISafetyDocument) => {
  const { content } = data;
  const safety = await Safety.findOne({}).exec();

  if (safety) {
    safety.content = content;
    safety.save();
  } else {
    new Safety({ content: content }).save();
  }
});

export const Safety: ISafetyModel = model<ISafetyDocument, ISafetyModel>("Safety", schema);
