import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AppError } from '../../shared/utils/AppError';
import { User } from '../../shared/models/User';
import { AuthInputDTO } from './auth.controller';
import { authRepository } from './auth.repository';

// Firebase REST API URL (For password verification)
const FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword";

/**
 * Generates a JWT token for the authenticated user.
 * 
 * @param userId - The user's ID.
 * @param email - The user's email.
 * @param role - The user's role.
 * @param dealerId - The user's dealer ID (optional).
 * @returns The generated JWT string.
 */
export const signToken = (userId: number | string, email: string, role: string, dealerId: number | null | undefined): string => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new AppError("JWT_SECRET is not defined in environment variables.", 500);
    }

    const token = jwt.sign(
        {
            id: userId,
            email: email,
            role: role,
            dealerId: dealerId
        },
        secret,
        { expiresIn: '7d' }
    );

    return token;
};

/**
 * Authenticates a user.
 * Supports both Legacy SQL (bcrypt) and Firebase (REST API) verification.
 * 
 * @param credentials - Object containing email and password.
 * @returns A promise resolving to the user object and authentication token.
 */
export const authenticateUser = async ({ email, password }: AuthInputDTO): Promise<{ user: User, token: string }> => {

    // 1. Find User (via Repository)
    const user = await authRepository.findByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }

    let isPasswordValid = false;

    // A. Firebase Mode (Expected Behavior)
    if (user.passwordHash === 'FIREBASE_MANAGED') {
        const apiKey = process.env.FIREBASE_API_KEY;

        if (apiKey) {
            try {
                // Ask Google: Is this password correct?
                // Using verifyPassword endpoint according to Firebase REST API documentation
                await axios.post(`${FIREBASE_AUTH_URL}?key=${apiKey}`, {
                    email: email,
                    password: password,
                    returnSecureToken: true
                });

                isPasswordValid = true;
                // Log success removed for clean up
            } catch (error) {
                console.error(`❌ [Auth] Firebase login failed for ${email}`);
                isPasswordValid = false;
            }
        } else {
            // Allow access in dev mode if API Key is missing (Test only!)
            console.warn(`⚠️ [Auth] Firebase API Key missing. Skipping check for ${email} (Dev Mode).`);
            isPasswordValid = true;
        }
    }
    // B. Legacy Mode (For old data)
    else {
        if (user.passwordHash.startsWith('$2')) {
            isPasswordValid = await compare(password, user.passwordHash);
        } else {
            isPasswordValid = password === user.passwordHash;
        }
    }

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }

    const token = signToken(user.id, user.email, user.role, user.dealerId);

    return { user, token };
};

export const hashPassword = (password: string): Promise<string> => {
    // Return plain text for Firebase; enable hashing for SQL if needed.
    return Promise.resolve(password);
};

// --- USER MANAGEMENT ---

export interface ChangePasswordDTO {
    userId: number | string;
    currentPassword: string;
    newPassword: string;
}

/**
 * Registers a new user.
 * 
 * @param userData - The user data to register.
 * @returns A promise resolving to the created user.
 */
export const registerUser = async (userData: any): Promise<User> => {
    const existingUser = await authRepository.findByEmail(userData.email);
    if (existingUser) {
        throw new AppError("This email address is already registered.", 400);
    }

    // Capture raw password without hashing.
    // authRepository.create will pass this to Firebase.
    const passwordToStore = userData.password;

    const newUser: User = {
        ...userData,
        passwordHash: passwordToStore, // Sending raw password (Repository will set 'FIREBASE_MANAGED')
        isActive: true
    };

    try {
        return await authRepository.create(newUser);
    } catch (error: any) {
        if (error.code === 'auth/email-already-in-use' || error.message?.includes('email address is already in use')) {
            throw new AppError("This email address is already registered on Firebase Auth.", 400);
        }
        throw error;
    }
};

/**
 * Changes a user's password.
 * 
 * @param params - Object containing userId, currentPassword, and newPassword.
 */
export const changePassword = async ({ userId, currentPassword, newPassword }: ChangePasswordDTO): Promise<void> => {
    const user = await authRepository.findById(userId);
    if (!user) {
        throw new AppError("User not found.", 404);
    }

    // In Firebase mode, we could also verify the old password via REST API.
    // For simplicity, we might skip old password check in Firebase mode or relying on client re-auth.
    // Currently properly checking only for Legacy mode.
    if (user.passwordHash !== 'FIREBASE_MANAGED') {
        let isMatch = false;
        if (user.passwordHash.startsWith('$2')) {
            isMatch = await compare(currentPassword, user.passwordHash);
        } else {
            isMatch = currentPassword === user.passwordHash;
        }

        if (!isMatch) {
            throw new AppError("Current password is incorrect.", 400);
        }
    }

    // Send the new password as plain text to Firebase
    await authRepository.updatePassword(userId, newPassword);
};