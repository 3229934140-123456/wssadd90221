import type { Appointment } from '@/types';

const now = new Date();

export const mockAppointments: Appointment[] = [
  {
    id: 'apt001',
    customerId: 'c001',
    consultantId: 'con001',
    appointmentTime: new Date(now.getTime() - 10 * 60000),
    project: '面部综合抗衰',
    isSensitive: true,
    code: 'VIP20260622001',
    status: 'CHECKED_IN',
  },
  {
    id: 'apt002',
    customerId: 'c002',
    consultantId: 'con003',
    appointmentTime: new Date(now.getTime() - 5 * 60000),
    project: '皮肤护理套餐',
    isSensitive: false,
    code: 'VIP20260622002',
    status: 'CHECKED_IN',
  },
  {
    id: 'apt003',
    customerId: 'c003',
    appointmentTime: new Date(now.getTime() + 15 * 60000),
    project: '私密整形咨询',
    isSensitive: true,
    code: 'VIP20260622003',
    status: 'PENDING',
  },
  {
    id: 'apt004',
    customerId: 'c005',
    consultantId: 'con002',
    appointmentTime: new Date(now.getTime() + 30 * 60000),
    project: '鼻部综合修复',
    isSensitive: true,
    code: 'VIP20260622004',
    status: 'PENDING',
  },
  {
    id: 'apt005',
    customerId: 'c006',
    appointmentTime: new Date(now.getTime() + 45 * 60000),
    project: '注射美容',
    isSensitive: false,
    code: 'VIP20260622005',
    status: 'PENDING',
  },
];
