import type { SystemSettings, User } from '@/types';

export const defaultSettings: SystemSettings = {
  maxWaitTime: 20,
  autoAssignConsultant: true,
  defaultReminderMethod: 'HEADSET',
  queueDisplayCount: 5,
  codeNamePool: [
    '紫罗兰', '月光石', '金丝雀', '薰衣草', '蓝宝石', '珍珠白',
    '樱花粉', '黑曜石', '翡翠绿', '珊瑚红', '琥珀黄', '银河灰',
    '玫瑰金', '孔雀蓝', '象牙白', '玛瑙黑', '水晶紫', '薄荷绿',
    '蜜桃粉', '深海蓝', '星空灰', '暖阳橙', '云杉绿', '暮色紫',
  ],
  standardConsultationTime: 45,
  standardConsultationMinutes: 45,
  maxExtensions: 2,
  extensionMinutes: 15,
  roomCleaningMinutes: 10,
  smsEnabled: true,
  headsetEnabled: true,
  screenNotificationEnabled: true,
  reminderThresholds: {
    BLACK_CARD: 10,
    VIP: 15,
    NORMAL: 20,
  },
  sootheServices: {
    BLACK_CARD: ['专属客户经理陪同', '赠送高端茶点礼盒', '优先安排服务', '赠送下次项目优惠券'],
    VIP: ['管家送上安抚茶点', '提供舒适休息区升级', '赠送小礼品'],
    NORMAL: ['送上温水和茶点', '友好告知等待时间'],
  },
  teaOptions: ['伯爵红茶', '茉莉绿茶', '玫瑰花茶', '洋甘菊茶', '拿铁咖啡', '卡布奇诺', '鲜榨果汁', '依云矿泉水'],
  privacySettings: {
    showCodeNameOnly: true,
    hideSensitiveProjects: true,
    silentModeDefault: true,
    autoGenerateCodeName: true,
  },
  sensitiveProjectTypes: ['整形修复', '私密整形', '丰胸手术', '面部轮廓', '吸脂塑形', '抗衰老治疗'],
};

export const mockUsers: User[] = [
  {
    id: 'u001',
    username: 'admin',
    name: '系统管理员',
    role: 'ADMIN',
  },
  {
    id: 'u002',
    username: 'reception',
    name: '张管家',
    role: 'RECEPTION',
  },
  {
    id: 'u003',
    username: 'consultant1',
    name: '林顾问',
    role: 'CONSULTANT',
  },
];

export const codeNamePool = [
  '紫罗兰', '月光石', '金丝雀', '薰衣草', '蓝宝石', '珍珠白',
  '樱花粉', '黑曜石', '翡翠绿', '珊瑚红', '琥珀黄', '银河灰',
  '玫瑰金', '孔雀蓝', '象牙白', '玛瑙黑', '水晶紫', '薄荷绿',
  '蜜桃粉', '深海蓝', '星空灰', '暖阳橙', '云杉绿', '暮色紫',
  '玉兰白', '海棠红', '桂花黄', '茉莉香', '铃兰音', '鸢尾梦',
];
