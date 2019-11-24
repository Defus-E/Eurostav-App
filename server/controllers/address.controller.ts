import { Router as ExpressRouter, Request, Response, NextFunction } from 'express';
import { IAddressDocument, IAddress, IBuilding } from '../interfaces/IAddressDocument';
import { Address, AddressError } from '../models/addr';
import checkAuth from '../middleware/checkAuth';
import HttpError from '../error';

export default class AddressController {
  private static _router: ExpressRouter = ExpressRouter();

  public static routes (path: string = '/') {
    this._router.get(`${path}`, checkAuth, this.getBuildingPage.bind(this));
    this._router.get(`${path}get`, this.getAddresses);
    this._router.post(`${path}add`, checkAuth, this.addBuilding.bind(this));
    this._router.post(`${path}edit`, checkAuth, this.editBuilding.bind(this));
    this._router.post(`${path}upload`, this.uploadBuilding.bind(this));
    this._router.post(`${path}delete`, checkAuth, this.deleteBuilding.bind(this));
    this._router.post(`${path}search`, checkAuth, this.searchBuilding.bind(this));

		return this._router;
  }

  private static async getBuildingPage(req: any, res: Response, next: NextFunction) {
    try {
      const place: string = req.session.place;
      const addresses: IAddressDocument[] = await Address.get(place);
      const total: number = await Address.countDocuments({ place });
  
      res.render("building", {
        addresses,
        total
      });
    } catch (err) {
      next(err);
    }
  }

  private static async addBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const body: IBuilding = req.body;
      const place: string = req.session.place;
      const data: IAddress = {
        title: body.title,
        cords: [body.x, body.y],
        place: body.place,
        cranes: {
          marks: body.marks.replace(/\s/g, '').split(','),
          series: body.series.replace(/\s/g, '').split(',')
        }
      }
      const total_count: number = await Address.countDocuments({ place: body.place });
      const address: IAddressDocument = await Address.add(data);
  
      res.send({
        place,
        address,
        total_count
      });
    } catch (err) {
      if (err instanceof AddressError)
        return next(new HttpError(403, err.message));

      next(err);
    }
  }

  private static async editBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const body: IBuilding = req.body;
      const data: IAddress = {
        id: body.id,
        title: body.title,
        cords: [body.x, body.y],
        place: body.place,
        cranes: {
          marks: body.marks.replace(/\s/g, '').split(','),
          series: body.series.replace(/\s/g, '').split(',')
        }
      }

      const addr: IAddressDocument = await Address.edit(data);

      res.send({ addr });
    } catch (err) {
      if (err instanceof AddressError)
        return next(new HttpError(403, err.message));

      next(err);
    }
  }

  private static async uploadBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const count: number = +req.body.count;
      const place: string = req.session.place;
      const addresses: IAddressDocument[] = await Address.upload(count, place);
      const total_count: number = await Address.countDocuments({ place });
      const total_elements: boolean = count + 10 >= total_count;
      
      res.send({
        addresses,
        total_elements
      });
    } catch (err) {
      if (err instanceof AddressError)
        return next(new HttpError(404, err.message));

      next(err);
    }
  }

  private static async deleteBuilding(req: Request, res: Response, next: NextFunction) {
    try {
      const id: string = req.body.id;
      const place: string = req.session.place;
      const count: number = await Address.delete(id, place);
      
      res.send({ total_count: count });
    } catch (err) {
      if (err instanceof AddressError)
        return next(new HttpError(406, err.message));

      next(err);
    }
  }

  private static async getAddresses(req: Request, res: Response, next: NextFunction) {
    if (req.query.place !== 'Чехия' && req.query.place !== 'Словакия') req.query.place = 'Чехия';

    const { place } = req.query;
    const addresses: IAddressDocument[] = await Address.find({ place }).exec();

    res.send({ addresses });
  }

  private static async searchBuilding(req: Request, res: Response, next: NextFunction) {
		const { place, searchString } = req.body;
		const response: { addresses: IAddressDocument[], total: boolean } = await Address.search(place, searchString);
		
		res.send(response);
	}
}