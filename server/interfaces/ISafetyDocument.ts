import { Document } from 'mongoose';

export interface ISafetyDocument extends Document {
  content: string;
  date?: Date;
}