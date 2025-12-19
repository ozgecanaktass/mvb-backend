import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../shared/utils/AppError';

interface JwtPayload {
    id: number;
    email: string;
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

// authentication middleware 
// used to protect routes that require authentication
export const protect = (req: Request, res: Response, next: NextFunction) => {
    let token;

    // fetch token from Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('Login to access this route', 401));
    }

    // verify token
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as JwtPayload;

        // attach user info to request object
        req.user = decoded;
        next();
        
    } catch (error) {
        return next(new AppError('Session has expired or token is invalid. Please login again.', 401));
    }
};

/**
 * Role-Based Access Control (RBAC) Middleware
 * only allows users with specified roles to access the route
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You do not have permission to perform this action.', 403));
        }
        next();
    };
};