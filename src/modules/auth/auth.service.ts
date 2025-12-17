import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/utils/AppError';
import { User } from '../../shared/models/User';
import { AuthInputDTO } from './auth.controller';
import { authRepository } from './auth.repository';

/**
 * Generate a JWT token for the authenticated user
 * @param userId - User's ID
 * @param role - User's role (e.g., 'dealer_admin')
 * @param dealerId - The Dealer ID this user belongs to (nullable)
 * @returns Signed JWT string
 */
export const signToken = (userId: number, role: string, dealerId: number | null | undefined): string => {
    // get the secret key from environment variables
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        throw new AppError("JWT_SECRET is not defined in environment variables.", 500);
    }

    // sign the token with payload and expiration time
    const token = jwt.sign(
        { 
            id: userId, 
            role: role,
            dealerId: dealerId // new
        },
        secret,
        { expiresIn: '7d' } // token valid for 7 days
    );
    
    return token;
};


// authenticate user credentials and return user + token
export const authenticateUser = async ({ email, password }: AuthInputDTO): Promise<{ user: User, token: string }> => {
    
    // check if user exists in Azure SQL Database
    const user = await authRepository.findByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password.", 401); 
    }

    // verify Password
    // Not: Admin şifresi düz metin olabilir, diğerleri hash'li.
    // Şimdilik basit kontrol yapıyoruz.
    const isPasswordValid = password === user.passwordHash;
    
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }
    
    // generate JWT Token with dealerId
    const token = signToken(user.id, user.role, user.dealerId);

    return { user, token };
};

/**
 * Hash a plain text password using bcrypt
 */
export const hashPassword = (password: string): Promise<string> => {
    return hash(password, 10); 
};

// register a new user
// for dealer_admin to create their staff users
export const registerUser = async (userData: any): Promise<User> => {
    // email uniqueness check
    const existingUser = await authRepository.findByEmail(userData.email);
    if (existingUser) {
        throw new AppError("Email is already in use.", 400);
    }

    // hash password
    // const hashedPassword = await hashPassword(userData.password);
    const hashedPassword = userData.password;

    const newUser: User = {
        ...userData,
        passwordHash: hashedPassword,
        isActive: true
    };

    // save user to database
    return await authRepository.create(newUser);
};