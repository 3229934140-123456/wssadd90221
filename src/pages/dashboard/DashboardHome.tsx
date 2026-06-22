import { useEffect } from 'react';
import { Users, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store';
import { getLevelBadge } from '@/utils/sortEngine';
import { format } from 'date-fns';

const DashboardHome = () => {
  const { 
    getWaitingQueue, 
    getInServiceEntries, 
    getCustomerById, 
    getConsultantById,
    getRoomById,
    rooms,
    consultants,
    updateWaitTimes,
    settings,
  } = useAppStore();

  const waitingQueue = getWaitingQueue();
  const inServiceEntries = getInServiceEntries();

  useEffect(() => {
    const timer = setInterval(updateWaitTimes, 60000);
    return () => clearInterval(timer);
  }, [updateWaitTimes]);

  const overWaitTime = waitingQueue.filter(e => e.waitTime >= settings.maxWaitTime);

  const stats = [
    { 
      label: '等候中', 
      value: waitingQueue.length, 
      icon: Users, 
      color: 'text-rose-gold',
      bgColor: 'bg-rose-gold/10'
    },
    { 
      label: '服务中', 
      value: inServiceEntries.length, 
      icon: Sparkles, 
      color: 'text-matcha',
      bgColor: 'bg-matcha/10'
    },
    { 
      label: '空闲包间', 
      value: rooms.filter(r => r.status === 'IDLE').length, 
      icon: Clock, 
      color: 'text-slate-blue',
      bgColor: 'bg-slate-blue/10'
    },
    { 
      label: '等待超时', 
      value: overWaitTime.length, 
      icon: AlertTriangle, 
      color: overWaitTime.length > 0 ? 'text-warm-gold' : 'text-ivory/40',
      bgColor: overWaitTime.length > 0 ? 'bg-warm-gold/10' : 'bg-ivory/5'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.label}
              className="luxury-card p-6 gradient-border animate-slide-up"
              style={{ animationDelay: `${0.1 * index}s` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-ivory/50 text-sm tracking-wider font-light">{stat.label}</p>
                  <p className={`text-4xl font-serif font-light mt-2 ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`w-14 h-14 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-ivory/80 tracking-wider">等候队列</h3>
              <span className="text-ivory/40 text-sm">共 {waitingQueue.length} 位</span>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
              {waitingQueue.length === 0 ? (
                <div className="text-center py-12 text-ivory/40">
                  暂无等候顾客
                </div>
              ) : (
                waitingQueue.slice(0, 6).map((entry, index) => {
                  const customer = getCustomerById(entry.customerId);
                  const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
                  const levelBadge = customer ? getLevelBadge(customer.level) : null;
                  const isOverTime = entry.waitTime >= settings.maxWaitTime;
                  
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-xl transition-all hover:bg-deep-space-dark/50 ${
                        isOverTime ? 'bg-warm-gold/10 border border-warm-gold/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.status === 'CONSULTANT_PREPARING'
                            ? 'bg-rose-gold/20'
                            : 'bg-deep-space-dark/50'
                        }`}>
                          <span className="font-serif text-rose-gold">{entry.position}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-ivory/90 font-medium">
                              {customer?.codeName || '尊贵嘉宾'}
                            </span>
                            {levelBadge && (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${levelBadge.color}`}>
                                {levelBadge.text}
                              </span>
                            )}
                          </div>
                          <p className="text-ivory/40 text-sm mt-1">
                            {consultant ? `顾问：${consultant.name}` : '待分配顾问'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${isOverTime ? 'text-warm-gold' : 'text-ivory/60'}`}>
                          已等候 {entry.waitTime} 分钟
                        </p>
                        <p className="text-ivory/40 text-xs mt-1">
                          {format(entry.checkinTime, 'HH:mm')} 签到
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-lg text-ivory/80 tracking-wider">正在服务</h3>
              <span className="text-ivory/40 text-sm">共 {inServiceEntries.length} 位</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {inServiceEntries.map((entry, index) => {
                const customer = getCustomerById(entry.customerId);
                const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
                const room = entry.roomId ? getRoomById(entry.roomId) : null;
                
                return (
                  <div
                    key={entry.id}
                    className="p-4 rounded-xl bg-deep-space-dark/30 border border-rose-gold/10"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-rose-gold animate-pulse-soft" />
                      <span className="text-ivory/60 text-sm">{room?.name || '包间'}</span>
                    </div>
                    <p className="text-ivory/90 font-serif text-lg">
                      {customer?.codeName || '尊贵嘉宾'}
                    </p>
                    <p className="text-ivory/40 text-sm mt-1">
                      {consultant?.name || '待分配'}
                    </p>
                    {entry.extensionMinutes > 0 && (
                      <div className="mt-2 px-2 py-1 bg-warm-gold/10 rounded text-warm-gold text-xs">
                        已延长 {entry.extensionMinutes} 分钟
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-6">咨询师状态</h3>
            <div className="space-y-4">
              {consultants.map((consultant, index) => (
                <div
                  key={consultant.id}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-deep-space-dark/50 transition-all"
                >
                  <img
                    src={consultant.avatar}
                    alt={consultant.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-rose-gold/30"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-ivory/90 truncate">{consultant.name}</span>
                      <div className={`w-2 h-2 rounded-full ${
                        consultant.status === 'IDLE' ? 'bg-matcha' :
                        consultant.status === 'IN_SERVICE' ? 'bg-rose-gold' : 'bg-ivory/30'
                      }`} />
                    </div>
                    <p className="text-ivory/40 text-xs">
                      今日服务 {consultant.servedToday} 位
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm ${
                      consultant.status === 'IDLE' ? 'text-matcha' :
                      consultant.status === 'IN_SERVICE' ? 'text-rose-gold' : 'text-ivory/40'
                    }`}>
                      {consultant.status === 'IDLE' ? '空闲' :
                       consultant.status === 'IN_SERVICE' ? '服务中' : '离线'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-6">包间状态</h3>
            <div className="space-y-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-deep-space-dark/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      room.status === 'IDLE' ? 'bg-matcha' :
                      room.status === 'IN_USE' ? 'bg-rose-gold' :
                      room.status === 'CLEANING' ? 'bg-slate-blue' : 'bg-warm-gold'
                    } animate-pulse-soft`} />
                    <span className="text-ivory/80">{room.name}</span>
                  </div>
                  <span className={`text-xs ${
                    room.status === 'IDLE' ? 'text-matcha' :
                    room.status === 'IN_USE' ? 'text-rose-gold' :
                    room.status === 'CLEANING' ? 'text-slate-blue' : 'text-warm-gold'
                  }`}>
                    {room.status === 'IDLE' ? '空闲' :
                     room.status === 'IN_USE' ? '使用中' :
                     room.status === 'CLEANING' ? '清洁中' : '待医生'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
