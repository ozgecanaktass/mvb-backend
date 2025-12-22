// Represents the 'appointments' table in Azure SQL
// Defines the structure for scheduling eye exams, styling sessions, etc
export interface Appointment {
    id: number;
    dealerId: number;       // Foreign Key to Dealers table
    customerName: string;   
    appointmentDate: Date;  
    type: 'Eye Exam' | 'Styling' | 'Adjustment' | 'Other'; // Type of service
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show'; // Current status
    notes?: string;         // Optional notes
    createdAt: Date;
    updatedAt: Date;
}

// DTO for creating a new appointment
export interface CreateAppointmentDTO {
    dealerId: number;
    customerName: string;
    appointmentDate: string; 
    type: 'Eye Exam' | 'Styling' | 'Adjustment' | 'Other';
    notes?: string;
}

// DTO for updating appointment status
export interface UpdateAppointmentStatusDTO {
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'No Show';
}