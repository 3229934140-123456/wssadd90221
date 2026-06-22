import { create } from 'zustand';
import type {
  Customer,
  Consultant,
  Room,
  QueueEntry,
  Appointment,
  ServiceRecord,
  SystemSettings,
  User,
  Notification,
  QueueStatus,
  RoomStatus,
  TeaStatus,
} from '@/types';
import { mockCustomers } from '@/data/mockCustomers';
import { mockConsultants } from '@/data/mockConsultants';
import { mockRooms } from '@/data/mockRooms';
import { mockAppointments } from '@/data/mockAppointments';
import { mockQueueEntries } from '@/data/mockQueueEntries';
import { defaultSettings, mockUsers, codeNamePool } from '@/data/mockSettings';
import { sortQueue } from '@/utils/sortEngine';

interface AppState {
  customers: Customer[];
  consultants: Consultant[];
  rooms: Room[];
  queueEntries: QueueEntry[];
  appointments: Appointment[];
  serviceRecords: ServiceRecord[];
  settings: SystemSettings;
  currentUser: User | null;
  notifications: Notification[];
  isAuthenticated: boolean;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  updateSettings: (settings: Partial<SystemSettings>) => void;
  addQueueEntry: (entry: Omit<QueueEntry, 'id' | 'position' | 'waitTime' | 'extensionMinutes' | 'isSilentCalled'>) => QueueEntry;
  updateQueueStatus: (id: string, status: QueueStatus) => void;
  updateTeaStatus: (id: string, status: TeaStatus) => void;
  assignConsultant: (queueEntryId: string, consultantId: string) => void;
  assignRoom: (queueEntryId: string, roomId: string) => void;
  triggerSilentCall: (queueEntryId: string) => void;
  requestExtension: (queueEntryId: string, minutes: number, reason: string) => void;
  completeService: (queueEntryId: string, record: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus, progress?: number) => void;
  getSortedQueue: () => QueueEntry[];
  getWaitingQueue: () => QueueEntry[];
  getInServiceEntries: () => QueueEntry[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  generateCodeName: () => string;
  findCustomerByMemberId: (memberId: string) => Customer | undefined;
  findAppointmentByCode: (code: string) => Appointment | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getConsultantById: (id: string) => Consultant | undefined;
  getRoomById: (id: string) => Room | undefined;
  getIdleRooms: () => Room[];
  getIdleConsultants: () => Consultant[];
  updateWaitTimes: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  customers: mockCustomers,
  consultants: mockConsultants,
  rooms: mockRooms,
  queueEntries: mockQueueEntries,
  appointments: mockAppointments,
  serviceRecords: [],
  settings: defaultSettings,
  currentUser: null,
  notifications: [],
  isAuthenticated: false,
  isLoggedIn: false,

  login: (username: string, password: string) => {
    const user = mockUsers.find(u => u.username === username);
    if (user && password === '123456') {
      set({ currentUser: user, isAuthenticated: true, isLoggedIn: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false, isLoggedIn: false });
  },

  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  addQueueEntry: (entry) => {
    const newEntry: QueueEntry = {
      ...entry,
      id: `q${Date.now()}`,
      position: 0,
      waitTime: 0,
      extensionMinutes: 0,
      isSilentCalled: false,
    };
    
    set(state => {
      const newEntries = [...state.queueEntries, newEntry];
      const sorted = sortQueue(newEntries, state.customers, state.appointments);
      return { queueEntries: newEntries.map(e => {
        const sortedEntry = sorted.find(s => s.id === e.id);
        return sortedEntry ? { ...e, position: sortedEntry.position } : e;
      })};
    });
    
    return newEntry;
  },

  updateQueueStatus: (id, status) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, status } : e
      ),
    }));
    
    if (status === 'IN_SERVICE') {
      const entry = get().queueEntries.find(e => e.id === id);
      if (entry?.consultantId) {
        set(state => ({
          consultants: state.consultants.map(c =>
            c.id === entry.consultantId ? { ...c, status: 'IN_SERVICE', currentLoad: c.currentLoad + 1 } : c
          ),
        }));
      }
      if (entry?.roomId) {
        set(state => ({
          rooms: state.rooms.map(r =>
            r.id === entry.roomId ? { ...r, status: 'IN_USE', currentQueueEntryId: id, cleaningProgress: 0 } : r
          ),
        }));
      }
    }
  },

  updateTeaStatus: (id, status) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, teaStatus: status } : e
      ),
    }));
  },

  assignConsultant: (queueEntryId, consultantId) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === queueEntryId ? { ...e, consultantId } : e
      ),
    }));
  },

  assignRoom: (queueEntryId, roomId) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === queueEntryId ? { ...e, roomId } : e
      ),
    }));
  },

  triggerSilentCall: (id) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, isSilentCalled: true } : e
      ),
    }));
    
    const entry = get().queueEntries.find(e => e.id === id);
    const customer = entry ? get().getCustomerById(entry.customerId) : null;
    
    get().addNotification({
      type: 'SUCCESS',
      message: `已向「${customer?.codeName || '贵宾'}」发送${entry?.reminderMethod === 'SMS' ? '短信' : '耳机'}提醒`,
      relatedQueueEntryId: id,
    });
  },

  requestExtension: (id, minutes, reason) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, extensionMinutes: minutes, extensionReason: reason } : e
      ),
    }));
    
    const entry = get().queueEntries.find(e => e.id === id);
    const customer = entry ? get().getCustomerById(entry.customerId) : null;
    
    get().addNotification({
      type: 'WARNING',
      message: `「${customer?.codeName || '贵宾'}」的顾问申请延长${minutes}分钟，原因：${reason}`,
      relatedQueueEntryId: id,
    });
  },

  completeService: (id, record) => {
    const newRecord: ServiceRecord = {
      ...record,
      id: `rec${Date.now()}`,
      createdAt: new Date(),
    };
    
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, status: 'COMPLETED' } : e
      ),
      serviceRecords: [...state.serviceRecords, newRecord],
    }));
    
    const entry = get().queueEntries.find(e => e.id === id);
    if (entry?.consultantId) {
      set(state => ({
        consultants: state.consultants.map(c =>
          c.id === entry.consultantId ? { ...c, status: 'IDLE', currentLoad: Math.max(0, c.currentLoad - 1), servedToday: c.servedToday + 1 } : c
        ),
      }));
    }
    if (entry?.roomId) {
      get().updateRoomStatus(entry.roomId, 'CLEANING', 0);
    }
  },

  updateRoomStatus: (roomId, status, progress) => {
    set(state => ({
      rooms: state.rooms.map(r =>
        r.id === roomId ? {
          ...r,
          status,
          cleaningProgress: progress ?? r.cleaningProgress,
          estimatedFreeTime: status === 'IDLE' ? undefined : r.estimatedFreeTime,
          currentQueueEntryId: status === 'IN_USE' ? r.currentQueueEntryId : undefined,
        } : r
      ),
    }));
  },

  getSortedQueue: () => {
    const state = get();
    return sortQueue(state.queueEntries, state.customers, state.appointments);
  },

  getWaitingQueue: () => {
    return get().getSortedQueue().filter(e => e.status === 'WAITING' || e.status === 'CONSULTANT_PREPARING');
  },

  getInServiceEntries: () => {
    return get().queueEntries.filter(e => e.status === 'IN_SERVICE');
  },

  addNotification: (notification) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif${Date.now()}`,
      timestamp: new Date(),
      read: false,
    };
    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));
  },

  markNotificationRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  generateCodeName: () => {
    const usedNames = get().customers.map(c => c.codeName);
    const available = codeNamePool.filter(n => !usedNames.includes(n));
    if (available.length === 0) return codeNamePool[Math.floor(Math.random() * codeNamePool.length)];
    return available[Math.floor(Math.random() * available.length)];
  },

  findCustomerByMemberId: (memberId) => {
    return get().customers.find(c => c.id === memberId || c.phone.includes(memberId));
  },

  findAppointmentByCode: (code) => {
    return get().appointments.find(a => a.code === code && a.status !== 'CANCELLED');
  },

  getCustomerById: (id) => {
    return get().customers.find(c => c.id === id);
  },

  getConsultantById: (id) => {
    return get().consultants.find(c => c.id === id);
  },

  getRoomById: (id) => {
    return get().rooms.find(r => r.id === id);
  },

  getIdleRooms: () => {
    return get().rooms.filter(r => r.status === 'IDLE');
  },

  getIdleConsultants: () => {
    return get().consultants.filter(c => c.status === 'IDLE');
  },

  updateWaitTimes: () => {
    const now = new Date();
    set(state => ({
      queueEntries: state.queueEntries.map(e => {
        if (e.status === 'WAITING' || e.status === 'CONSULTANT_PREPARING') {
          const waitMinutes = Math.floor((now.getTime() - e.checkinTime.getTime()) / 60000);
          return { ...e, waitTime: waitMinutes };
        }
        return e;
      }),
    }));
  },
}));
