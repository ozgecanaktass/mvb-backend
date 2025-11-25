// dealer model
// represents the dealer entity in the system

export interface Dealer {
    id: number; // unique identifier
    name: string; // dealer name

    // !!!
    currentLinkHash: string; // current active link hash

    quotaLimit: number; // maximum allowed quota

    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date; // optional !!
}

// defines the data required to create a new dealer
export interface DealerCreateDTO {
    name: string;
    quotaLimit: number;
}