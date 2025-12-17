export interface User {
    id: number;
    email: string;
    passwordHash: string; 
    name: string;
    // - 'producer_admin': System owner (Super Admin). Can see everything.
    // - 'dealer_admin': Owner of a specific Dealer. Can manage their own staff.
    // - 'dealer_user': Staff of a Dealer. Can only create orders.
    role: 'producer_admin' | 'dealer_admin' | 'dealer_user'; 

    // If NULL -> User is a Producer (System Owner).
    // If SET -> User belongs to this specific Dealer ID.
    dealerId?: number | null; 
    dealerLimit: number; // maximum number of dealers the user can manage (manual for now)
    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date; 
}

export interface CreateUserDTO {
    email: string;
    password: string;
    name: string;
    role: 'producer_admin' | 'dealer_admin' | 'dealer_user';
    dealerId?: number;
}