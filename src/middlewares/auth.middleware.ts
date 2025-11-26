// checks the JWT TOKEN in the Authorization header
// if token is valid, redirects request to createDealer 
import { Request, Response, NextFunction } from 'express';
import jwt, { Jwt, JwtPayload } from 'jsonwebtoken';
import { AppError } from '../shared/utils/AppError';

// after the token is verified we can access req.user to get user info
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload; 
            }
    }
}

// middleware to verify JWT token before accessing protected routes
export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token : string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Not authorized, token missing', 401));
    }

    // verify token
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as JwtPayload;

        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError('Not authorized, token invalid', 401));
    }   
};


