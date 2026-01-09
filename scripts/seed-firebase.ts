import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!serviceAccountPath) {
    console.error("❌ Service Account Key path not found in .env");
    process.exit(1);
}

const serviceAccount = require(path.resolve(process.cwd(), serviceAccountPath));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

/**
 * Creates an admin user in Firebase Auth and Firestore if it doesn't already exist.
 * Sets the 'producer_admin' role and custom claims.
 *
 * @returns {Promise<void>} Resolves when the admin creation process is complete.
 */
export const createAdmin = async (): Promise<void> => {
    const email = 'admin@uretici.com';
    const password = 'admin-sifresi';
    const displayName = 'System Administrator';

    try {
        // 1. Check if the user already exists
        try {
            await auth.getUserByEmail(email);
            console.log("⚠️ Admin user already exists.");
            return;
        } catch (e) {
            // Continue if user does not exist
        }

        // 2. Create user in Auth
        const user = await auth.createUser({
            email,
            password,
            displayName
        });

        // 3. Write details to Firestore
        await firestore.collection('users').doc(user.uid).set({
            email,
            name: displayName,
            role: 'producer_admin',
            dealerLimit: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 4. Assign Custom Claims (Role)
        await auth.setCustomUserClaims(user.uid, {
            role: 'producer_admin',
            dealerLimit: 10
        });

        console.log("✅ Admin user successfully created! UID:", user.uid);

    } catch (error) {
        console.error("❌ Error:", error);
    }
};

createAdmin();