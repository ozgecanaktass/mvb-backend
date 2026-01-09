import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from './appointments.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management operations
 */

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List all appointments (Filtered by Role)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments.
 */
router.get('/', protect, getAppointments);

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dealerId, customerName, appointmentDate]
 *             properties:
 *               dealerId:
 *                 type: integer
 *               customerName:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date-time
 *               type:
 *                 type: string
 *                 enum: [Eye Exam, Styling, Adjustment, Other]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Appointment successfully created.
 */
router.post('/', protect, createAppointment);

/**
 * @swagger
 * /appointments/{id}/status:
 *   patch:
 *     summary: Update appointment status
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Completed, Cancelled, No Show]
 *     responses:
 *       200:
 *         description: Status updated.
 */
router.patch('/:id/status', protect, updateAppointmentStatus);

/**
 * Express router for managing appointment routes.
 * Mounts the following endpoints:
 * - GET /: List appointments
 * - POST /: Create appointment
 * - PATCH /:id/status: Update appointment status
 */
export default router;