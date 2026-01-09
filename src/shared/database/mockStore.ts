import { Dealer } from "../models/Dealer";
import { User } from "../models/User";
import { Order } from "../models/Order";

const initialUsers: User[] = [
    {
        id: 1,
        email: "admin@uretici.com",
        passwordHash: "sahte-hash-sifre",
        name: "Yönetici Kullanıcı",
        role: "producer_admin",
        dealerLimit: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

export const dealerDatabase: Dealer[] = [
    {
        id: 101,
        name: "Merkez Optik",
        currentLinkHash: "a1b2c3d4-test-hash",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 102,
        name: "Batı Optik",
        currentLinkHash: "x9y8z7w6-test-hash",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// sample order data for testing
const initialOrders: Order[] = [
    {
        id: 5001,
        dealerId: 101,
        customerName: "Ata Arpat",
        status: "Pending",
        configuration: {
            frame: "Aviator",
            lensType: "BlueCut",
            prescription: { left: -1.5, right: -1.0 }
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

export const mockStore = {
    users: initialUsers,
    dealers: dealerDatabase,

    visitLogs: [] as any[],
    orders: initialOrders,

    revokedTokens: [] as string[],
};

