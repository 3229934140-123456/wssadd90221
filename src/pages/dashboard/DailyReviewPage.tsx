import { useState, useMemo } from 'react';
import { 
  Users, Clock, Shield, CheckCircle2, Coffee, UserCheck, ArrowLeft,
  Filter, Calendar, ChevronDown, Info, Clock3, CheckCircle, XCircle, Gift, Headphones, Pin, Star
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getLevelBadge } from '@/utils/sortEngine';
import { format, differenceInMinutes } from 'date-fns';
import type { CustomerLevel } from '@/types';

const DailyReviewPage = () => {
  const {
    getCustomerById,
    getConsultantById,
    getRoomById,
    queueEntries,
    consultants,
    rooms,
    getTimelineForEntry,
    serviceRecords,
    currentUser,
  } = useAppStore();

  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    consultantId: 'all',
    roomId: 'all',
    level: 'all' as CustomerLevel | 'all',
    status: 'all' as 'all' | 'WAITING' | 'IN_SERVICE' | 'COMPLETED' | 'CONSULTANT_PREPARING',
  });

  const todayEntries = useMemo(() => {
    return queueEntries.filter(e => {
      const today = new Date();
      const entryDate = new Date(e.checkinTime);
      return entryDate.toDateString() === today.toDateString();
    });
  }, [queueEntries]);

  const filteredEntries = useMemo(() => {
    return todayEntries.filter(entry => {
      if (filters.consultantId !== 'all' && entry.consultantId !== filters.consultantId) return false;
      if (filters.roomId !== 'all' && entry.roomId !== filters.roomId) return false;
      const customer = getCustomerById(entry.customerId);
      if (filters.level !== 'all' && customer?.level !== filters.level) return false;
      if (filters.status !== 'all' && entry.status !== filters.status) return false;
      return true;
    });
  }, [todayEntries, filters, getCustomerById]);

  const getTimelineDisplay = (type: string) => {
    const map: Record<string, { icon: React.ReactNode; color: string }> = {
      CHECKIN: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-matcha/20 text-matcha' },
      VIEW_DETAILS: { icon: <Info className="w-3 h-3" />, color: 'bg-deep-space-dark/50 text-ivory/60' },
      CONFIRM_CHECKIN: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-matcha/20 text-matcha' },
      CONSULTANT_PREPARE: { icon: <UserCheck className="w-3 h-3" />, color: 'bg-rose-gold/20 text-rose-gold' },
      START_SERVICE: { icon: <Coffee className="w-3 h-3" />, color: 'bg-matcha/20 text-matcha' },
      EXTENSION_REQUEST: { icon: <Clock className="w-3 h-3" />, color: 'bg-warm-gold/20 text-warm-gold' },
      EXTENSION_APPROVED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-matcha/20 text-matcha' },
      EXTENSION_REJECTED: { icon: <XCircle className="w-3 h-3" />, color: 'bg-rose-red/20 text-rose-red' },
      TEA_DELIVERED: { icon: <Coffee className="w-3 h-3" />, color: 'bg-deep-space-dark/50 text-ivory/60' },
      SILENT_CALLED: { icon: <Headphones className="w-3 h-3" />, color: 'bg-deep-space-dark/50 text-ivory/60' },
      QUEUE_ADJUSTED: { icon: <Pin className="w-3 h-3" />, color: 'bg-slate-blue/20 text-slate-blue' },
      COMPLETE_SERVICE: { icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-matcha/20 text-matcha' },
      SOOTHE_SERVICE: { icon: <Gift className="w-3 h-3" />, color: 'bg-warm-gold/20 text-warm-gold' },
    };
    return map[type] || { icon: <Clock className="w-3 h-3" />, color: 'bg-deep-space-dark/50 text-ivory/60' };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'WAITING':
        return <span className="px-2 py-0.5 bg-slate-blue/20 text-slate-blue text-xs rounded-full">等待中</span>;
      case 'CONSULTANT_PREPARING':
        return <span className="px-2 py-0.5 bg-rose-gold/20 text-rose-gold text-xs rounded-full">顾问准备中</span>;
      case 'IN_SERVICE':
        return <span className="px-2 py-0.5 bg-matcha/20 text-matcha text-xs rounded-full">服务中</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 bg-warm-gold/20 text-warm-gold text-xs rounded-full">已完成</span>;
      default:
        return null;
    }
  };

  const getExtensionStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-warm-gold/20 text-warm-gold text-xs rounded-full"><Clock3 className="w-3 h-3" />待处理</span>;
      case 'APPROVED':
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-matcha/20 text-matcha text-xs rounded-full"><CheckCircle className="w-3 h-3" />已同意</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-red/20 text-rose-red text-xs rounded-full"><XCircle className="w-3 h-3" />已驳回</span>;
      default:
        return null;
    }
  };

  const getRecordForEntry = (entryId: string) => {
    return serviceRecords.find(r => r.queueEntryId === entryId);
  };

  const stats = useMemo(() => {
    const completed = todayEntries.filter(e => e.status === 'COMPLETED').length;
    const inService = todayEntries.filter(e => e.status === 'IN_SERVICE').length;
    const waiting = todayEntries.filter(e => e.status === 'WAITING' || e.status === 'CONSULTANT_PREPARING').length;
    const total = todayEntries.length;
    const extensions = todayEntries.filter(e => e.extensionStatus === 'APPROVED').length;
    const avgDuration = completed > 0 
      ? Math.round(todayEntries
        .filter(e => e.status === 'COMPLETED' && e.serviceStartTime && e.timeline)
        .reduce((sum, e) => {
          const completeEvent = e.timeline?.find(t => t.type === 'COMPLETE_SERVICE');
          if (!completeEvent || !e.serviceStartTime) return sum;
          return sum + differenceInMinutes(new Date(completeEvent.timestamp), new Date(e.serviceStartTime));
        }, 0) / completed)
      : 0;
    return { completed, inService, waiting, total, extensions, avgDuration };
  }, [todayEntries]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-serif text-2xl gold-text tracking-wider">今日接待复盘</h2>
          <p className="text-ivory/50 text-sm mt-1">
            {format(new Date(), 'yyyy年MM月dd日')} · 共接待 {stats.total} 位顾客
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-rose-gold" />
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="luxury-card p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-blue/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-blue" />
            </div>
            <div>
              <p className="text-ivory/40 text-xs">总接待</p>
              <p className="font-serif text-2xl text-ivory/90">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="luxury-card p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-matcha/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-matcha" />
            </div>
            <div>
              <p className="text-ivory/40 text-xs">已完成</p>
              <p className="font-serif text-2xl text-ivory/90">{stats.completed}</p>
            </div>
          </div>
        </div>
        <div className="luxury-card p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-gold/20 flex items-center justify-center">
              <Coffee className="w-5 h-5 text-rose-gold" />
            </div>
            <div>
              <p className="text-ivory/40 text-xs">服务中</p>
              <p className="font-serif text-2xl text-ivory/90">{stats.inService}</p>
            </div>
          </div>
        </div>
        <div className="luxury-card p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warm-gold/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warm-gold" />
            </div>
            <div>
              <p className="text-ivory/40 text-xs">延长次数</p>
              <p className="font-serif text-2xl text-ivory/90">{stats.extensions}</p>
            </div>
          </div>
        </div>
        <div className="luxury-card p-4 gradient-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-blue/20 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-slate-blue" />
            </div>
            <div>
              <p className="text-ivory/40 text-xs">平均时长</p>
              <p className="font-serif text-2xl text-ivory/90">{stats.avgDuration || '--'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="luxury-card p-6 gradient-border">
        <div className="flex items-center gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ivory/60" />
            <span className="text-ivory/70 text-sm">筛选：</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-ivory/50 text-sm">顾问</label>
            <select
              value={filters.consultantId}
              onChange={(e) => setFilters({ ...filters, consultantId: e.target.value })}
              className="luxury-input !py-1.5 !text-sm"
            >
              <option value="all">全部顾问</option>
              {consultants.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-ivory/50 text-sm">包间</label>
            <select
              value={filters.roomId}
              onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
              className="luxury-input !py-1.5 !text-sm"
            >
              <option value="all">全部包间</option>
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-ivory/50 text-sm">等级</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value as CustomerLevel | 'all' })}
              className="luxury-input !py-1.5 !text-sm"
            >
              <option value="all">全部等级</option>
              <option value="BLACK_CARD">黑卡</option>
              <option value="VIP">VIP</option>
              <option value="NORMAL">普通</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-ivory/50 text-sm">状态</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="luxury-input !py-1.5 !text-sm"
            >
              <option value="all">全部状态</option>
              <option value="WAITING">等待中</option>
              <option value="CONSULTANT_PREPARING">顾问准备中</option>
              <option value="IN_SERVICE">服务中</option>
              <option value="COMPLETED">已完成</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 max-h-[650px] overflow-y-auto scrollbar-hide pr-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-16 text-ivory/40">
              暂无符合条件的接待记录
            </div>
          ) : (
            filteredEntries.sort((a, b) => b.checkinTime.getTime() - a.checkinTime.getTime()).map((entry) => {
              const customer = getCustomerById(entry.customerId);
              const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
              const room = entry.roomId ? getRoomById(entry.roomId) : null;
              const levelBadge = customer ? getLevelBadge(customer.level) : null;
              const record = getRecordForEntry(entry.id);
              const timeline = getTimelineForEntry(entry.id);
              const isExpanded = selectedEntry === entry.id;

              return (
                <div
                  key={entry.id}
                  className="rounded-xl overflow-hidden bg-deep-space-dark/30 border border-transparent hover:border-rose-gold/10 transition-all duration-300"
                >
                  <div
                    onClick={() => setSelectedEntry(isExpanded ? null : entry.id)}
                    className="p-4 cursor-pointer hover:bg-deep-space-dark/50 transition-colors"
                  >
                    <div className="grid grid-cols-6 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-lg gold-text w-8">
                          {format(new Date(entry.checkinTime), 'HH:mm')}
                        </span>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-ivory/90 font-medium">
                              {customer?.codeName || '尊贵嘉宾'}
                            </span>
                            {levelBadge && (
                              <span className={`px-2 py-0.5 rounded-full text-xs ${levelBadge.color}`}>
                                {levelBadge.text}
                              </span>
                            )}
                            {entry.isStandby && (
                              <span className="px-2 py-0.5 bg-slate-blue/20 text-slate-blue text-xs rounded-full">
                                候补
                              </span>
                            )}
                          </div>
                          <p className="text-ivory/40 text-xs mt-0.5">
                            {customer?.id || entry.customerId}
                          </p>
                        </div>
                      </div>

                      <div className="text-ivory/70 text-sm">
                        {consultant?.name || '待分配'}
                      </div>

                      <div className="text-ivory/70 text-sm">
                        {room?.name || '待分配'}
                      </div>

                      <div className="text-ivory/70 text-sm">
                        {customer?.isSensitive ? '***' : entry.project || '未指定'}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(entry.status)}
                        {entry.extensionStatus && getExtensionStatusBadge(entry.extensionStatus)}
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <span className="text-ivory/40 text-xs">
                          {timeline.length} 个节点
                        </span>
                        <ChevronDown className={`w-4 h-4 text-ivory/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-rose-gold/10 pt-4 animate-fade-in">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-ivory/70 text-sm mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            完整接待时间线
                          </h4>
                          <div className="space-y-3 pl-4 border-l-2 border-rose-gold/20">
                            {timeline.map((event) => {
                              const display = getTimelineDisplay(event.type);
                              return (
                                <div key={event.id} className="relative">
                                  <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-deep-space-dark bg-rose-gold flex items-center justify-center">
                                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${display.color}`}>
                                      {display.icon}
                                    </div>
                                  </div>
                                  <div className="bg-deep-space-dark/30 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <p className="text-ivory/90 text-sm font-medium">{event.description}</p>
                                      <p className="text-ivory/40 text-xs">{format(new Date(event.timestamp), 'HH:mm:ss')}</p>
                                    </div>
                                    {event.operator && (
                                      <p className="text-ivory/50 text-xs">操作人：{event.operator}</p>
                                    )}
                                    {event.details && (
                                      <p className="text-ivory/60 text-xs mt-1">{event.details}</p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {entry.privacyNotes && (
                            <div className="p-4 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                              <h5 className="text-rose-gold text-sm mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                隐私交接备注
                              </h5>
                              <p className="text-ivory/70 text-sm">{entry.privacyNotes}</p>
                            </div>
                          )}

                          {entry.extensionMinutes > 0 && (
                            <div className="p-4 bg-deep-space-dark/30 rounded-lg">
                              <h5 className="text-ivory/70 text-sm mb-2 flex items-center gap-2">
                                <Clock3 className="w-4 h-4" />
                                延长申请信息
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-ivory/50">延长时间：</span>
                                  <span className="text-ivory/80">{entry.extensionMinutes} 分钟</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-ivory/50">延长原因：</span>
                                  <span className="text-ivory/80">{entry.extensionReason || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-ivory/50">处理状态：</span>
                                  <span className="text-ivory/80">
                                    {entry.extensionStatus === 'APPROVED' ? '已同意' : 
                                     entry.extensionStatus === 'REJECTED' ? '已驳回' : 
                                     entry.extensionStatus === 'PENDING' ? '待处理' : '-'}
                                  </span>
                                </div>
                                {entry.extensionHandledBy && (
                                  <div className="flex justify-between">
                                    <span className="text-ivory/50">处理人：</span>
                                    <span className="text-ivory/80">{entry.extensionHandledBy}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {record && (
                            <div className="p-4 bg-matcha/5 border border-matcha/20 rounded-lg">
                              <h5 className="text-matcha text-sm mb-2 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                服务记录
                              </h5>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-ivory/50">体验评分：</span>
                                  <span className="text-warm-gold">
                                    {'★'.repeat(record.experienceRating)}{'☆'.repeat(5 - record.experienceRating)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-ivory/50">实际时长：</span>
                                  <span className="text-ivory/80">{record.actualDuration} 分钟</span>
                                </div>
                                {record.compensation.length > 0 && (
                                  <div className="flex justify-between">
                                    <span className="text-ivory/50">等待补偿：</span>
                                    <span className="text-ivory/80">{record.compensation.join('、')}</span>
                                  </div>
                                )}
                                {record.notes && (
                                  <p className="text-ivory/60 mt-2">备注：{record.notes}</p>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                              <p className="text-ivory/40 text-xs mb-1">签到时间</p>
                              <p className="text-ivory/80 text-sm">{format(new Date(entry.checkinTime), 'HH:mm:ss')}</p>
                            </div>
                            {entry.serviceStartTime && (
                              <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                                <p className="text-ivory/40 text-xs mb-1">服务开始</p>
                                <p className="text-ivory/80 text-sm">{format(new Date(entry.serviceStartTime), 'HH:mm:ss')}</p>
                              </div>
                            )}
                            {entry.estimatedEndTime && (
                              <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                                <p className="text-ivory/40 text-xs mb-1">预计结束</p>
                                <p className="text-ivory/80 text-sm">{format(new Date(entry.estimatedEndTime), 'HH:mm:ss')}</p>
                              </div>
                            )}
                            {record && (
                              <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                                <p className="text-ivory/40 text-xs mb-1">完成时间</p>
                                <p className="text-ivory/80 text-sm">{format(new Date(record.createdAt), 'HH:mm:ss')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedEntry && (
        <button
          onClick={() => setSelectedEntry(null)}
          className="fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 bg-deep-space-dark/90 backdrop-blur-md border border-rose-gold/30 rounded-xl text-rose-gold hover:bg-deep-space-dark transition-colors shadow-rose-gold/20 z-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>收起详情</span>
        </button>
      )}
    </div>
  );
};

export default DailyReviewPage;
