import { Router } from 'express';
import { createAppointment, getAppointments, updateAppointmentStatus } from './appointments.controller';
import { protect } from '../../middlewares/auth.middleware'; // Authentication middleware

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
// GET /api/v1/appointments
// Kullanıcı rolüne göre (Admin -> Hepsi, Bayi -> Kendisi) filtrelenmiş liste döner.
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
// POST /api/v1/appointments
// Yeni randevu kaydı. Bayi personeli eklerken dealerId otomatik atanır.
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
// PATCH /api/v1/appointments/:id/status
// Randevu durumunu değiştir (Örn: İptal edildi, Tamamlandı).
router.patch('/:id/status', protect, updateAppointmentStatus);

export default router;