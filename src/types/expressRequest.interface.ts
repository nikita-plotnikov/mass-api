import { Request } from 'express';

export interface ExpressRequestInterface extends Request {
  email?: string;
}
