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
  estimatedEndTime?: Date;
  serviceStartTime?: Date;
  waitTime: number;
  position: number;
  isStandby: boolean;
  isSilentCalled: boolean;
  extensionMinutes: number;
  extensionReason?: string;
  extensionStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  extensionHandledBy?: string;
  reminderMethod: ReminderMethod;
  appointmentId?: string;
  designatedConsultantId?: string;
  project?: string;
  manualAdjustment?: {
    adjustedBy: string;
    adjustedAt: Date;
    reason: string;
    type: 'TOP' | 'BACK';
  };
  manualSortWeight?: number;
  privacyNotes?: string;
  timeline?: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: Date;
  operator?: string;
  description: string;
  details?: string;
}

export type TimelineEventType = 
  | 'CHECKIN'
  | 'VIEW_DETAILS'
  | 'CONFIRM_CHECKIN'
  | 'CONSULTANT_PREPARE'
  | 'START_SERVICE'
  | 'EXTENSION_REQUEST'
  | 'EXTENSION_APPROVED'
  | 'EXTENSION_REJECTED'
  | 'TEA_DELIVERED'
  | 'SILENT_CALLED'
  | 'QUEUE_ADJUSTED'
  | 'COMPLETE_SERVICE'
  | 'SOOTHE_SERVICE';

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
  privacyNotes?: string;
  timeline?: TimelineEvent[];
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
  handled: boolean;
  relatedQueueEntryId?: string;
  action?: 'EXTENSION_REQUEST' | 'QUEUE_ADJUSTMENT';
  actionData?: Record<string, any>;
  handledBy?: string;
  handledAt?: Date;
  actionResult?: 'APPROVED' | 'REJECTED';
}
