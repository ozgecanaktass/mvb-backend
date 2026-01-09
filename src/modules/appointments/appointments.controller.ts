import { Request, Response } from 'express';
import { CreateAppointmentDTO, Appointment, UpdateAppointmentStatusDTO } from '../../shared/models/Appointment';
import { AppError } from '../../shared/utils/AppError';
import { appointmentRepository } from './appointments.repository';

/**
 * Retrieves a list of appointments.
 * 
 * If the user is a 'producer_admin', all appointments are returned.
 * If the user is a 'dealer_admin' or 'dealer_user', only appointments associated with their dealer ID are returned.
 * 
 * @param req - The express request object containing user information.
 * @param res - The express response object.
 * @returns A JSON response containing the list of appointments.
 */
export const getAppointments = async (req: Request, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            throw new AppError("Unauthorized access. User information not found.", 401);
        }

        let appointments: Appointment[] = [];

        // Producer Admin: Fetch all appointments
        if (user.role === 'producer_admin') {
            appointments = await appointmentRepository.findAll();
        }
        // Dealer Admin or Staff: Fetch appointments only for their specific Dealer
        else if (user.dealerId) {
            appointments = await appointmentRepository.findByDealerId(user.dealerId);
        }

        res.status(200).json({
            success: true,
            count: appointments.length,
            data: appointments
        });
    } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError("Failed to fetch appointments.", 500);
    }
};

/**
 * Creates a new appointment.
 * 
 * Enforces security by ensuring dealer users can only create appointments for their own dealer.
 * 
 * @param req - The express request object containing the appointment details in the body.
 * @param res - The express response object.
 * @returns A JSON response containing the created appointment.
 */
export const createAppointment = async (req: Request, res: Response) => {
    let { dealerId, customerName, appointmentDate, type, notes } = req.body as CreateAppointmentDTO;
    const user = req.user;

    // Security: Enforce dealerId for Dealer Admin or User roles
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
        throw new AppError("Failed to create appointment.", 500);
    }
};

/**
 * Updates the status of an existing appointment.
 * 
 * @param req - The express request object containing the appointment ID in params and new status in the body.
 * @param res - The express response object.
 * @returns A JSON response confirming the status update.
 */
export const updateAppointmentStatus = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { status } = req.body as UpdateAppointmentStatusDTO;

    if (!status) {
        throw new AppError("New status is required.", 400);
    }

    try {
        const appointment = await appointmentRepository.findById(id);
        if (!appointment) {
            throw new AppError("Appointment not found.", 404);
        }

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