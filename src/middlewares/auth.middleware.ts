import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/utils/AppError';

// new : added dealerId to JwtPayload
interface JwtPayload {
    id: number;
    role: string;
    dealerId?: number | null; 
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

// check if the user is authenticated
export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;

    // fetch token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Token is missing', 401));
    }

    // verify token
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // attach user info to request object
        req.user = decoded;
        next();
        
    } catch (error) {
        return next(new AppError('Token is invalid or expired', 401));
    }
};

// restrict access based on user roles
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // req.user is set in the protect middleware
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};