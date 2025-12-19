import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/utils/AppError';
import { User } from '../../shared/models/User';
import { AuthInputDTO } from './auth.controller';
import { authRepository } from './auth.repository';

/**
 * Generate a JWT token for the authenticated user.
 * @param userId - User's ID
 * @param email - User's Email (NEW)
 * @param role - User's role (e.g., 'producer', 'superuser')
 * @param dealerId - The Dealer ID this user belongs to (nullable)
 * @returns Signed JWT string
 */
export const signToken = (userId: number, email: string, role: string, dealerId: number | null | undefined): string => {
    // Get the secret key from environment variables
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        throw new AppError("JWT_SECRET is not defined in environment variables.", 500);
    }

    // Sign the token with payload and expiration time
    const token = jwt.sign(
        { 
            id: userId, 
            email: email, 
            role: role,
            dealerId: dealerId 
        },
        secret,
        { expiresIn: '7d' } // Token valid for 7 days
    );
    
    return token;
};

/**
 * Authenticate a user with email and password.
 * @param {AuthInputDTO} credentials - Contains email and password
 * @returns {Promise<{ user: User; token: string }>} Authenticated user and JWT token
 */
export const authenticateUser = async ({ email, password }: AuthInputDTO): Promise<{ user: User, token: string }> => {
    
    // Check if user exists in Azure SQL Database
    const user = await authRepository.findByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password.", 401); 
    }

    // Verify Password
    // Hybrid check: Supports both hashed (bcrypt) and plain text (legacy/seed) passwords
    let isPasswordValid = false;
    if (user.passwordHash.startsWith('$2')) {
        isPasswordValid = await compare(password, user.passwordHash);
    } else {
        isPasswordValid = password === user.passwordHash;
    }
    
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }
    
    // 3. Generate JWT Token if authentication is successful
    const token = signToken(user.id, user.email, user.role, user.dealerId);

    return { user, token };
};

/**
 * Hash a plain text password using bcrypt.
 * @param password - Plain text password
 * @returns Hashed password string
 */
export const hashPassword = (password: string): Promise<string> => {
    return hash(password, 10); 
};

export interface ChangePasswordDTO {
    userId: number;
    currentPassword: string;
    newPassword: string;
}

// Register a new user (admin/dealer admin action)
export const registerUser = async (userData: any): Promise<User> => {
    const existingUser = await authRepository.findByEmail(userData.email);
    if (existingUser) {
        throw new AppError("This mail already exists", 400);
    }

    const hashedPassword = await hashPassword(userData.password);

    const newUser: User = {
        ...userData,
        passwordHash: hashedPassword,
        isActive: true
    };

    return await authRepository.create(newUser);
};

// Change password for logged-in user
export const changePassword = async ({ userId, currentPassword, newPassword }: ChangePasswordDTO): Promise<void> => {
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new AppError("User not found.", 404);
    }

    let isMatch = false;
    if (user.passwordHash.startsWith('$2')) { 
         isMatch = await compare(currentPassword, user.passwordHash);
    } else {
         isMatch = currentPassword === user.passwordHash;
    }

    if (!isMatch) {
        throw new AppError("Current password is incorrect.", 400);
    }

    const newHashedPassword = await hashPassword(newPassword);

    await authRepository.updatePassword(userId, newHashedPassword);
};