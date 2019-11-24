import { Document } from 'mongoose';

export interface IAddressDocument extends Document {
  id?: string;
  title: string;
  place: string;
	cords: [string, string];
	cranes: {
    marks: string[];
    series: string[];
  }
}

export interface IAddress {
  id?: string;
	title: string;
  cords: [string, string];
  place: string;
	cranes: {
    marks: string[];
    series: string[];
  }
}

export interface IBuilding {
  id?: string;
  title: string;
  x: string;
  y: string;
  place: string;
  marks: string;
  series: string;
}