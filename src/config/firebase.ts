import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Check if Firebase service is initialized
let isFirebaseInitialized = false;

try {
    // 1. Check Service Account Key File
    // In a real scenario, this file is downloaded from Firebase Console and placed in the project root (hidden).
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        ? require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : null;

    if (serviceAccount) {
        // 2. Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: "https://your-project.firebaseio.com" // Not needed if using Firestore
        });
        isFirebaseInitialized = true;
        console.log('🔥 [Firebase]: Connection Successful!');
    } else {
        console.warn('⚠️ [Firebase]: Service Account Key not found! Firebase services are in MOCK mode or disabled.');
    }

} catch (error) {
    console.error('❌ [Firebase]: Initialization Error:', error);
}

// 3. Export Services
// If there is no connection, we can return null or throw an error, 
// for now we export optionally for safety.

export const firestore = isFirebaseInitialized ? admin.firestore() : null;
export const auth = isFirebaseInitialized ? admin.auth() : null;

// Helper: Check if Firebase is ready
export const checkFirebase = () => {
    if (!isFirebaseInitialized) {
        throw new Error("Firebase is not initialized yet or configuration is missing.");
    }
};