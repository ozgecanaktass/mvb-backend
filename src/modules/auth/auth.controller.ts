import { Request, Response } from 'express';
import { authenticateUser, registerUser, changePassword } from './auth.service';
import { AppError } from '../../shared/utils/AppError';

export interface AuthInputDTO {
    email: string;
    password: string;
}

/**
 * Handles user login.
 * Authenticates the user with email and password, returning a JWT token and user details.
 * 
 * @param req - The express request object containing email and password in the body.
 * @param res - The express response object.
 * @returns A JSON response with the authentication token and user info.
 */
export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as AuthInputDTO;

    if (!email || !password) {
        throw new AppError("Missing email or password", 400);
    }

    const { user, token } = await authenticateUser({ email, password });

    res.status(200).json({
        success: true,
        message: 'Login successful.',
        token: token,
        userId: user.id,
        role: user.role,
        dealerId: user.dealerId
    });
};

/**
 * Handles user logout.
 * Currently a stateless operation on the server (client handles token removal).
 * 
 * @param req - The express request object.
 * @param res - The express response object.
 * @returns A JSON response confirming logout.
 */
export const logout = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful.',
    });
};

/**
 * Creates a new user.
 * 
 * Capability checks:
 * - 'producer_admin' can create any user and assign them to dealers.
 * - 'dealer_admin' can only create 'dealer_user' roles for their own dealer.
 * 
 * @param req - The express request object containing new user details.
 * @param res - The express response object.
 * @returns A JSON response with the created user's data.
 */
export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, dealerId } = req.body;
    const currentUser = req.user!;

    let targetDealerId: number | null | undefined = null;

    if (currentUser.role === 'producer_admin') {
        targetDealerId = dealerId || null;
    } else if (currentUser.role === 'dealer_admin') {
        if (role !== 'dealer_user') {
            throw new AppError("You can only create dealer_user roles.", 403);
        }
        targetDealerId = currentUser.dealerId;
    } else {
        throw new AppError("You don't have permission to create users.", 403);
    }

    const newUser = await registerUser({
        email,
        password,
        name,
        role,
        dealerId: targetDealerId
    });

    res.status(201).json({
        success: true,
        message: "User created successfully.",
        data: {
            id: newUser.id,
            email: newUser.email,
            role: newUser.role,
            dealerId: newUser.dealerId
        }
    });
};

/**
 * Updates the authenticated user's password.
 * 
 * @param req - The express request object containing current, new, and confirm passwords.
 * @param res - The express response object.
 * @returns A JSON response confirming the password update.
 */
export const updatePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user!.id;

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError("Fill all fields.", 400);
    }

    if (newPassword !== confirmPassword) {
        throw new AppError("New passwords do not match.", 400);
    }

    if (newPassword.length < 6) {
        throw new AppError("New password must be at least 6 characters long.", 400);
    }

    await changePassword({
        userId,
        currentPassword,
        newPassword
    });

    res.status(200).json({
        success: true,
        message: "Your password has been successfully updated. Please log in again with your new password."
    });
};