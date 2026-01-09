import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'; // For legacy method
import { auth } from '../config/firebase'; // For new method
import { AppError } from '../shared/utils/AppError';

// Extending Request type
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number | string; // Firebase UID (string) or SQL ID (number)
                email?: string;
                role: string;
                dealerId?: number | null;
            };
        }
    }
}

/**
 * Middleware to protect routes by verifying authentication tokens.
 * Supports both Firebase ID Tokens (primary) and custom JWTs (fallback).
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 * @returns {Promise<void>}
 */
export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You must log in (No Token).', 401));
    }

    // 1. Try verifying as Firebase ID Token first (Priority: Frontend/HTML)
    try {
        if (auth) {
            // Verify Firebase Token
            const decodedToken = await auth.verifyIdToken(token);

            // Determine Role:
            // 1. Check if email matches specific test patterns (Prioritize Dev/Test Override)
            let finalRole = getRoleFromEmail(decodedToken.email);

            // 2. If no special email pattern, use Token Claim or Default
            if (finalRole === 'dealer_user') {
                finalRole = decodedToken.role || 'dealer_user';
            }

            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email,
                role: finalRole,
                dealerId: decodedToken.dealerId || 101
            };
            return next();
        }
    } catch (firebaseError) {
        // If Firebase error (e.g., no kid), it might be our Custom JWT.
        // Proceed to next step (Custom JWT check) without throwing an error.
    }

    // 2. If not Firebase, try verifying with our own JWT system (Swagger/Backend Login)
    try {
        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            dealerId: decoded.dealerId
        };
        return next();

    } catch (jwtError) {
        console.error("Token Verification Error:", jwtError);
        return next(new AppError('Invalid or expired token.', 401));
    }
};

// Helper for Dev/Test Role Simulation (Matches frontend logic)
function getRoleFromEmail(email: string | undefined): string {
    if (!email) return 'dealer_user';
    const lowerEmail = email.toLowerCase();

    if (lowerEmail.includes('admin')) return 'producer_admin';
    if (lowerEmail.includes('yonetici') || lowerEmail.includes('ahmet') || lowerEmail.includes('can') || lowerEmail.includes('guney')) return 'dealer_admin';

    return 'dealer_user';
}

/**
 * Middleware to restrict access to specific user roles.
 *
 * @param {...string[]} roles - List of allowed roles.
 * @returns {Function} Express middleware function.
 */
export const restrictTo = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return next(new AppError('You are not authorized to perform this action.', 403));
        }
        next();
    };
};