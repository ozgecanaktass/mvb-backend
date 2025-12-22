import sql from 'mssql';
import { getNewConnection } from '../../shared/database/azureSql'; // Pool-less connection
import { Appointment, CreateAppointmentDTO, UpdateAppointmentStatusDTO } from '../../shared/models/Appointment';

export const appointmentRepository = {
    
    /**
     * Retrieve all appointments (For Producer Admin).
     */
    async findAll(): Promise<Appointment[]> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request().query(`
                SELECT 
                    id, dealer_id as dealerId, customer_name as customerName,
                    appointment_date as appointmentDate, type, status, notes,
                    created_at as createdAt, updated_at as updatedAt
                FROM appointments 
                ORDER BY appointment_date DESC
            `);
            return result.recordset as Appointment[];
        } catch (error) {
            console.error('[SQL Error] Failed to fetch all appointments:', error);
            return [];
        } finally {
            pool.close();
        }
    },

    /**
     * Retrieve appointments for a specific dealer (Data Isolation).
     */
    async findByDealerId(dealerId: number): Promise<Appointment[]> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('dealerId', sql.BigInt, dealerId)
                .query(`
                    SELECT 
                        id, dealer_id as dealerId, customer_name as customerName,
                        appointment_date as appointmentDate, type, status, notes,
                        created_at as createdAt, updated_at as updatedAt
                    FROM appointments 
                    WHERE dealer_id = @dealerId
                    ORDER BY appointment_date DESC
                `);
            return result.recordset as Appointment[];
        } catch (error) {
            console.error('[SQL Error] Failed to fetch dealer appointments:', error);
            return [];
        } finally {
            pool.close();
        }
    },

    /**
     * Find a single appointment by ID.
     */
    async findById(id: number): Promise<Appointment | undefined> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('id', sql.BigInt, id)
                .query(`
                    SELECT 
                        id, dealer_id as dealerId, customer_name as customerName,
                        appointment_date as appointmentDate, type, status, notes,
                        created_at as createdAt, updated_at as updatedAt
                    FROM appointments 
                    WHERE id = @id
                `);
            return result.recordset[0] as Appointment | undefined;
        } catch (error) {
            console.error('[SQL Error] Appointment not found:', error);
            return undefined;
        } finally {
            pool.close();
        }
    },

    /**
     * Create a new appointment.
     */
    async create(data: CreateAppointmentDTO): Promise<Appointment> {
        const pool = await getNewConnection();
        try {
            const result = await pool.request()
                .input('dealerId', sql.BigInt, data.dealerId)
                .input('customerName', sql.NVarChar, data.customerName)
                .input('appointmentDate', sql.DateTimeOffset, new Date(data.appointmentDate))
                .input('type', sql.NVarChar, data.type)
                .input('status', sql.NVarChar, 'Scheduled')
                .input('notes', sql.NVarChar, data.notes || null)
                .query(`
                    INSERT INTO appointments (dealer_id, customer_name, appointment_date, type, status, notes, created_at, updated_at)
                    OUTPUT INSERTED.id, INSERTED.created_at as createdAt, INSERTED.updated_at as updatedAt
                    VALUES (@dealerId, @customerName, @appointmentDate, @type, @status, @notes, GETDATE(), GETDATE())
                `);

            const inserted = result.recordset[0];
            
            return {
                id: inserted.id,
                ...data,
                appointmentDate: new Date(data.appointmentDate),
                status: 'Scheduled',
                createdAt: inserted.createdAt,
                updatedAt: inserted.updatedAt
            } as Appointment;
        } catch (error) {
            console.error('[SQL Error] Failed to create appointment:', error);
            throw error;
        } finally {
            pool.close();
        }
    },

    /**
     * Update appointment status.
     */
    async updateStatus(id: number, status: string): Promise<void> {
        const pool = await getNewConnection();
        try {
            await pool.request()
                .input('id', sql.BigInt, id)
                .input('status', sql.NVarChar, status)
                .query(`
                    UPDATE appointments 
                    SET status = @status, updated_at = GETDATE()
                    WHERE id = @id
                `);
        } catch (error) {
            console.error('[SQL Error] Failed to update status:', error);
            throw error;
        } finally {
            pool.close();
        }
    }
};