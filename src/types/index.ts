export type CustomerLevel = 'NORMAL' | 'VIP' | 'BLACK_CARD';

export type QueueStatus = 'WAITING' | 'CONSULTANT_PREPARING' | 'IN_SERVICE' | 'COMPLETED';

export type RoomStatus = 'IDLE' | 'CLEANING' | 'IN_USE' | 'DOCTOR_PENDING';

export type ConsultantStatus = 'OFFLINE' | 'IDLE' | 'IN_SERVICE';

export type TeaStatus = 'NOT_PREPARED' | 'PREPARING' | 'DELIVERED';

export type ReminderMethod = 'SMS' | 'HEADSET' | 'NONE' | 'SILENT' | 'CALL';

export type UserRole = 'RECEPTIONIST' | 'RECEPTION' | 'CONSULTANT' | 'ADMIN';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  level: CustomerLevel;
  codeName: string;
  teaPreference: string;
  isSensitive: boolean;
  lastVisit?: Date;
  totalVisits: number;
}

export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  status: ConsultantStatus;
  currentLoad: number;
  rating: number;
  yearsOfExperience: number;
  servedToday: number;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  cleaningProgress: number;
  estimatedFreeTime?: Date;
  currentQueueEntryId?: string;
  type: 'STANDARD' | 'VIP' | 'SURGICAL';
}

export interface QueueEntry {
  id: string;
  customerId: string;
  consultantId?: string;
  roomId?: string;
  status: QueueStatus;
  teaStatus: TeaStatus;
  checkinTime: Date;
  estimatedStartTime?: Date;
  waitTime: number;
  position: number;
  isStandby: boolean;
  isSilentCalled: boolean;
  extensionMinutes: number;
  extensionReason?: string;
  reminderMethod: ReminderMethod;
  appointmentId?: string;
  designatedConsultantId?: string;
  project?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  consultantId?: string;
  appointmentTime: Date;
  project: string;
  isSensitive: boolean;
  code: string;
  status: 'PENDING' | 'CHECKED_IN' | 'CANCELLED';
}

export interface ServiceRecord {
  id: string;
  queueEntryId: string;
  customerId: string;
  consultantId: string;
  experienceRating: number;
  compensation: string[];
  nextAppointmentDate?: Date;
  notes: string;
  createdAt: Date;
  actualDuration: number;
}

export interface SystemSettings {
  maxWaitTime: number;
  autoAssignConsultant: boolean;
  defaultReminderMethod: ReminderMethod;
  queueDisplayCount: number;
  codeNamePool: string[];
  standardConsultationTime: number;
  standardConsultationMinutes: number;
  maxExtensions: number;
  extensionMinutes: number;
  roomCleaningMinutes: number;
  smsEnabled: boolean;
  headsetEnabled: boolean;
  screenNotificationEnabled: boolean;
  reminderThresholds: {
    BLACK_CARD: number;
    VIP: number;
    NORMAL: number;
  };
  sootheServices: {
    BLACK_CARD: string[];
    VIP: string[];
    NORMAL: string[];
  };
  teaOptions: string[];
  privacySettings: {
    showCodeNameOnly: boolean;
    hideSensitiveProjects: boolean;
    silentModeDefault: boolean;
    autoGenerateCodeName: boolean;
  };
  sensitiveProjectTypes: string[];
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'URGENT' | 'SUCCESS';
  message: string;
  timestamp: Date;
  read: boolean;
  relatedQueueEntryId?: string;
}
