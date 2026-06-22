import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Users, Coffee, UserCheck, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertCircle, Calendar, Clock3, User, Star, Shield
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getLevelBadge } from '@/utils/sortEngine';
import { format, addMinutes, differenceInMinutes } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const ConsultantSchedulePage = () => {
  const {
    consultants,
    getSortedQueue,
    getInServiceEntries,
    getCustomerById,
    settings,
    currentUser,
    recalculateEstimatedTimes,
    queueEntries,
  } = useAppStore();

  const [selectedConsultant, setSelectedConsultant] = useState<string>(currentUser?.role === 'CONSULTANT' && currentUser?.id ? currentUser.id : 'all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, forceUpdate] = useState(0);

  const isReception = currentUser?.role === 'ADMIN' || currentUser?.role === 'RECEPTION' || currentUser?.role === 'RECEPTIONIST';

  useEffect(() => {
    recalculateEstimatedTimes();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      forceUpdate(n => n + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [recalculateEstimatedTimes]);

  const visibleConsultants = useMemo(() => {
    if (selectedConsultant === 'all') {
      return consultants.filter(c => c.status !== 'OFFLINE');
    }
    return consultants.filter(c => c.id === selectedConsultant);
  }, [consultants, selectedConsultant]);

  const waitingQueue = useMemo(() => {
    return getSortedQueue().filter(e => e.status === 'WAITING' || e.status === 'CONSULTANT_PREPARING');
  }, [getSortedQueue]);

  const inServiceEntries = useMemo(() => {
    return getInServiceEntries();
  }, [getInServiceEntries]);

  const getConsultantSchedule = (consultantId: string) => {
    const inService = inServiceEntries.find(e => e.consultantId === consultantId);
    const waiting = waitingQueue.filter(e => 
      !e.designatedConsultantId || e.designatedConsultantId === consultantId
    );
    
    return { inService, waiting };
  };

  const timeSlots = useMemo(() => {
    const startHour = 9;
    const endHour = 21;
    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      slots.push(new Date().setHours(h, 0, 0, 0));
    }
    return slots;
  }, []);

  const getBarStyle = (entry: any, type: 'in_service' | 'waiting') => {
    const standardMinutes = settings.standardConsultationMinutes;
    const now = new Date();
    
    if (type === 'in_service') {
      const start = entry.serviceStartTime || now;
      const end = entry.estimatedEndTime || addMinutes(start, standardMinutes + (entry.extensionStatus === 'APPROVED' ? entry.extensionMinutes : 0));
      const totalDuration = differenceInMinutes(end, start);
      const elapsed = Math.max(0, differenceInMinutes(now, start));
      const progress = Math.min(100, (elapsed / totalDuration) * 100);
      
      return {
        left: `${getPositionPercent(start)}%`,
        width: `${Math.max(5, getPositionPercent(end) - getPositionPercent(start))}%`,
        progress,
      };
    } else {
      const start = entry.estimatedStartTime || now;
      const end = entry.estimatedEndTime || addMinutes(start, standardMinutes);
      
      return {
        left: `${getPositionPercent(start)}%`,
        width: `${Math.max(5, getPositionPercent(end) - getPositionPercent(start))}%`,
      };
    }
  };

  const getPositionPercent = (date: Date) => {
    const startHour = 9;
    const endHour = 21;
    const totalMinutes = (endHour - startHour) * 60;
    const minutes = date.getHours() * 60 + date.getMinutes();
    const startMinutes = startHour * 60;
    return Math.max(0, Math.min(100, ((minutes - startMinutes) / totalMinutes) * 100));
  };

  const nowPercent = getPositionPercent(currentTime);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl gold-text tracking-wider">顾问排班视图</h2>
          <p className="text-ivory/50 text-sm mt-1">
            {format(currentTime, 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-rose-gold" />
          </div>
          <select
            value={selectedConsultant}
            onChange={(e) => setSelectedConsultant(e.target.value)}
            className="luxury-input"
          >
            <option value="all">全部顾问</option>
            {consultants.filter(c => c.status !== 'OFFLINE').map(c => (
              <option key={c.id} value={c.id}>{c.name} - {c.specialties.join(', ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="luxury-card p-6 gradient-border">
        <div className="flex items-center gap-6 mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-matcha" />
            <span className="text-ivory/70 text-sm">服务中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-rose-gold/60" />
            <span className="text-ivory/70 text-sm">顾问准备中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-blue/60" />
            <span className="text-ivory/70 text-sm">候客中</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-0.5 h-4 bg-warm-gold" />
            <span className="text-ivory/70 text-sm">当前时间</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 px-2 py-1 bg-matcha/10 text-matcha text-xs rounded-full">
              <Clock3 className="w-3 h-3" />
              <span>标准时长 {settings.standardConsultationMinutes} 分钟</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center h-10 px-2 mb-2 border-b border-rose-gold/10">
            <div className="w-40 flex-shrink-0" />
            <div className="flex-1 relative h-full">
              {timeSlots.map((slot, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-ivory/40 text-xs transform -translate-x-1/2"
                  style={{ left: `${getPositionPercent(new Date(slot))}%` }}
                >
                  {format(new Date(slot), 'HH:mm')}
                </div>
              ))}
            </div>
          </div>

          <div className="relative" style={{ minHeight: `${visibleConsultants.length * 90 + 20}px` }}>
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-warm-gold/60 z-10 transition-all duration-1000"
              style={{ left: `calc(160px + ${nowPercent} * (100% - 160px) / 100%)` }}
            >
              <div className="absolute -top-1 -left-1.5 w-3 h-3 rounded-full bg-warm-gold" />
            </div>

            {timeSlots.map((slot, i) => (
              <div
                key={`line-${i}`}
                className="absolute top-0 bottom-0 w-px bg-rose-gold/5"
                style={{ left: `calc(160px + ${getPositionPercent(new Date(slot))} * (100% - 160px) / 100%)` }}
              />
            ))}

            {visibleConsultants.map((consultant, index) => {
              const schedule = getConsultantSchedule(consultant.id);
              const waitingList = schedule.waiting;
              
              return (
                <div 
                  key={consultant.id} 
                  className="flex items-start py-3 border-b border-deep-space-dark/50"
                  style={{ minHeight: '90px' }}
                >
                  <div className="w-40 flex-shrink-0 pr-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        consultant.status === 'IN_SERVICE' ? 'bg-matcha animate-pulse-soft' :
                        consultant.status === 'IDLE' ? 'bg-rose-gold' : 'bg-ivory/30'
                      }`} />
                      <p className="text-ivory/90 font-medium text-sm">{consultant.name}</p>
                    </div>
                    <p className="text-ivory/40 text-xs mt-0.5">{consultant.specialties.join(', ')}</p>
                    <p className="text-ivory/40 text-xs mt-0.5">
                      今日已服务 {consultant.servedToday} 位
                      {waitingList.length > 0 && ` · 待服务 ${waitingList.length} 位`}
                    </p>
                  </div>

                  <div className="flex-1 relative h-16">
                    {schedule.inService && (
                      <div
                        className="absolute top-0 h-8 rounded-lg overflow-hidden cursor-pointer hover:brightness-110 transition-all group"
                        style={{
                          left: `${getBarStyle(schedule.inService, 'in_service').left}%`,
                          width: `${getBarStyle(schedule.inService, 'in_service').width}%`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-matcha/80 to-matcha/60" />
                        <div 
                          className="absolute inset-y-0 left-0 bg-matcha transition-all duration-500"
                          style={{ width: `${getBarStyle(schedule.inService, 'in_service').progress}%` }}
                        />
                        <div className="relative z-10 h-full flex items-center justify-between px-3">
                          <div className="flex items-center gap-2">
                            <Coffee className="w-3.5 h-3.5 text-deep-space" />
                            <span className="text-deep-space font-medium text-xs">
                              {getCustomerById(schedule.inService.customerId)?.codeName || '尊贵嘉宾'}
                            </span>
                          </div>
                          <div className="text-deep-space/80 text-xs">
                            {format(new Date(schedule.inService.serviceStartTime!), 'HH:mm')} - 
                            {schedule.inService.estimatedEndTime && format(new Date(schedule.inService.estimatedEndTime), ' HH:mm')}
                          </div>
                        </div>

                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                          <div className="bg-deep-space-dark border border-rose-gold/30 rounded-lg p-3 whitespace-nowrap shadow-xl">
                            <p className="text-ivory/90 text-sm font-medium">
                              {getCustomerById(schedule.inService.customerId)?.codeName || '尊贵嘉宾'}
                            </p>
                            {schedule.inService.extensionMinutes > 0 && (
                              <p className="text-warm-gold text-xs mt-1">
                                已延长 {schedule.inService.extensionMinutes} 分钟
                              </p>
                            )}
                            <p className="text-ivory/50 text-xs mt-1">
                              进度 {Math.round(getBarStyle(schedule.inService, 'in_service').progress)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {waitingList.map((entry, i) => {
                      const customer = getCustomerById(entry.customerId);
                      const levelBadge = customer ? getLevelBadge(customer.level) : null;
                      const barStyle = getBarStyle(entry, 'waiting');
                      const isPreparing = entry.status === 'CONSULTANT_PREPARING';
                      const isPinned = entry.manualSortWeight && entry.manualSortWeight > 500;
                      
                      return (
                        <div
                          key={entry.id}
                          className={`absolute top-10 h-6 rounded-lg flex items-center px-3 cursor-pointer hover:brightness-110 transition-all group ${
                            isPreparing ? 'bg-rose-gold/50' : 
                            isPinned ? 'bg-matcha/40 border border-matcha/60' : 'bg-slate-blue/40'
                          }`}
                          style={{ left: `${barStyle.left}%`, width: `${barStyle.width}%` }}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            {isPreparing && <UserCheck className="w-3 h-3 text-deep-space flex-shrink-0" />}
                            {isPinned && <Star className="w-3 h-3 text-deep-space flex-shrink-0" />}
                            <span className="text-deep-space text-xs font-medium truncate">
                              {customer?.codeName || '尊贵嘉宾'}
                            </span>
                            {levelBadge && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] text-deep-space bg-white/30`}>
                                {levelBadge.text}
                              </span>
                            )}
                          </div>
                          <span className="text-deep-space/60 text-xs ml-auto flex-shrink-0">
                            {entry.estimatedStartTime && format(new Date(entry.estimatedStartTime), 'HH:mm')}
                          </span>

                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                            <div className="bg-deep-space-dark border border-rose-gold/30 rounded-lg p-3 whitespace-nowrap shadow-xl">
                              <p className="text-ivory/90 text-sm font-medium flex items-center gap-2">
                                {customer?.codeName || '尊贵嘉宾'}
                                {levelBadge && <span className={`px-1.5 py-0.5 rounded text-xs ${levelBadge.color}`}>{levelBadge.text}</span>}
                              </p>
                              <p className="text-ivory/50 text-xs mt-1">
                                预计 {entry.estimatedStartTime && format(new Date(entry.estimatedStartTime), 'HH:mm')} 开始
                              </p>
                              {entry.privacyNotes && (
                                <p className="text-rose-gold/70 text-xs mt-1 flex items-center gap-1">
                                  <Shield className="w-3 h-3" />
                                  {entry.privacyNotes}
                                </p>
                              )}
                              <p className="text-ivory/50 text-xs mt-1">
                                排队位置 #{entry.position}
                                {isPinned && ' · 已置顶'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {!schedule.inService && waitingList.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-ivory/20 text-sm">空闲中</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="luxury-card p-6 gradient-border">
          <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-4">服务进度概览</h3>
          <div className="space-y-3">
            {inServiceEntries.map(entry => {
              const customer = getCustomerById(entry.customerId);
              const consultant = entry.consultantId ? consultants.find(c => c.id === entry.consultantId) : null;
              const elapsed = entry.serviceStartTime ? differenceInMinutes(currentTime, new Date(entry.serviceStartTime)) : 0;
              const total = settings.standardConsultationMinutes + (entry.extensionStatus === 'APPROVED' ? entry.extensionMinutes : 0);
              const progress = Math.min(100, (elapsed / total) * 100);
              const isOvertime = elapsed > total && entry.extensionStatus !== 'PENDING';
              
              return (
                <div key={entry.id} className="p-4 bg-deep-space-dark/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-ivory/90 font-medium">{customer?.codeName || '尊贵嘉宾'}</span>
                      <span className="text-ivory/40 text-xs">→ {consultant?.name}</span>
                    </div>
                    <span className={`text-xs ${isOvertime ? 'text-rose-red' : 'text-matcha'}`}>
                      {isOvertime ? `已超时 ${elapsed - total} 分钟` : `${Math.round(progress)}%`}
                    </span>
                  </div>
                  <div className="h-1.5 bg-deep-space-dark/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOvertime ? 'bg-rose-red' : 'bg-gradient-to-r from-rose-gold to-warm-gold'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {entry.extensionMinutes > 0 && (
                    <p className="text-warm-gold/70 text-xs mt-2">
                      已延长 {entry.extensionMinutes} 分钟
                    </p>
                  )}
                </div>
              );
            })}
            {inServiceEntries.length === 0 && (
              <div className="text-center py-8 text-ivory/40 text-sm">
                暂无进行中的服务
              </div>
            )}
          </div>
        </div>

        <div className="luxury-card p-6 gradient-border">
          <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-4">待服务队列</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
            {waitingQueue.map((entry, index) => {
              const customer = getCustomerById(entry.customerId);
              const consultant = entry.consultantId ? consultants.find(c => c.id === entry.consultantId) : null;
              const levelBadge = customer ? getLevelBadge(customer.level) : null;
              const isPinned = entry.manualSortWeight && entry.manualSortWeight > 500;
              
              return (
                <div key={entry.id} className="p-3 bg-deep-space-dark/30 rounded-lg flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    entry.status === 'CONSULTANT_PREPARING' ? 'bg-rose-gold/30' :
                    isPinned ? 'bg-matcha/20' : 'bg-deep-space-dark/50'
                  }`}>
                    <span className="font-serif text-sm gold-text">{entry.position}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-ivory/90 text-sm font-medium truncate">
                        {customer?.codeName || '尊贵嘉宾'}
                      </span>
                      {levelBadge && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${levelBadge.color}`}>
                          {levelBadge.text}
                        </span>
                      )}
                      {isPinned && (
                        <span className="px-1.5 py-0.5 bg-matcha/20 text-matcha text-[10px] rounded">
                          置顶
                        </span>
                      )}
                    </div>
                    <p className="text-ivory/40 text-xs mt-0.5 truncate">
                      {consultant ? `→ ${consultant.name}` : '待分配顾问'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-ivory/60 text-xs">
                      预计 {entry.estimatedStartTime && format(new Date(entry.estimatedStartTime), 'HH:mm')}
                    </p>
                    <p className="text-ivory/30 text-xs mt-0.5">
                      已等 {entry.waitTime} 分钟
                    </p>
                  </div>
                </div>
              );
            })}
            {waitingQueue.length === 0 && (
              <div className="text-center py-8 text-ivory/40 text-sm">
                暂无待服务顾客
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantSchedulePage;
