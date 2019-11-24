import * as http from 'http';

export default class HttpError extends Error {
	public status: number;
	public reason: string;

	constructor(status: number, reason?: string) {
		super(...arguments);

		Error.captureStackTrace(this, HttpError);
		Object.setPrototypeOf(this, HttpError.prototype);

		this.status = status;
		this.reason = reason || http.STATUS_CODES[status] || "Error";
	}

	public get name() {
		return "HttpError";
	}
}