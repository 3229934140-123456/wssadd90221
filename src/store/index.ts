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
  TimelineEvent,
  TimelineEventType,
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
  handleExtension: (notificationId: string, queueEntryId: string, result: 'APPROVED' | 'REJECTED') => void;
  completeService: (queueEntryId: string, record: Omit<ServiceRecord, 'id' | 'createdAt'>) => void;
  updateRoomStatus: (roomId: string, status: RoomStatus, progress?: number) => void;
  getSortedQueue: () => QueueEntry[];
  getWaitingQueue: () => QueueEntry[];
  getInServiceEntries: () => QueueEntry[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'handled'>) => void;
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
  addCustomer: (customer: Customer) => void;
  hasCheckedInAppointment: (appointmentId: string) => boolean;
  adjustQueuePosition: (queueEntryId: string, type: 'TOP' | 'BACK', reason: string) => void;
  updateAppointmentStatus: (appointmentId: string, status: 'PENDING' | 'CHECKED_IN' | 'CANCELLED') => void;
  addTimelineEvent: (queueEntryId: string, event: Omit<TimelineEvent, 'id' | 'timestamp'>) => void;
  updatePrivacyNotes: (queueEntryId: string, notes: string) => void;
  getNextWaitingEntry: (consultantId: string) => QueueEntry | null;
  recalculateEstimatedTimes: () => void;
  getTimelineForEntry: (queueEntryId: string) => TimelineEvent[];
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
      manualSortWeight: 0,
      timeline: [
        {
          id: `tl_${Date.now()}_checkin`,
          type: 'CHECKIN',
          timestamp: new Date(),
          description: '已到店签到',
          operator: get().currentUser?.name,
        },
      ],
    };
    
    if (entry.appointmentId) {
      get().updateAppointmentStatus(entry.appointmentId, 'CHECKED_IN');
    }
    
    set(state => {
      const newEntries = [...state.queueEntries, newEntry];
      const sorted = sortQueue(newEntries, state.customers, state.appointments);
      const finalEntries = newEntries.map(e => {
        const sortedEntry = sorted.find(s => s.id === e.id);
        return sortedEntry ? { ...e, position: sortedEntry.position } : e;
      });
      return { queueEntries: finalEntries };
    });
    
    setTimeout(() => get().recalculateEstimatedTimes(), 0);
    
    return newEntry;
  },

  updateQueueStatus: (id, status) => {
    const standardMinutes = get().settings.standardConsultationMinutes;
    const now = new Date();
    
    let timelineType: TimelineEventType | null = null;
    let timelineDesc = '';
    
    if (status === 'CONSULTANT_PREPARING') {
      timelineType = 'CONSULTANT_PREPARE';
      timelineDesc = '顾问准备中';
    } else if (status === 'IN_SERVICE') {
      timelineType = 'START_SERVICE';
      timelineDesc = '进入服务';
    } else if (status === 'COMPLETED') {
      timelineType = 'COMPLETE_SERVICE';
      timelineDesc = '服务完成';
    }
    
    set(state => ({
      queueEntries: state.queueEntries.map(e => {
        if (e.id === id) {
          const updated = { ...e, status };
          
          if (status === 'IN_SERVICE') {
            updated.serviceStartTime = now;
            updated.estimatedEndTime = new Date(now.getTime() + standardMinutes * 60000);
          }
          
          if (timelineType) {
            updated.timeline = [...e.timeline, {
              id: `tl_${Date.now()}_${timelineType}`,
              type: timelineType,
              timestamp: now,
              description: timelineDesc,
              operator: get().currentUser?.name,
            }];
          }
          
          return updated;
        }
        return e;
      }),
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
    
    if (status === 'IN_SERVICE' || status === 'COMPLETED') {
      setTimeout(() => get().recalculateEstimatedTimes(), 0);
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
    const consultantName = get().currentUser?.name || '咨询顾问';
    const now = new Date();
    
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { 
          ...e, 
          extensionMinutes: minutes, 
          extensionReason: reason,
          extensionStatus: 'PENDING',
          timeline: [...e.timeline, {
            id: `tl_${Date.now()}_ext_req`,
            type: 'EXTENSION_REQUEST',
            timestamp: now,
            description: `申请延长${minutes}分钟`,
            operator: consultantName,
            details: reason,
          }],
        } : e
      ),
    }));
    
    const entry = get().queueEntries.find(e => e.id === id);
    const customer = entry ? get().getCustomerById(entry.customerId) : null;
    
    const notificationId = `notif${Date.now()}`;
    const newNotification: Notification = {
      id: notificationId,
      type: 'WARNING',
      message: `「${customer?.codeName || '贵宾'}」的${consultantName}申请延长${minutes}分钟，原因：${reason}`,
      timestamp: new Date(),
      read: false,
      handled: false,
      relatedQueueEntryId: id,
      action: 'EXTENSION_REQUEST',
      actionData: { minutes, reason, consultantName },
    };
    
    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50),
    }));
  },

  handleExtension: (notificationId, queueEntryId, result) => {
    const handlerName = get().currentUser?.name || '前台管家';
    const entry = get().queueEntries.find(e => e.id === queueEntryId);
    const customer = entry ? get().getCustomerById(entry.customerId) : null;
    const now = new Date();
    
    set(state => ({
      queueEntries: state.queueEntries.map(e => {
        if (e.id === queueEntryId) {
          const updated = {
            ...e,
            extensionStatus: result,
            extensionHandledBy: handlerName,
            extensionMinutes: result === 'APPROVED' ? e.extensionMinutes : 0,
            extensionReason: result === 'APPROVED' ? e.extensionReason : undefined,
          };
          
          const timelineType = result === 'APPROVED' ? 'EXTENSION_APPROVED' : 'EXTENSION_REJECTED';
          updated.timeline = [...e.timeline, {
            id: `tl_${Date.now()}_${timelineType}`,
            type: timelineType,
            timestamp: now,
            description: `延长申请已${result === 'APPROVED' ? '同意' : '驳回'}`,
            operator: handlerName,
            details: result === 'APPROVED' ? `延长${e.extensionMinutes}分钟` : e.extensionReason,
          }];
          
          if (result === 'APPROVED' && e.estimatedEndTime) {
            updated.estimatedEndTime = new Date(e.estimatedEndTime.getTime() + e.extensionMinutes * 60000);
          }
          
          return updated;
        }
        return e;
      }),
      notifications: state.notifications.map(n =>
        n.id === notificationId ? {
          ...n,
          handled: true,
          handledBy: handlerName,
          handledAt: new Date(),
          actionResult: result,
          read: true,
        } : n
      ),
    }));
    
    if (result === 'APPROVED') {
      setTimeout(() => get().recalculateEstimatedTimes(), 0);
    }
    
    get().addNotification({
      type: result === 'APPROVED' ? 'SUCCESS' : 'INFO',
      message: `延长申请已${result === 'APPROVED' ? '同意' : '驳回'}：「${customer?.codeName || '贵宾'}」`,
      relatedQueueEntryId: queueEntryId,
    });
  },

  completeService: (id, record) => {
    const entry = get().queueEntries.find(e => e.id === id);
    const newRecord: ServiceRecord = {
      ...record,
      id: `rec${Date.now()}`,
      createdAt: new Date(),
      privacyNotes: entry?.privacyNotes,
      timeline: entry?.timeline,
    };
    
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === id ? { ...e, status: 'COMPLETED' } : e
      ),
      serviceRecords: [...state.serviceRecords, newRecord],
    }));
    
    const entryData = get().queueEntries.find(e => e.id === id);
    if (entryData?.consultantId) {
      set(state => ({
        consultants: state.consultants.map(c =>
          c.id === entryData.consultantId ? { ...c, status: 'IDLE', currentLoad: Math.max(0, c.currentLoad - 1), servedToday: c.servedToday + 1 } : c
        ),
      }));
    }
    if (entryData?.roomId) {
      get().updateRoomStatus(entryData.roomId, 'CLEANING', 0);
    }
    
    setTimeout(() => get().recalculateEstimatedTimes(), 0);
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
      handled: false,
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

  addCustomer: (customer) => {
    set(state => ({
      customers: [...state.customers, customer],
    }));
  },

  hasCheckedInAppointment: (appointmentId) => {
    const appointment = get().appointments.find(a => a.id === appointmentId);
    return appointment?.status === 'CHECKED_IN' || 
      get().queueEntries.some(e => e.appointmentId === appointmentId);
  },

  adjustQueuePosition: (queueEntryId, type, reason) => {
    const handlerName = get().currentUser?.name || '前台管家';
    const entry = get().queueEntries.find(e => e.id === queueEntryId);
    const customer = entry ? get().getCustomerById(entry.customerId) : null;
    const now = new Date();
    
    const waitingEntries = get().getWaitingQueue();
    
    let newWeight = 0;
    if (type === 'TOP') {
      const maxWeight = Math.max(...waitingEntries.map(e => e.manualSortWeight || 0), 0);
      newWeight = maxWeight + 1000;
    } else {
      const minWeight = Math.min(...waitingEntries.map(e => e.manualSortWeight || 0), 0);
      newWeight = minWeight - 1000;
    }
    
    set(state => ({
      queueEntries: state.queueEntries.map(e => {
        if (e.id === queueEntryId) {
          return {
            ...e,
            manualSortWeight: newWeight,
            manualAdjustment: {
              adjustedBy: handlerName,
              adjustedAt: now,
              reason,
              type,
            },
            timeline: [...e.timeline, {
              id: `tl_${Date.now()}_queue_adj`,
              type: 'QUEUE_ADJUSTED',
              timestamp: now,
              description: type === 'TOP' ? '已置顶' : '已延后',
              operator: handlerName,
              details: reason,
            }],
          };
        }
        return e;
      }),
    }));
    
    set(state => {
      const sorted = sortQueue(state.queueEntries, state.customers, state.appointments);
      return {
        queueEntries: state.queueEntries.map(e => {
          const sortedEntry = sorted.find(s => s.id === e.id);
          return sortedEntry ? { ...e, position: sortedEntry.position } : e;
        }),
      };
    });
    
    setTimeout(() => get().recalculateEstimatedTimes(), 0);
    
    get().addNotification({
      type: 'INFO',
      message: `队列顺序已调整：「${customer?.codeName || '贵宾'}」${type === 'TOP' ? '置顶' : '延后'}，原因：${reason}`,
      relatedQueueEntryId: queueEntryId,
      action: 'QUEUE_ADJUSTMENT',
      actionData: { type, reason, handlerName },
    });
  },

  updateAppointmentStatus: (appointmentId, status) => {
    set(state => ({
      appointments: state.appointments.map(a =>
        a.id === appointmentId ? { ...a, status } : a
      ),
    }));
  },

  addTimelineEvent: (queueEntryId, event) => {
    const now = new Date();
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === queueEntryId ? {
          ...e,
          timeline: [...e.timeline, {
            ...event,
            id: `tl_${Date.now()}_${event.type}`,
            timestamp: now,
          }],
        } : e
      ),
    }));
  },

  updatePrivacyNotes: (queueEntryId, notes) => {
    set(state => ({
      queueEntries: state.queueEntries.map(e =>
        e.id === queueEntryId ? { ...e, privacyNotes: notes } : e
      ),
    }));
  },

  getNextWaitingEntry: (consultantId) => {
    const waiting = get().getWaitingQueue();
    return waiting.find(e => 
      !e.designatedConsultantId || e.designatedConsultantId === consultantId
    ) || null;
  },

  recalculateEstimatedTimes: () => {
    const state = get();
    const standardMinutes = state.settings.standardConsultationMinutes;
    const waitingQueue = state.getWaitingQueue();
    const inServiceEntries = state.getInServiceEntries();
    
    const consultantEndTimes: Record<string, Date> = {};
    inServiceEntries.forEach(entry => {
      if (entry.consultantId && entry.estimatedEndTime) {
        consultantEndTimes[entry.consultantId] = entry.estimatedEndTime;
      }
    });
    
    const now = new Date();
    
    set(s => ({
      queueEntries: s.queueEntries.map(e => {
        if (e.status !== 'WAITING' && e.status !== 'CONSULTANT_PREPARING') return e;
        
        const consultantId = e.consultantId || e.designatedConsultantId;
        let baseTime = now;
        
        if (consultantId && consultantEndTimes[consultantId]) {
          baseTime = consultantEndTimes[consultantId];
        } else {
          const inServiceForConsultant = inServiceEntries.filter(
            s => s.consultantId === consultantId
          );
          if (inServiceForConsultant.length > 0) {
            const latestEnd = new Date(Math.max(
              ...inServiceForConsultant.map(s => s.estimatedEndTime?.getTime() || now.getTime())
            ));
            baseTime = latestEnd;
            if (consultantId) {
              consultantEndTimes[consultantId] = latestEnd;
            }
          }
        }
        
        const estimatedStart = new Date(baseTime.getTime());
        const estimatedEnd = new Date(baseTime.getTime() + standardMinutes * 60000);
        
        if (consultantId) {
          consultantEndTimes[consultantId] = estimatedEnd;
        }
        
        return {
          ...e,
          estimatedStartTime: estimatedStart,
          estimatedEndTime: estimatedEnd,
        };
      }),
    }));
  },

  getTimelineForEntry: (queueEntryId) => {
    const entry = get().queueEntries.find(e => e.id === queueEntryId);
    return entry?.timeline || [];
  },
}));
