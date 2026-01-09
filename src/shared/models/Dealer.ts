// dealer model
// represents the dealer entity in the system

export interface Dealer {
    id: number | string;  //id can be number or string (firestore UUID)
    name: string; // dealer name

    // !!!
    currentLinkHash: string; // current active link hash


    isActive: boolean;
    createdAt: Date;
    updatedAt?: Date; // optional !!
}

// defines the data required to create a new dealer
export interface DealerCreateDTO {
    name: string;
}