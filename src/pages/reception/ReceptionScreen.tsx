import { useEffect, useState } from 'react';
import { Coffee, Clock, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store';
import { getQueueStatusText, getTeaStatusText } from '@/utils/sortEngine';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ReceptionScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { getWaitingQueue, getInServiceEntries, rooms, getCustomerById, updateWaitTimes, settings } = useAppStore();
  
  const waitingQueue = getWaitingQueue().slice(0, settings.queueDisplayCount);
  const inServiceEntries = getInServiceEntries();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      updateWaitTimes();
    }, 1000);

    return () => clearInterval(timer);
  }, [updateWaitTimes]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONSULTANT_PREPARING':
        return 'text-rose-gold';
      case 'WAITING':
        return 'text-ivory/70';
      default:
        return 'text-ivory/50';
    }
  };

  const getRoomStatusColor = (status: string) => {
    switch (status) {
      case 'IDLE':
        return 'bg-matcha';
      case 'IN_USE':
        return 'bg-rose-gold';
      case 'CLEANING':
        return 'bg-slate-blue';
      case 'DOCTOR_PENDING':
        return 'bg-warm-gold';
      default:
        return 'bg-ivory/30';
    }
  };

  const getRoomStatusText = (status: string) => {
    switch (status) {
      case 'IDLE':
        return '空闲';
      case 'IN_USE':
        return '使用中';
      case 'CLEANING':
        return '清洁中';
      case 'DOCTOR_PENDING':
        return '医生待入场';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-deep-space overflow-hidden relative">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-rose-gold/5 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col h-screen p-8">
        <header className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-rose-gold" />
            <h1 className="font-serif text-3xl font-light tracking-[0.3em] gold-text text-shadow-gold">
              臻颜医美
            </h1>
          </div>
          <p className="text-ivory/50 text-sm tracking-widest font-light">
            私享定制 · 专属服务
          </p>
        </header>

        <div className="text-center mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="text-6xl font-serif font-light text-ivory/90 tracking-wider">
            {format(currentTime, 'HH:mm')}
          </div>
          <div className="text-ivory/50 text-sm mt-2 font-light">
            {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-hidden">
          {waitingQueue.length > 0 && (
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-rose-gold to-transparent rounded-full" />
                <h2 className="font-serif text-lg text-rose-gold/90 tracking-wider">
                  等候队列
                </h2>
              </div>
              
              <div className="space-y-4 pr-2 max-h-[50vh] overflow-y-auto scrollbar-hide">
                {waitingQueue.map((entry, index) => {
                  const customer = getCustomerById(entry.customerId);
                  const statusText = getQueueStatusText(entry.status);
                  const teaText = getTeaStatusText(entry.teaStatus);
                  
                  return (
                    <div
                      key={entry.id}
                      className={`luxury-card p-5 transition-all duration-700 gradient-border ${
                        entry.status === 'CONSULTANT_PREPARING' 
                          ? 'border-rose-gold/40 shadow-luxury' 
                          : ''
                      }`}
                      style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            entry.status === 'CONSULTANT_PREPARING'
                              ? 'bg-rose-gold/20 animate-breathe'
                              : 'bg-deep-space-dark/50'
                          }`}>
                            <span className="font-serif text-xl gold-text">
                              {entry.position}
                            </span>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-serif text-xl text-ivory tracking-wider">
                                {customer?.codeName || '尊贵嘉宾'}
                              </span>
                              {customer?.level === 'BLACK_CARD' && (
                                <span className="px-2 py-0.5 bg-warm-gold/20 text-warm-gold text-xs rounded-full">
                                  黑卡
                                </span>
                              )}
                              {customer?.level === 'VIP' && (
                                <span className="px-2 py-0.5 bg-rose-gold/20 text-rose-gold text-xs rounded-full">
                                  VIP
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-2">
                              <span className={`text-sm ${getStatusColor(entry.status)} font-light`}>
                                {statusText}
                              </span>
                              {entry.status === 'CONSULTANT_PREPARING' && (
                                <span className="w-2 h-2 rounded-full bg-rose-gold animate-pulse-soft" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {teaText && (
                            <div className="flex items-center gap-1.5 text-ivory/60 text-sm">
                              <Coffee className="w-4 h-4 text-rose-gold/70" />
                              <span className="font-light">{teaText}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-ivory/40 text-xs">
                            <Clock className="w-3 h-3" />
                            <span>已等候 {entry.waitTime} 分钟</span>
                          </div>
                        </div>
                      </div>
                      
                      {entry.status === 'CONSULTANT_PREPARING' && (
                        <div className="mt-4 pt-4 border-t border-rose-gold/10">
                          <div className="flex items-center gap-2 text-rose-gold/80 text-sm">
                            <Sparkles className="w-4 h-4 animate-pulse-soft" />
                            <span className="font-light">专属顾问即将为您服务，请稍候</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {waitingQueue.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
              <Sparkles className="w-12 h-12 text-rose-gold/30 mb-4 animate-float" />
              <p className="text-ivory/40 font-light tracking-wider">
                暂无等候
              </p>
              <p className="text-ivory/30 text-sm mt-2">
                期待为您提供专属服务
              </p>
            </div>
          )}

          {inServiceEntries.length > 0 && (
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-gradient-to-b from-matcha to-transparent rounded-full" />
                <h2 className="font-serif text-lg text-ivory/80 tracking-wider">
                  正在服务
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {inServiceEntries.slice(0, 4).map((entry, index) => {
                  const customer = getCustomerById(entry.customerId);
                  const room = rooms.find(r => r.currentQueueEntryId === entry.id);
                  
                  return (
                    <div
                      key={entry.id}
                      className="luxury-card p-4 animate-fade-in"
                      style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`status-dot ${getRoomStatusColor('IN_USE')}`} />
                        <span className="text-sm text-ivory/70 font-light">
                          {room?.name || '专属包间'}
                        </span>
                      </div>
                      <div className="font-serif text-lg text-ivory/90">
                        {customer?.codeName || '尊贵嘉宾'}
                      </div>
                      <div className="text-xs text-ivory/40 mt-1 font-light">
                        {getRoomStatusText('IN_USE')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-rose-gold/10 animate-fade-in" style={{ animationDelay: '0.8s' }}>
          <div className="flex items-center justify-center gap-6 text-ivory/40 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-matcha" />
              <span>空闲</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-gold" />
              <span>使用中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-blue" />
              <span>清洁中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warm-gold" />
              <span>准备中</span>
            </div>
          </div>
        </div>

        <footer className="mt-4 text-center">
          <p className="text-ivory/30 text-xs tracking-[0.2em] font-light">
            臻颜医美 · 让美更有尊严
          </p>
        </footer>
      </div>
    </div>
  );
};

export default ReceptionScreen;
