export interface User {
    id: number;
    email: string;
    passwordHash: string; 
    name: string;
    role: 'producer' | 'superuser'; 
    dealerLimit: number; // maximum number of dealers the user can manage (manual for now)
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date; 
}