import { Request, Response, NextFunction } from "express";

type ExpressFn = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

// catch asynchronous errors in Express route handlers and pass to next middleware
export const catchAsync = (fn: ExpressFn) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};