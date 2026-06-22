import type { QueueEntry, Customer, Appointment } from '@/types';

export const sortQueue = (
  entries: QueueEntry[],
  customers: Customer[],
  appointments: Appointment[]
): QueueEntry[] => {
  const levelWeight = { BLACK_CARD: 100, VIP: 50, NORMAL: 10 };
  
  return [...entries]
    .filter(e => e.status !== 'COMPLETED' && e.status !== 'IN_SERVICE')
    .sort((a, b) => {
      const customerA = customers.find(c => c.id === a.customerId)!;
      const customerB = customers.find(c => c.id === b.customerId)!;
      const aptA = appointments.find(ap => ap.id === a.appointmentId);
      const aptB = appointments.find(ap => ap.id === b.appointmentId);
      
      let scoreA = levelWeight[customerA.level];
      let scoreB = levelWeight[customerB.level];
      
      if (a.designatedConsultantId) scoreA += 30;
      if (b.designatedConsultantId) scoreB += 30;
      
      if (customerA.isSensitive) scoreA += 25;
      if (customerB.isSensitive) scoreB += 25;
      
      if (aptA) scoreA += 15;
      if (aptB) scoreB += 15;
      
      if (a.isStandby) scoreA -= 20;
      if (b.isStandby) scoreB -= 20;
      
      if (a.status === 'CONSULTANT_PREPARING' && b.status !== 'CONSULTANT_PREPARING') return -1;
      if (b.status === 'CONSULTANT_PREPARING' && a.status !== 'CONSULTANT_PREPARING') return 1;
      
      if (scoreA !== scoreB) return scoreB - scoreA;
      
      return a.checkinTime.getTime() - b.checkinTime.getTime();
    })
    .map((entry, index) => ({
      ...entry,
      position: entry.status === 'CONSULTANT_PREPARING' ? 1 : index + 1,
    }));
};

export const getQueueStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    WAITING: '请稍候',
    CONSULTANT_PREPARING: '顾问准备中',
    IN_SERVICE: '服务中',
    COMPLETED: '已完成',
  };
  return statusMap[status] || '等待中';
};

export const getTeaStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    NOT_PREPARED: '',
    PREPARING: '茶点准备中',
    DELIVERED: '茶点已送达',
  };
  return statusMap[status] || '';
};

export const getLevelBadge = (level: string): { text: string; color: string } => {
  const levelMap: Record<string, { text: string; color: string }> = {
    BLACK_CARD: { text: '黑卡', color: 'bg-warm-gold text-deep-space' },
    VIP: { text: 'VIP', color: 'bg-rose-gold text-deep-space' },
    NORMAL: { text: '会员', color: 'bg-slate-blue text-ivory' },
  };
  return levelMap[level] || { text: '会员', color: 'bg-slate-blue text-ivory' };
};

export const formatWaitTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};
