import { compare, hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/utils/AppError';
import { mockStore } from '../../shared/database/mockStore';
import { User } from '../../shared/models/User';
import { AuthInputDTO } from './auth.controller';
// import { authRepository } from './auth.repository';

// user creates JWT token after login
export const signToken = (userId: number, role : string): string => {

    // get secret from env
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new AppError("JWT secret is not defined in environment variables.", 500);
    }

    // create token
    const token = jwt.sign(
        {
            id: userId, role: role
        },
        secret,
        { expiresIn: '7d' } // token valid for 7 days
    );
    return token;
};

// verify user credentials during login and return token if valid
export const authenticateUser = async ({email, password}: AuthInputDTO): Promise<{ user: User; token: string }> => {
    
    // --- AZURE SQL 
    /*
    const user = await authRepository.findByEmail(email);
    if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }
    // const isPasswordValid = await compare(password, user.passwordHash);
    */

    // find the user from mock database
    const user = mockStore.users.find (u => u.email === email && u.isActive);
     if (!user) {
        throw new AppError("Invalid email or password.", 401);
    }
    
    // compare password
    const isPasswordValid = password === "admin-sifresi";

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password.", 401);
    }
    
    // create JWT token
    const token = signToken(user.id, user.role);

    return { user, token };
};

// hash password utility for future use
export const hashPassword = (password : string) : Promise<string> => {
    return hash(password, 10);
}