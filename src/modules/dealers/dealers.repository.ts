// import sql from 'mssql';
// import { getNewConnection } from '../../shared/database/azureSql';
import { Dealer } from '../../shared/models/Dealer';
import { firestore } from '../../config/firebase'; // FIREBASE IMPORT

export const dealerRepository = {

    /**
     * Retrieves all dealers, ordered by creation date descending.
     * 
     * @returns A promise resolving to an array of Dealer objects.
     */
    async findAll(): Promise<Dealer[]> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            // Firestore query: Order 'dealers' collection by 'createdAt' descending
            const snapshot = await firestore.collection('dealers').orderBy('createdAt', 'desc').get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                // Map Firestore data to Dealer model
                return {
                    id: doc.id as any, // Firestore ID is string, model might expect number (caution!)
                    ...data,
                    // Convert Firestore Timestamps to Date objects
                    createdAt: (data.createdAt as any).toDate(),
                    updatedAt: (data.updatedAt as any).toDate()
                } as unknown as Dealer;
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to fetch dealers:', error);
            return [];
        }
    },

    /**
     * Finds a dealer by their unique link hash.
     * 
     * @param linkHash - The unique hash string for the dealer.
     * @returns A promise resolving to the Dealer object if found, or undefined.
     */
    async findByLinkHash(linkHash: string): Promise<Dealer | undefined> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            // Filter by 'currentLinkHash'
            const snapshot = await firestore.collection('dealers')
                .where('currentLinkHash', '==', linkHash)
                .limit(1)
                .get();

            if (snapshot.empty) return undefined;

            const doc = snapshot.docs[0];
            const data = doc.data();

            return {
                id: doc.id as any,
                ...data,
                createdAt: (data.createdAt as any).toDate(),
                updatedAt: (data.updatedAt as any).toDate()
            } as unknown as Dealer;
        } catch (error) {
            console.error('[Firebase Error] Dealer not found by hash:', error);
            return undefined;
        }
    },

    /**
     * Creates a new dealer.
     * 
     * @param dealerData - The dealer data to create.
     * @returns A promise resolving to the created dealer with its new ID.
     */
    async create(dealerData: Dealer): Promise<Dealer> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            // Allowing Firebase to generate the ID when adding to Firestore
            // Our model might expect 'id: number', but Firestore uses string IDs.
            // Temporary solution: force cast to any or unknown to satisfy TypeScript for now.
            // Ideally, the model should be updated to accept string IDs.

            const newDealerData = {
                name: dealerData.name,
                currentLinkHash: dealerData.currentLinkHash,
                isActive: dealerData.isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const newDealerRef = await firestore.collection('dealers').add(newDealerData);

            return {
                ...dealerData,
                id: newDealerRef.id as any // Returning string ID as any to bypass potential number type mismatch
            };
        } catch (error) {
            console.error('[Firebase Error] Failed to create dealer:', error);
            throw error;
        }
    }
};