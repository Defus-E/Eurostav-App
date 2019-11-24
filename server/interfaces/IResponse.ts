import { Response } from 'express';

export interface Error {
	status?: number;
}

export interface IResponse extends Response {
	sendHttpError(error: Error): void;
}