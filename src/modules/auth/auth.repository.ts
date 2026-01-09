import { auth, firestore } from '../../config/firebase';
import { User } from '../../shared/models/User';

export const authRepository = {

    /**
     * Finds a user by their email address.
     * Combines data from Firebase Auth (core info) and Firestore (role, dealerId).
     * 
     * @param email - The email address to search for.
     * @returns A promise that resolves to the User object if found, or undefined.
     */
    async findByEmail(email: string): Promise<User | undefined> {
        try {
            if (!auth || !firestore) throw new Error("Firebase not initialized");

            // 1. Find user in Firebase Auth
            const firebaseUser = await auth.getUserByEmail(email);

            // 2. Fetch extra details from Firestore
            const userDoc = await firestore.collection('users').doc(firebaseUser.uid).get();
            const userData = userDoc.exists ? userDoc.data() : {};

            return {
                id: firebaseUser.uid,
                email: firebaseUser.email!,
                role: userData?.role || 'dealer_user',
                dealerId: userData?.dealerId || null,
                dealerLimit: userData?.dealerLimit || 10,
                passwordHash: 'FIREBASE_MANAGED', // Password management is handled by Firebase
                isActive: !firebaseUser.disabled,
                createdAt: new Date(firebaseUser.metadata.creationTime),
                updatedAt: new Date(firebaseUser.metadata.lastSignInTime),
                name: firebaseUser.displayName || userData?.name || ''
            } as User;

        } catch (error) {
            return undefined;
        }
    },

    /**
     * Finds a user by their unique ID.
     * 
     * @param id - The unique identifier of the user.
     * @returns A promise that resolves to the User object if found, or undefined.
     */
    async findById(id: number | string): Promise<User | undefined> {
        try {
            if (!auth || !firestore) throw new Error("Firebase not initialized");

            const uid = String(id);
            const userDoc = await firestore.collection('users').doc(uid).get();

            if (!userDoc.exists) return undefined;
            const userData = userDoc.data();

            // While we could fetch from Auth for fresh status, Firestore data is primarily used here.
            // Getting the user from Auth ensures we have the correct email and status.
            const firebaseUser = await auth.getUser(uid);

            return {
                id: uid,
                email: firebaseUser.email!,
                role: userData?.role,
                dealerId: userData?.dealerId,
                dealerLimit: userData?.dealerLimit,
                passwordHash: 'FIREBASE_MANAGED',
                isActive: !firebaseUser.disabled,
                createdAt: new Date(firebaseUser.metadata.creationTime),
                updatedAt: new Date(firebaseUser.metadata.lastSignInTime),
                name: firebaseUser.displayName || userData?.name || ''
            } as User;
        } catch (error) {
            return undefined;
        }
    },

    /**
     * Creates a new user in both Firebase Auth and Firestore.
     * 
     * @param user - The user object containing registration details.
     * @returns A promise that resolves to the newly created User with its ID.
     */
    async create(user: User): Promise<User> {
        try {
            if (!auth || !firestore) throw new Error("Firebase not initialized");

            // 1. Create user in Firebase Auth
            // Note: 'user.passwordHash' from service layer is the raw password here.
            const newUser = await auth.createUser({
                email: user.email,
                password: user.passwordHash, // Passing raw password to Firebase
                displayName: user.name,
                disabled: !user.isActive
            });

            // 2. Save details to Firestore
            // We do NOT store the password here.
            await firestore.collection('users').doc(newUser.uid).set({
                name: user.name,
                email: user.email,
                role: user.role,
                dealerId: user.dealerId || null,
                dealerLimit: user.dealerLimit || 10,
                passwordHash: 'FIREBASE_MANAGED', // Critical: Do not store actual password
                isActive: user.isActive,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await auth.setCustomUserClaims(newUser.uid, {
                role: user.role,
                dealerId: user.dealerId
            });

            return { ...user, id: newUser.uid };
        } catch (e) {
            console.error('[Firebase Error] Failed to create user:', e);
            throw e;
        }
    },

    /**
     * Updates a user's password in Firebase Auth.
     * 
     * @param userId - The ID of the user.
     * @param newPasswordHash - The new raw password (not actually a hash) to set.
     * @returns A promise that resolves when the update is complete.
     */
    async updatePassword(userId: number | string, newPasswordHash: string): Promise<void> {
        try {
            if (!auth) throw new Error("Firebase not initialized");

            await auth.updateUser(String(userId), {
                password: newPasswordHash
            });
        } catch (error) {
            console.error('[Firebase Error] Password update failed:', error);
            throw error;
        }
    }
};