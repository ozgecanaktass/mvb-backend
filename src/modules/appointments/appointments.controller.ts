import { Request, Response } from 'express';
import { CreateAppointmentDTO, Appointment, UpdateAppointmentStatusDTO } from '../../shared/models/Appointment';
import { AppError } from '../../shared/utils/AppError';
import { appointmentRepository } from './appointments.repository';

/**
 * GET /api/v1/appointments
 * Lists appointments based on user role (Data Isolation).
 * - Producer Admin: Sees all appointments.
 * - Dealer Admin/User: Sees only appointments for their own dealer.
 */
export const getAppointments = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError("Unauthorized access. User information not found.", 401);
        }

        let appointments: Appointment[] = [];

        // Scenario A: Producer Admin -> Fetch ALL
        if (user.role === 'producer_admin') {
            appointments = await appointmentRepository.findAll();
        } 
        // Scenario B: Dealer Admin or Staff -> Fetch ONLY their Dealer's data
        else if (user.dealerId) {
            appointments = await appointmentRepository.findByDealerId(Number(user.dealerId));
        } else {
            // Dealer role but no dealerId provided (should not happen)
            appointments = [];
        }

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error("Error fetching appointments:", error);
        throw new AppError("Failed to fetch appointments.", 500);
    }
};

/**
 * POST /api/v1/appointments
 * Creates a new appointment.
 * Enforces security by overriding dealerId for dealer users.
 */
export const createAppointment = async (req: Request, res: Response) => {
    let { dealerId, customerName, appointmentDate, type, notes } = req.body as CreateAppointmentDTO;
    const user = req.user;

    // SECURITY: If user is a dealer, force their own dealerId
    if (user && (user.role === 'dealer_admin' || user.role === 'dealer_user')) {
        if (user.dealerId) {
            dealerId = user.dealerId;
        } else {
             throw new AppError("Dealer ID not found for user.", 400);
        }
    }

    if (!dealerId || !customerName || !appointmentDate) {
        throw new AppError("Dealer ID, Customer Name, and Appointment Date are required.", 400);
    }

    try {
        const newAppointment = await appointmentRepository.create({
            dealerId,
            customerName,
            appointmentDate,
            type: type || 'Other',
            notes
        });

        res.status(201).json({
            success: true,
            message: "Appointment created successfully.",
            data: newAppointment
        });
    } catch (error) {
        console.error("Error creating appointment:", error);
        throw new AppError("Failed to create appointment.", 500);
    }
};

/**
 * PATCH /api/v1/appointments/:id/status
 * Updates the status of an appointment.
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body as UpdateAppointmentStatusDTO;

    if (!status) {
        throw new AppError("New status is required.", 400);
    }

    try {
        // Check if appointment exists
        const appointment = await appointmentRepository.findById(id);
        if (!appointment) {
            throw new AppError("Appointment not found.", 404);
        }

        // TODO: Ensure dealer can only update their own appointment (future enhancement)
        
        await appointmentRepository.updateStatus(id, status);

        res.status(200).json({
            success: true,
            message: `Appointment status updated to '${status}'.`
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Failed to update status.", 500);
    }
};