import { Request, Response } from 'express';
import { authenticateUser, registerUser, changePassword} from './auth.service';
import { AppError } from '../../shared/utils/AppError';

export interface AuthInputDTO {
    email: string;
    password: string;
}


// POST /api/v1/auth/login

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body as AuthInputDTO;

    if (!email || !password) {
        throw new AppError("Missing email or password", 400);
    }

    // verify user credentials
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


//POST /api/v1/auth/logout

export const logout = (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful.',
    });
};


// new: POST /api/v1/auth/users

export const createUser = async (req: Request, res: Response) => {
    const { email, password, name, role, dealerId } = req.body;
    
    // secure current user from request (set by auth middleware)
    const currentUser = req.user!; 
    
    // Determine the dealerId based on the role of the current user
    let targetDealerId: number | null | undefined = null;

    // if current user is producer_admin
    if (currentUser.role === 'producer_admin') {
        // producer_admin can assign any dealerId or none
        // if dealerId is not provided, it will be null (no dealer association)
        targetDealerId = dealerId || null; 
    } 
    // if current user is dealer_admin
    else if (currentUser.role === 'dealer_admin') {
        // dealer admin can only assign their own dealerId
        targetDealerId = currentUser.dealerId; 
        
        // dealer_admin can only create dealer_user roles
        // cannot create other dealer_admin or producer_admin users
        if (role !== 'dealer_user') {
             throw new AppError("You can only create dealer_user roles.", 403);
        }
    } else {
        // other roles are not allowed to create users
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

// POST /api/v1/auth/change-password
// change password for logged-in user
export const updatePassword = async (req: Request, res: Response) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // secure userId from request (set by auth middleware)
    const userId = req.user!.id; 

    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new AppError("Fill all fields (Current Password, New Password, Confirm New Password).", 400);
    }
    
    if (newPassword !== confirmPassword) {
        throw new AppError("New passwords do not match.", 400);
    }
    
    if (newPassword.length < 6) {
        throw new AppError("New password must be at least 6 characters long.", 400);
    }

    // service call to change password
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