import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/utils/AppError';
import { User } from '../../shared/models/User';
import { AuthInputDTO } from './auth.controller';
import { authRepository } from './auth.repository';

// generate JWT token for authenticated user
export const signToken = (userId: number, role: string): string => {
    const secret = process.env.JWT_SECRET;
    
    if (!secret) {
        throw new AppError("JWT_SECRET is not defined in environment variables.", 500);
    }

    const token = jwt.sign(
        { id: userId, role: role },
        secret,
        { expiresIn: '7d' } // token valid for 7 days
    );
    
    return token;
};

// authenticate user with email and password
export const authenticateUser = async ({ email, password }: AuthInputDTO): Promise<{ user: User, token: string }> => {
    
    // check if user exists in Azure SQL Database
    const user = await authRepository.findByEmail(email);

    if (!user) {
        throw new AppError("Invalid email or password.", 401); 
    }
    // verify password
    const isPasswordValid = password === user.passwordHash;
    
    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }
    // generate JWT token
    const token = signToken(user.id, user.role);

    return { user, token };
};

// hash password using bcrypt
export const hashPassword = (password: string): Promise<string> => {
    // 10 salt rounds is the industry standard for bcrypt
    return hash(password, 10); 
};