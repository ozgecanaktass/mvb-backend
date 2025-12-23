import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from './appointments.controller';
import { protect } from '../../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 * name: Appointments
 * description: Randevu yönetimi işlemleri
 */

/**
 * @swagger
 * /appointments:
 * get:
 * summary: Tüm randevuları listele (Role göre filtrelenmiş)
 * tags: [Appointments]
 * security:
 * - bearerAuth: []
 * responses:
 * 200:
 * description: Randevu listesi.
 */
router.get('/', protect, getAppointments);

/**
 * @swagger
 * /appointments:
 * post:
 * summary: Yeni randevu oluştur
 * tags: [Appointments]
 * security:
 * - bearerAuth: []
 * requestBody:
 * required: true
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [dealerId, customerName, appointmentDate]
 * properties:
 * dealerId:
 * type: integer
 * customerName:
 * type: string
 * appointmentDate:
 * type: string
 * format: date-time
 * type:
 * type: string
 * enum: [Eye Exam, Styling, Adjustment, Other]
 * notes:
 * type: string
 * responses:
 * 201:
 * description: Randevu başarıyla oluşturuldu.
 */
router.post('/', protect, createAppointment);

/**
 * @swagger
 * /appointments/{id}/status:
 * patch:
 * summary: Randevu durumunu güncelle
 * tags: [Appointments]
 * security:
 * - bearerAuth: []
 * parameters:
 * - in: path
 * name: id
 * required: true
 * schema:
 * type: integer
 * requestBody:
 * content:
 * application/json:
 * schema:
 * type: object
 * required: [status]
 * properties:
 * status:
 * type: string
 * enum: [Scheduled, Completed, Cancelled, No Show]
 * responses:
 * 200:
 * description: Durum güncellendi.
 */
router.patch('/:id/status', protect, updateAppointmentStatus);

export default router;