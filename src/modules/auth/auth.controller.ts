import { Request, Response } from 'express';
import { authenticateUser } from './auth.service';
import { AppError } from '../../shared/utils/AppError';

export interface AuthInputDTO {
    email: string;
    password: string;
}

// (POST /api/v1/auth/login)
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as AuthInputDTO;

    if (!email || !password) {
        throw new AppError("Email and password are required.", 400);
    }

    //authenticate user
    const { user, token } =  await authenticateUser({ email, password });

    res.status(200).json({
        success: true,
        message: "Login successful.",
        token: token,
        userId: user.id,
        userRole: user.role
    });
};

// (POST /api/v1/auth/logout)
export const logout = (req: Request, res: Response) => {
    // since JWT is stateless, just respond with success
    // blacklist will be implemented !!

    res.status(200).json({
        success: true,
        message: "Logout successful."
    });
}