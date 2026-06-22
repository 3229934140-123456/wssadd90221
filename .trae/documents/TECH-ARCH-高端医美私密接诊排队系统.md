## 1. 架构设计

```mermaid
flowchart TD
    subgraph "前端层"
        A1["接待区平板屏<br/>（React + Tailwind CSS）"]
        A2["内部调度端<br/>（React + Tailwind CSS）"]
    end
    
    subgraph "数据层"
        B1["状态管理<br/>（React Context + useReducer）"]
        B2["本地存储<br/>（localStorage + 加密）"]
        B3["Mock 数据服务<br/>（TypeScript 接口）"]
    end
    
    subgraph "业务逻辑层"
        C1["智能排序引擎"]
        C2["顾问分配算法"]
        C3["静默提醒服务"]
        C4["包间状态机"]
    end
    
    A1 <--> B1
    A2 <--> B1
    B1 <--> C1
    B1 <--> C2
    B1 <--> C3
    B1 <--> C4
    C1 & C2 & C3 & C4 --> B2
    B3 --> C1 & C2 & C3 & C4
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite@5
- **样式方案**：Tailwind CSS@3
- **路由管理**：React Router@6
- **状态管理**：React Context + useReducer（轻量级全局状态）
- **图标库**：Lucide React（线性极简图标）
- **日期处理**：date-fns
- **数据持久化**：localStorage（加密存储敏感信息）
- **后端服务**：无（采用本地 Mock 数据模拟后端接口）
- **数据库**：无（使用 TypeScript 定义数据模型 + Mock 数据）

## 3. 路由定义

| 路由 | 用途 | 访问权限 |
|------|------|----------|
| /reception | 接待区平板屏 - 隐私队列展示 | 公开（无需登录） |
| /dashboard | 内部调度端 - 首页看板 | 需登录 |
| /dashboard/checkin | 贵宾签到模块 | 前台管家/管理员 |
| /dashboard/queue | 隐私队列管理 | 前台管家/管理员 |
| /dashboard/consultants | 专属顾问分配 | 管理员 |
| /dashboard/rooms | 包间状态管理 | 全体工作人员 |
| /dashboard/records | 服务记录 | 咨询师/管理员 |
| /dashboard/settings | 系统设置 | 管理员 |
| /login | 登录页面 | 公开 |

## 4. 数据模型

### 4.1 实体关系图

```mermaid
erDiagram
    CUSTOMER ||--o{ QUEUE_ENTRY : "签到进入"
    CUSTOMER {
        string id "会员ID"
        string name "真实姓名（加密）"
        string phone "手机号（加密）"
        enum level "会员等级：普通/VIP/黑卡"
        string codeName "专属代号"
        string preferences "偏好（茶水等）"
        boolean isSensitive "是否高敏感度项目"
    }
    
    CONSULTANT ||--o{ QUEUE_ENTRY : "被分配"
    CONSULTANT {
        string id "顾问ID"
        string name "姓名"
        string avatar "头像"
        string[] specialties "专业领域"
        enum status "状态：离线/空闲/服务中"
        number currentLoad "当前负荷"
        string[] designatedBy "指定该顾问的客户列表"
    }
    
    ROOM ||--o{ QUEUE_ENTRY : "分配使用"
    ROOM {
        string id "包间ID"
        string name "包间名称"
        enum status "状态：空闲/清洁中/使用中/医生待入场"
        number cleaningProgress "清洁进度%"
        string estimatedFreeTime "预计空闲时间"
        string currentCustomerId "当前客户ID"
    }
    
    QUEUE_ENTRY ||--o{ SERVICE_RECORD : "产生"
    QUEUE_ENTRY {
        string id "队列项ID"
        string customerId "客户ID"
        string consultantId "分配的顾问ID"
        string roomId "分配的包间ID"
        enum status "状态：等待中/顾问准备中/服务中/已完成"
        string teaStatus "茶水状态：未准备/准备中/已送达"
        datetime checkinTime "签到时间"
        datetime estimatedStartTime "预计开始时间"
        number waitTime "已等待时长（分钟）"
        number position "队列位置"
        boolean isStandby "是否候补队列"
        boolean isSilentCalled "是否已静默提醒"
        number extensionMinutes "延长时间（分钟）"
        string extensionReason "延长原因"
    }
    
    SERVICE_RECORD {
        string id "记录ID"
        string queueEntryId "关联队列项ID"
        number experienceRating "接待体验评分（1-5）"
        string compensation "等待补偿措施"
        date nextAppointment "下次预约日期"
        string notes "备注"
        datetime createdAt "记录时间"
    }
    
    APPOINTMENT {
        string id "预约ID"
        string customerId "客户ID"
        string consultantId "指定顾问ID（可选）"
        datetime appointmentTime "预约时间"
        string project "项目（加密）"
        boolean isSensitive "是否敏感项目"
        string code "预约码"
    }
```

### 4.2 核心数据结构定义

```typescript
// 客户等级
export type CustomerLevel = 'NORMAL' | 'VIP' | 'BLACK_CARD';

// 队列状态
export type QueueStatus = 'WAITING' | 'CONSULTANT_PREPARING' | 'IN_SERVICE' | 'COMPLETED';

// 包间状态
export type RoomStatus = 'IDLE' | 'CLEANING' | 'IN_USE' | 'DOCTOR_PENDING';

// 顾问状态
export type ConsultantStatus = 'OFFLINE' | 'IDLE' | 'IN_SERVICE';

// 茶水状态
export type TeaStatus = 'NOT_PREPARED' | 'PREPARING' | 'DELIVERED';

// 提醒方式
export type ReminderMethod = 'SMS' | 'HEADSET' | 'NONE';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  level: CustomerLevel;
  codeName: string;
  teaPreference: string;
  isSensitive: boolean;
  avatar?: string;
}

export interface Consultant {
  id: string;
  name: string;
  avatar: string;
  specialties: string[];
  status: ConsultantStatus;
  currentLoad: number;
  rating: number;
}

export interface Room {
  id: string;
  name: string;
  status: RoomStatus;
  cleaningProgress: number;
  estimatedFreeTime?: Date;
  currentQueueEntryId?: string;
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
}

export interface SystemSettings {
  maxWaitTime: number;
  autoAssignConsultant: boolean;
  defaultReminderMethod: ReminderMethod;
  queueDisplayCount: number;
  codeNamePool: string[];
}
```

## 5. 核心算法说明

### 5.1 智能排序引擎

排序优先级（从高到低）：
1. **会员等级**：黑卡 > VIP > 普通
2. **是否指定顾问**：指定顾问优先
3. **项目敏感度**：高敏感度项目优先
4. **预约时间**：预约时间早者优先
5. **签到时间**：签到时间早者优先
6. **是否候补**：预约客户优先于临时候补

```typescript
const sortQueue = (entries: QueueEntry[], customers: Customer[], appointments: Appointment[]): QueueEntry[] => {
  const levelWeight = { BLACK_CARD: 100, VIP: 50, NORMAL: 10 };
  
  return [...entries].sort((a, b) => {
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
    
    if (scoreA !== scoreB) return scoreB - scoreA;
    
    return a.checkinTime.getTime() - b.checkinTime.getTime();
  });
};
```

### 5.2 顾问自动分配算法

分配策略：
1. 优先分配客户指定的顾问
2. 选择当前负荷最低的空闲顾问
3. 匹配顾问专业领域与客户项目
4. 考虑历史服务记录（回头客优先分配原顾问）

## 6. 目录结构

```
src/
├── assets/              # 静态资源（字体、图片）
├── components/          # 公共组件
│   ├── layout/         # 布局组件
│   ├── queue/          # 队列相关组件
│   ├── room/           # 包间相关组件
│   ├── consultant/     # 顾问相关组件
│   └── ui/             # 基础UI组件
├── contexts/           # React Context 状态管理
│   ├── QueueContext.tsx
│   ├── AuthContext.tsx
│   └── SettingsContext.tsx
├── data/               # Mock 数据
│   ├── mockCustomers.ts
│   ├── mockConsultants.ts
│   ├── mockRooms.ts
│   └── mockAppointments.ts
├── hooks/              # 自定义 Hooks
│   ├── useQueue.ts
│   ├── useTimer.ts
│   └── useEncryption.ts
├── pages/              # 页面组件
│   ├── reception/      # 接待区平板屏
│   ├── dashboard/      # 内部调度端
│   └── login/          # 登录页
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── sortEngine.ts
│   ├── assignment.ts
│   ├── codeName.ts
│   └── encryption.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 7. 隐私安全设计

1. **本地数据加密**：使用 AES 对 localStorage 中的客户姓名、手机号等敏感信息加密存储
2. **界面脱敏**：接待区屏幕不显示任何真实姓名、手机号、项目信息
3. **专属代号生成**：签到时自动从预设词库中随机分配专属代号，如「紫罗兰」「月光石」「金丝雀」
4. **路由守卫**：内部调度端所有页面需登录验证
5. **自动锁屏**：调度端闲置 5 分钟后自动返回登录页
