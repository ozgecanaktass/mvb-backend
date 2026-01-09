import { firestore } from '../../config/firebase'; // FIREBASE IMPORT
import { Order, CreateOrderDTO } from '../../shared/models/Order';
// import sql from 'mssql';
// import { getNewConnection } from '../../shared/database/azureSql'; 

export const orderRepository = {

    /**
     * Retrieves all orders (For Producer Admin).
     * 
     * @returns A promise resolving to an array of Order objects.
     */
    async findAll(): Promise<Order[]> {
        // --- FIREBASE FIRESTORE IMPLEMENTATION (ACTIVE) ---
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const snapshot = await firestore.collection('orders')
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamps to Date objects
                    createdAt: (data.createdAt as any).toDate(),
                    updatedAt: (data.updatedAt as any).toDate(),
                    // Configuration is stored as an object in Firestore, no need to parse
                    configuration: data.configuration
                } as Order;
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to fetch all orders:', error);
            return [];
        }
    },

    /**
     * Retrieves orders for a specific dealer (Data Isolation).
     * 
     * @param dealerId - The ID of the dealer.
     * @returns A promise resolving to an array of Order objects.
     */
    async findByDealerId(dealerId: number | string): Promise<Order[]> {
        // --- FIREBASE FIRESTORE IMPLEMENTATION (ACTIVE) ---
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            // Ensure dealerId is queried as a String to match Firestore storage format
            const snapshot = await firestore.collection('orders')
                .where('dealerId', '==', String(dealerId))
                .orderBy('createdAt', 'desc')
                .get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: (data.createdAt as any).toDate(),
                    updatedAt: (data.updatedAt as any).toDate()
                } as Order;
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to fetch dealer orders:', error);
            return [];
        }
    },

    /**
     * Finds a single order by its ID.
     * 
     * @param id - The unique identifier of the order.
     * @returns A promise resolving to the Order object if found, or undefined.
     */
    async findById(id: number | string): Promise<Order | undefined> {
        // --- FIREBASE FIRESTORE IMPLEMENTATION (ACTIVE) ---
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const doc = await firestore.collection('orders').doc(String(id)).get();

            if (!doc.exists) return undefined;

            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: (data?.createdAt as any).toDate(),
                updatedAt: (data?.updatedAt as any).toDate()
            } as Order;
        } catch (error) {
            return undefined;
        }
    },

    /**
     * Creates a new order.
     * 
     * @param orderData - The order data to create.
     * @returns A promise resolving to the created Order object.
     */
    async create(orderData: CreateOrderDTO): Promise<Order> {
        // --- FIREBASE FIRESTORE IMPLEMENTATION (ACTIVE) ---
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const newOrder = {
                ...orderData,
                // Configuration is stored as an object (NoSQL advantage)
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await firestore.collection('orders').add(newOrder);

            return { id: docRef.id, ...newOrder } as unknown as Order;
        } catch (e) {
            console.error('[Firebase Error] Failed to create order:', e);
            throw e;
        }
    },

    /**
     * Updates the status of an existing order.
     * 
     * @param id - The ID of the order.
     * @param status - The new status to set.
     */
    async updateStatus(id: number | string, status: string): Promise<void> {
        // --- FIREBASE FIRESTORE IMPLEMENTATION (ACTIVE) ---
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            await firestore.collection('orders').doc(String(id)).update({
                status: status,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to update status:', error);
            throw error;
        }
    }
};