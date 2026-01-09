import { firestore } from '../../config/firebase';
import { Appointment, CreateAppointmentDTO } from '../../shared/models/Appointment';

export const appointmentRepository = {

    /**
     * Retrieves all appointments.
     * Intended for Producer Admins.
     * 
     * @returns A promise that resolves to an array of all appointments.
     */
    async findAll(): Promise<Appointment[]> {
        // Firebase Firestore Implementation
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const snapshot = await firestore.collection('appointments')
                .orderBy('appointmentDate', 'desc')
                .get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    // Convert Firestore Timestamp to Date
                    appointmentDate: (data.appointmentDate as any).toDate(),
                    createdAt: (data.createdAt as any).toDate(),
                    updatedAt: (data.updatedAt as any).toDate()
                } as unknown as Appointment;
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to fetch all appointments:', error);
            return [];
        }
    },

    /**
     * Retrieves appointments for a specific dealer.
     * Ensures data isolation by filtering by dealer ID.
     * 
     * @param dealerId - The ID of the dealer.
     * @returns A promise that resolves to an array of the dealer's appointments.
     */
    async findByDealerId(dealerId: number | string): Promise<Appointment[]> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const snapshot = await firestore.collection('appointments')
                .where('dealerId', '==', dealerId)
                .orderBy('appointmentDate', 'desc')
                .get();

            return snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    appointmentDate: (data.appointmentDate as any).toDate(),
                    createdAt: (data.createdAt as any).toDate(),
                    updatedAt: (data.updatedAt as any).toDate()
                } as unknown as Appointment;
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to fetch dealer appointments:', error);
            return [];
        }
    },

    /**
     * Retrieves a single appointment by its ID.
     * 
     * @param id - The unique identifier of the appointment.
     * @returns A promise that resolves to the appointment if found, or undefined.
     */
    async findById(id: number | string): Promise<Appointment | undefined> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const doc = await firestore.collection('appointments').doc(String(id)).get();

            if (!doc.exists) return undefined;

            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                appointmentDate: (data?.appointmentDate as any).toDate(),
                createdAt: (data?.createdAt as any).toDate(),
                updatedAt: (data?.updatedAt as any).toDate()
            } as unknown as Appointment;
        } catch (error) {
            return undefined;
        }
    },

    /**
     * Creates a new appointment.
     * 
     * @param data - The data transfer object containing appointment details.
     * @returns A promise that resolves to the newly created appointment.
     */
    async create(data: CreateAppointmentDTO): Promise<Appointment> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            const newAppointment = {
                ...data,
                appointmentDate: new Date(data.appointmentDate), // Ensure Date object for Firestore Timestamp
                status: 'Scheduled',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const docRef = await firestore.collection('appointments').add(newAppointment);

            return { id: docRef.id, ...newAppointment } as unknown as Appointment;
        } catch (e) {
            console.error('[Firebase Error] Failed to create appointment:', e);
            throw e;
        }
    },

    /**
     * Updates the status of an appointment.
     * 
     * @param id - The ID of the appointment to update.
     * @param status - The new status.
     * @returns A promise that resolves when the update is complete.
     */
    async updateStatus(id: number | string, status: string): Promise<void> {
        try {
            if (!firestore) throw new Error("Firebase not initialized");

            await firestore.collection('appointments').doc(String(id)).update({
                status: status,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('[Firebase Error] Failed to update status:', error);
            throw error;
        }
    }
};