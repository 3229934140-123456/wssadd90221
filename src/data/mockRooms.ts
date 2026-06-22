import type { Room } from '@/types';

const now = new Date();

export const mockRooms: Room[] = [
  {
    id: 'r001',
    name: '幽兰阁',
    status: 'IN_USE',
    cleaningProgress: 0,
    estimatedFreeTime: new Date(now.getTime() + 25 * 60000),
    type: 'VIP',
  },
  {
    id: 'r002',
    name: '清风轩',
    status: 'IDLE',
    cleaningProgress: 100,
    type: 'STANDARD',
  },
  {
    id: 'r003',
    name: '雅韵居',
    status: 'CLEANING',
    cleaningProgress: 65,
    estimatedFreeTime: new Date(now.getTime() + 10 * 60000),
    type: 'VIP',
  },
  {
    id: 'r004',
    name: '墨香斋',
    status: 'DOCTOR_PENDING',
    cleaningProgress: 100,
    estimatedFreeTime: new Date(now.getTime() + 5 * 60000),
    type: 'SURGICAL',
  },
  {
    id: 'r005',
    name: '静思堂',
    status: 'IDLE',
    cleaningProgress: 100,
    type: 'STANDARD',
  },
  {
    id: 'r006',
    name: '云锦阁',
    status: 'IN_USE',
    cleaningProgress: 0,
    estimatedFreeTime: new Date(now.getTime() + 40 * 60000),
    type: 'VIP',
  },
];
