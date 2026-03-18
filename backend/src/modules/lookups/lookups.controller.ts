import { Request, Response } from 'express';
import { LookupsService } from './lookups.service';

export class LookupsController {
  static async patients(req: Request, res: Response) {
    const data = await LookupsService.getPatientsForDoctor(req.user!);
    return res.status(200).json({ data });
  }

  static async pharmacies(req: Request, res: Response) {
    const data = await LookupsService.getPharmacies(req.user!);
    return res.status(200).json({ data });
  }

  static async medications(req: Request, res: Response) {
    const search =
      typeof req.query.search === 'string' ? req.query.search : undefined;

    const data = await LookupsService.getMedications(req.user!, search);
    return res.status(200).json({ data });
  }
}
