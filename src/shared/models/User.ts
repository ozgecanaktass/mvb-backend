export interface User {
    id: number;
    email: string;
    passwordHash: string; 
    name: string;
    role: 'producer' | 'superuser'; 
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date; 
}