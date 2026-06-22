import { useState, useEffect } from 'react';
import { 
  Phone, Headphones, Coffee, Clock, AlertTriangle, 
  UserCheck, Gift, X, Pin, ArrowDown, CheckCircle2, XCircle, Clock3, AlertCircle, User,
  Calendar, Shield, ChevronRight, Timer, Users, Info
} from 'lucide-react';
import { useAppStore } from '@/store';
import { getLevelBadge } from '@/utils/sortEngine';
import { format, differenceInMinutes } from 'date-fns';
import type { TeaStatus, TimelineEventType } from '@/types';

const QueueManagement = () => {
  const {
    getSortedQueue,
    getInServiceEntries,
    getCustomerById,
    getConsultantById,
    getRoomById,
    updateQueueStatus,
    updateTeaStatus,
    triggerSilentCall,
    requestExtension,
    updateWaitTimes,
    addNotification,
    settings,
    adjustQueuePosition,
    currentUser,
    recalculateEstimatedTimes,
  } = useAppStore();

  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionMinutes, setExtensionMinutes] = useState(15);
  const [extensionReason, setExtensionReason] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<'TOP' | 'BACK'>('TOP');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustEntryId, setAdjustEntryId] = useState('');
  const [, forceUpdate] = useState(0);

  const isReception = currentUser?.role === 'ADMIN' || currentUser?.role === 'RECEPTION' || currentUser?.role === 'RECEPTIONIST';

  const waitingQueue = getSortedQueue().filter(e => e.status === 'WAITING' || e.status === 'CONSULTANT_PREPARING');
  const inServiceEntries = getInServiceEntries();

  useEffect(() => {
    recalculateEstimatedTimes();
    const timer = setInterval(() => {
      updateWaitTimes();
      forceUpdate(n => n + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, [updateWaitTimes, recalculateEstimatedTimes]);

  const openAdjustModal = (entryId: string, type: 'TOP' | 'BACK') => {
    setAdjustEntryId(entryId);
    setAdjustType(type);
    setAdjustReason('');
    setShowAdjustModal(true);
  };

  const handleAdjustConfirm = () => {
    if (adjustEntryId && adjustReason) {
      adjustQueuePosition(adjustEntryId, adjustType, adjustReason);
      setShowAdjustModal(false);
      setAdjustEntryId('');
      setAdjustReason('');
    }
  };

  const handleTriggerSilentCall = (entryId: string) => {
    triggerSilentCall(entryId);
  };

  const handlePrepareConsultant = (entryId: string) => {
    updateQueueStatus(entryId, 'CONSULTANT_PREPARING');
    const entry = waitingQueue.find(e => e.id === entryId);
    const customer = entry ? getCustomerById(entry.customerId) : null;
    addNotification({
      type: 'INFO',
      message: `「${customer?.codeName || '贵宾'}」顾问已开始准备`,
      relatedQueueEntryId: entryId,
    });
  };

  const handleStartService = (entryId: string) => {
    updateQueueStatus(entryId, 'IN_SERVICE');
    const entry = waitingQueue.find(e => e.id === entryId);
    const customer = entry ? getCustomerById(entry.customerId) : null;
    addNotification({
      type: 'SUCCESS',
      message: `「${customer?.codeName || '贵宾'}」已进入服务`,
      relatedQueueEntryId: entryId,
    });
  };

  const handleTeaStatusUpdate = (entryId: string, status: TeaStatus) => {
    updateTeaStatus(entryId, status);
  };

  const handleComfortService = (entryId: string) => {
    const entry = waitingQueue.find(e => e.id === entryId);
    const customer = entry ? getCustomerById(entry.customerId) : null;
    addNotification({
      type: 'WARNING',
      message: `「${customer?.codeName || '贵宾'}」等待超时，请送上安抚服务`,
      relatedQueueEntryId: entryId,
    });
  };

  const handleRequestExtension = () => {
    if (selectedEntry && extensionMinutes > 0 && extensionReason) {
      requestExtension(selectedEntry, extensionMinutes, extensionReason);
      setShowExtensionModal(false);
      setExtensionMinutes(15);
      setExtensionReason('');
      setSelectedEntry(null);
    }
  };

  const getReminderIcon = (method: string) => {
    switch (method) {
      case 'SMS': return <Phone className="w-4 h-4" />;
      case 'HEADSET': return <Headphones className="w-4 h-4" />;
      default: return null;
    }
  };

  const getExtensionStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-warm-gold/20 text-warm-gold text-xs rounded-full">
            <Clock3 className="w-3 h-3" />
            待处理
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-matcha/20 text-matcha text-xs rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            已同意
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-red/20 text-rose-red text-xs rounded-full">
            <XCircle className="w-3 h-3" />
            已驳回
          </span>
        );
      default:
        return null;
    }
  };

  const getTimelineIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'CHECKIN': return <UserCheck className="w-3 h-3" />;
      case 'VIEW_DETAILS': return <Info className="w-3 h-3" />;
      case 'CONFIRM_CHECKIN': return <CheckCircle2 className="w-3 h-3" />;
      case 'CONSULTANT_PREPARE': return <User className="w-3 h-3" />;
      case 'START_SERVICE': return <Coffee className="w-3 h-3" />;
      case 'EXTENSION_REQUEST': return <Clock className="w-3 h-3" />;
      case 'EXTENSION_APPROVED': return <CheckCircle2 className="w-3 h-3" />;
      case 'EXTENSION_REJECTED': return <XCircle className="w-3 h-3" />;
      case 'TEA_DELIVERED': return <Coffee className="w-3 h-3" />;
      case 'SILENT_CALLED': return <Headphones className="w-3 h-3" />;
      case 'QUEUE_ADJUSTED': return <ArrowDown className="w-3 h-3" />;
      case 'COMPLETE_SERVICE': return <CheckCircle2 className="w-3 h-3" />;
      case 'SOOTHE_SERVICE': return <Gift className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getTimelineColor = (type: TimelineEventType) => {
    switch (type) {
      case 'CHECKIN':
      case 'CONFIRM_CHECKIN':
      case 'START_SERVICE':
      case 'COMPLETE_SERVICE':
        return 'bg-matcha/20 text-matcha border-matcha/30';
      case 'CONSULTANT_PREPARE':
        return 'bg-rose-gold/20 text-rose-gold border-rose-gold/30';
      case 'EXTENSION_REQUEST':
        return 'bg-warm-gold/20 text-warm-gold border-warm-gold/30';
      case 'EXTENSION_APPROVED':
        return 'bg-matcha/20 text-matcha border-matcha/30';
      case 'EXTENSION_REJECTED':
        return 'bg-rose-red/20 text-rose-red border-rose-red/30';
      case 'QUEUE_ADJUSTED':
        return 'bg-slate-blue/20 text-slate-blue border-slate-blue/30';
      case 'SOOTHE_SERVICE':
        return 'bg-warm-gold/20 text-warm-gold border-warm-gold/30';
      default:
        return 'bg-deep-space-dark/50 text-ivory/60 border-ivory/10';
    }
  };

  const getServiceTimeInfo = (entry: any) => {
    const now = new Date();
    const standardMinutes = settings.standardConsultationMinutes;
    
    if (!entry.serviceStartTime) {
      return {
        statusText: '等待服务开始',
        statusColor: 'text-ivory/40',
        estimatedEnd: null,
        isOverTime: false,
        overMinutes: 0,
        progress: 0,
      };
    }

    const start = new Date(entry.serviceStartTime);
    const totalScheduledMinutes = standardMinutes + (entry.extensionStatus === 'APPROVED' ? entry.extensionMinutes : 0);
    const elapsedMinutes = differenceInMinutes(now, start);
    const progress = Math.min(100, (elapsedMinutes / totalScheduledMinutes) * 100);
    
    let estimatedEnd: Date | null = null;
    if (entry.estimatedEndTime) {
      estimatedEnd = new Date(entry.estimatedEndTime);
    } else {
      estimatedEnd = new Date(start.getTime() + totalScheduledMinutes * 60000);
    }
    
    const isOverTime = elapsedMinutes > totalScheduledMinutes && entry.extensionStatus !== 'PENDING';
    const overMinutes = isOverTime ? elapsedMinutes - totalScheduledMinutes : 0;

    return {
      statusText: isOverTime ? `已超时 ${overMinutes} 分钟` : '服务中',
      statusColor: isOverTime ? 'text-rose-red' : 'text-matcha',
      estimatedEnd,
      isOverTime,
      overMinutes,
      progress,
    };
  };

  const getNextWaitingForConsultant = (consultantId: string) => {
    return waitingQueue.find(e => 
      !e.designatedConsultantId || e.designatedConsultantId === consultantId
    ) || null;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 gap-8">
        <div className="luxury-card p-6 gradient-border animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider">等候队列</h3>
            <span className="text-ivory/40 text-sm">共 {waitingQueue.length} 位</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto scrollbar-hide pr-2">
            {waitingQueue.length === 0 ? (
              <div className="text-center py-16 text-ivory/40">
                暂无等候顾客
              </div>
            ) : (
              waitingQueue.map((entry, index) => {
                const customer = getCustomerById(entry.customerId);
                const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
                const room = entry.roomId ? getRoomById(entry.roomId) : null;
                const levelBadge = customer ? getLevelBadge(customer.level) : null;
                const isOverTime = entry.waitTime >= settings.maxWaitTime;
                const isExpanded = selectedEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      entry.status === 'CONSULTANT_PREPARING'
                        ? 'bg-rose-gold/10 border border-rose-gold/30'
                        : 'bg-deep-space-dark/50 border border-transparent'
                    } ${isOverTime ? 'ring-2 ring-warm-gold/50' : ''} ${
                      entry.manualSortWeight && entry.manualSortWeight > 500 ? 'ring-1 ring-matcha/30' : ''
                    }`}
                  >
                    <div
                      onClick={() => setSelectedEntry(isExpanded ? null : entry.id)}
                      className="p-4 cursor-pointer hover:bg-deep-space-dark/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            entry.status === 'CONSULTANT_PREPARING'
                              ? 'bg-rose-gold/30'
                              : entry.manualSortWeight && entry.manualSortWeight > 500
                              ? 'bg-matcha/20'
                              : 'bg-deep-space-dark/50'
                          }`}>
                            <span className="font-serif text-lg gold-text">{entry.position}</span>
                          </div>
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
                              {entry.manualSortWeight && entry.manualSortWeight > 500 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-matcha/20 text-matcha text-xs rounded-full">
                                  <Pin className="w-3 h-3" />
                                  已置顶
                                </span>
                              )}
                              {isOverTime && (
                                <span className="flex items-center gap-1 text-warm-gold text-xs">
                                  <AlertTriangle className="w-3 h-3" />
                                  等待超时
                                </span>
                              )}
                            </div>
                            <p className="text-ivory/40 text-sm mt-1">
                              {consultant ? `${consultant.name}` : '待分配顾问'} · {room?.name || '待分配包间'}
                            </p>
                            {entry.manualAdjustment && (
                              <p className="text-matcha/70 text-xs mt-1 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {entry.manualAdjustment.adjustedBy} 于 {format(entry.manualAdjustment.adjustedAt, 'HH:mm')} {entry.manualAdjustment.type === 'TOP' ? '置顶' : '延后'}：{entry.manualAdjustment.reason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-sm ${isOverTime ? 'text-warm-gold' : 'text-ivory/60'}`}>
                              已等候 {entry.waitTime} 分钟
                            </p>
                            <p className="text-ivory/40 text-xs mt-1">
                              {format(entry.checkinTime, 'HH:mm')} 签到
                            </p>
                            {entry.estimatedStartTime && (
                              <p className="text-matcha/60 text-xs mt-0.5">
                                预计 {format(new Date(entry.estimatedStartTime), 'HH:mm')} 开始
                              </p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs ${
                            entry.status === 'CONSULTANT_PREPARING'
                              ? 'bg-rose-gold/20 text-rose-gold'
                              : 'bg-ivory/10 text-ivory/60'
                          }`}>
                            {entry.status === 'CONSULTANT_PREPARING' ? '顾问准备中' : '等待中'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-rose-gold/10 pt-4 animate-fade-in">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                            <div className="flex items-center gap-2 text-ivory/40 text-xs mb-1">
                              <Coffee className="w-3 h-3" />
                              <span>茶点状态</span>
                            </div>
                            <select
                              value={entry.teaStatus}
                              onChange={(e) => handleTeaStatusUpdate(entry.id, e.target.value as TeaStatus)}
                              className="w-full bg-transparent text-ivory/80 text-sm focus:outline-none"
                            >
                              <option value="NOT_PREPARED">未准备</option>
                              <option value="PREPARING">准备中</option>
                              <option value="DELIVERED">已送达</option>
                            </select>
                          </div>
                          <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                            <div className="flex items-center gap-2 text-ivory/40 text-xs mb-1">
                              <Clock className="w-3 h-3" />
                              <span>提醒方式</span>
                            </div>
                            <div className="flex items-center gap-2 text-ivory/80 text-sm">
                              {getReminderIcon(entry.reminderMethod)}
                              <span>
                                {entry.reminderMethod === 'SMS' ? '短信' : 
                                 entry.reminderMethod === 'HEADSET' ? '耳机' : '不提醒'}
                              </span>
                            </div>
                          </div>
                          <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                            <div className="text-ivory/40 text-xs mb-1">项目</div>
                            <p className="text-ivory/80 text-sm truncate">
                              {customer?.isSensitive ? '***' : entry.project || '未指定'}
                            </p>
                          </div>
                        </div>

                        {entry.privacyNotes && (
                          <div className="mb-4 p-3 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                            <div className="flex items-center gap-2 text-rose-gold text-xs mb-2">
                              <Shield className="w-3 h-3" />
                              <span>隐私交接备注</span>
                            </div>
                            <p className="text-ivory/70 text-sm">{entry.privacyNotes}</p>
                          </div>
                        )}

                        {isReception && (
                          <div className="mb-4 p-3 bg-deep-space-dark/30 rounded-lg">
                            <p className="text-ivory/40 text-xs mb-2 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              手动调整队列顺序
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); openAdjustModal(entry.id, 'TOP'); }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-matcha/10 text-matcha hover:bg-matcha/20 transition-colors text-sm"
                              >
                                <Pin className="w-4 h-4" />
                                <span>置顶</span>
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); openAdjustModal(entry.id, 'BACK'); }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-blue/10 text-slate-blue hover:bg-slate-blue/20 transition-colors text-sm"
                              >
                                <ArrowDown className="w-4 h-4" />
                                <span>延后</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {entry.timeline && entry.timeline.length > 0 && (
                          <div className="mb-4 p-3 bg-deep-space-dark/30 rounded-lg">
                            <p className="text-ivory/40 text-xs mb-3 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              今日接待时间线
                            </p>
                            <div className="space-y-2">
                              {entry.timeline.slice().reverse().map((event: any) => (
                                <div key={event.id} className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getTimelineColor(event.type)}`}>
                                    {getTimelineIcon(event.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-ivory/80 text-sm">{event.description}</p>
                                      <p className="text-ivory/40 text-xs">{format(new Date(event.timestamp), 'HH:mm')}</p>
                                    </div>
                                    {event.operator && (
                                      <p className="text-ivory/40 text-xs mt-0.5">操作人：{event.operator}</p>
                                    )}
                                    {event.details && (
                                      <p className="text-ivory/50 text-xs mt-0.5 truncate">{event.details}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="w-px h-6 bg-rose-gold/20" />
                          {entry.status !== 'CONSULTANT_PREPARING' && isReception && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePrepareConsultant(entry.id); }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 transition-colors text-sm"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>顾问准备</span>
                            </button>
                          )}
                          {isReception && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleTriggerSilentCall(entry.id); }}
                              disabled={entry.isSilentCalled}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                                entry.isSilentCalled
                                  ? 'bg-matcha/10 text-matcha cursor-not-allowed'
                                  : 'bg-slate-blue/10 text-slate-blue hover:bg-slate-blue/20'
                              }`}
                            >
                              {entry.reminderMethod === 'SMS' ? <Phone className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                              <span>{entry.isSilentCalled ? '已提醒' : '静默提醒'}</span>
                            </button>
                          )}
                          {isOverTime && isReception && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleComfortService(entry.id); }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warm-gold/10 text-warm-gold hover:bg-warm-gold/20 transition-colors text-sm animate-pulse-soft"
                            >
                              <Gift className="w-4 h-4" />
                              <span>安抚服务</span>
                            </button>
                          )}
                          {entry.status === 'CONSULTANT_PREPARING' && isReception && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleStartService(entry.id); }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-matcha/10 text-matcha hover:bg-matcha/20 transition-colors text-sm ml-auto"
                            >
                              <UserCheck className="w-4 h-4" />
                              <span>开始服务</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider">服务中</h3>
            <span className="text-ivory/40 text-sm">共 {inServiceEntries.length} 位</span>
          </div>

          <div className="space-y-4 max-h-[700px] overflow-y-auto scrollbar-hide pr-2">
            {inServiceEntries.length === 0 ? (
              <div className="text-center py-16 text-ivory/40">
                暂无进行中的服务
              </div>
            ) : (
              inServiceEntries.map((entry, index) => {
                const customer = getCustomerById(entry.customerId);
                const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
                const room = entry.roomId ? getRoomById(entry.roomId) : null;
                const levelBadge = customer ? getLevelBadge(customer.level) : null;
                const timeInfo = getServiceTimeInfo(entry);
                const nextEntry = entry.consultantId ? getNextWaitingForConsultant(entry.consultantId) : null;
                const nextCustomer = nextEntry ? getCustomerById(nextEntry.customerId) : null;
                const isExpanded = selectedEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`rounded-xl overflow-hidden transition-all duration-300 ${
                      timeInfo.isOverTime ? 'ring-2 ring-rose-red/50' : ''
                    }`}
                  >
                    <div
                      onClick={() => setSelectedEntry(isExpanded ? null : entry.id)}
                      className="p-5 bg-deep-space-dark/50 border border-rose-gold/10 cursor-pointer hover:bg-deep-space-dark/30 transition-colors animate-slide-up"
                      style={{ animationDelay: `${0.1 * index}s` }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-matcha animate-pulse-soft" />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-ivory/90 font-serif text-lg">
                                {customer?.codeName || '尊贵嘉宾'}
                              </span>
                              {levelBadge && (
                                <span className={`px-2 py-0.5 rounded-full text-xs ${levelBadge.color}`}>
                                  {levelBadge.text}
                                </span>
                              )}
                              {entry.extensionStatus && getExtensionStatusBadge(entry.extensionStatus)}
                            </div>
                            <p className="text-ivory/40 text-sm mt-1">
                              {consultant?.name} · {room?.name || '包间'}
                            </p>
                            {entry.extensionHandledBy && entry.extensionStatus !== 'PENDING' && (
                              <p className="text-ivory/30 text-xs mt-0.5">
                                由 {entry.extensionHandledBy} {entry.extensionStatus === 'APPROVED' ? '同意' : '驳回'}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${timeInfo.statusColor}`}>
                            {timeInfo.statusText}
                          </p>
                          {timeInfo.estimatedEnd && (
                            <p className="text-ivory/40 text-xs mt-1">
                              预计 {format(timeInfo.estimatedEnd, 'HH:mm')} 结束
                            </p>
                          )}
                          {entry.serviceStartTime && (
                            <p className="text-ivory/30 text-xs mt-0.5">
                              {format(new Date(entry.serviceStartTime), 'HH:mm')} 开始
                            </p>
                          )}
                        </div>
                      </div>

                      {entry.serviceStartTime && (
                        <div className="h-1.5 bg-deep-space-dark/50 rounded-full overflow-hidden mb-4">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              timeInfo.isOverTime ? 'bg-rose-red' : 'bg-gradient-to-r from-rose-gold to-warm-gold'
                            }`}
                            style={{ width: `${timeInfo.progress}%` }}
                          />
                        </div>
                      )}

                      {entry.extensionMinutes > 0 && entry.extensionStatus === 'APPROVED' && (
                        <p className="text-matcha text-xs">
                          已延长 {entry.extensionMinutes} 分钟
                        </p>
                      )}
                      {entry.extensionStatus === 'PENDING' && (
                        <p className="text-warm-gold text-xs">
                          申请延长 {entry.extensionMinutes} 分钟
                        </p>
                      )}

                      {nextCustomer && (
                        <div className="mt-3 pt-3 border-t border-rose-gold/10 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-blue/60" />
                            <span className="text-ivory/40 text-sm">下一位候客：</span>
                            <span className="text-ivory/70 text-sm">{nextCustomer.codeName}</span>
                          </div>
                          {nextEntry?.estimatedStartTime && (
                            <span className="text-matcha/60 text-xs">
                              约 {format(new Date(nextEntry.estimatedStartTime), 'HH:mm')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-5 pb-4 border-t border-rose-gold/10 pt-4 bg-deep-space-dark/30 animate-fade-in">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                            <div className="text-ivory/40 text-xs mb-1">咨询项目</div>
                            <p className="text-ivory/80 text-sm">
                              {customer?.isSensitive ? '***' : entry.project || '未指定'}
                            </p>
                          </div>
                          <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                            <div className="text-ivory/40 text-xs mb-1">茶点状态</div>
                            <p className="text-ivory/80 text-sm">
                              {entry.teaStatus === 'DELIVERED' ? '已送达' : 
                               entry.teaStatus === 'PREPARING' ? '准备中' : '未准备'}
                            </p>
                          </div>
                        </div>

                        {entry.privacyNotes && (
                          <div className="mb-4 p-3 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                            <div className="flex items-center gap-2 text-rose-gold text-xs mb-2">
                              <Shield className="w-3 h-3" />
                              <span>隐私交接备注</span>
                            </div>
                            <p className="text-ivory/70 text-sm">{entry.privacyNotes}</p>
                          </div>
                        )}

                        {(entry.extensionReason || entry.extensionStatus === 'PENDING') && (
                          <div className={`mb-4 p-3 rounded-lg ${
                            entry.extensionStatus === 'REJECTED' 
                              ? 'bg-rose-red/5 border border-rose-red/20'
                              : 'bg-warm-gold/5 border border-warm-gold/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <p className={`text-xs ${
                                entry.extensionStatus === 'REJECTED' ? 'text-rose-red/60' : 'text-ivory/40'
                              }`}>
                                延长原因
                              </p>
                              {entry.extensionStatus === 'PENDING' && (
                                <span className="text-xs text-warm-gold/70 flex items-center gap-1">
                                  <Clock3 className="w-3 h-3" />
                                  等待前台处理
                                </span>
                              )}
                            </div>
                            <p className={`text-sm ${
                              entry.extensionStatus === 'REJECTED' ? 'text-rose-red/80' : 'text-ivory/70'
                            }`}>
                              {entry.extensionReason}
                            </p>
                          </div>
                        )}

                        {entry.timeline && entry.timeline.length > 0 && (
                          <div className="mb-4 p-3 bg-deep-space-dark/50 rounded-lg">
                            <p className="text-ivory/40 text-xs mb-3 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              今日接待时间线
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {entry.timeline.slice().reverse().map((event: any) => (
                                <div key={event.id} className="flex items-start gap-3">
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${getTimelineColor(event.type)}`}>
                                    {getTimelineIcon(event.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-ivory/80 text-sm">{event.description}</p>
                                      <p className="text-ivory/40 text-xs">{format(new Date(event.timestamp), 'HH:mm')}</p>
                                    </div>
                                    {event.operator && (
                                      <p className="text-ivory/40 text-xs mt-0.5">操作人：{event.operator}</p>
                                    )}
                                    {event.details && (
                                      <p className="text-ivory/50 text-xs mt-0.5 truncate">{event.details}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end">
                          {entry.extensionStatus !== 'REJECTED' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEntry(entry.id);
                                setShowExtensionModal(true);
                              }}
                              disabled={entry.extensionStatus === 'PENDING'}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
                                entry.extensionStatus === 'PENDING'
                                  ? 'bg-warm-gold/5 text-warm-gold/60 cursor-not-allowed'
                                  : 'bg-warm-gold/10 text-warm-gold hover:bg-warm-gold/20'
                              }`}
                            >
                              <Clock className="w-4 h-4" />
                              <span>{entry.extensionStatus === 'PENDING' ? '处理中' : '申请延长'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showExtensionModal && (
        <div className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="luxury-card p-8 w-full max-w-md gradient-border animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-ivory/90">申请延长沟通时间</h3>
              <button
                onClick={() => setShowExtensionModal(false)}
                className="p-2 rounded-lg hover:bg-deep-space-dark/50 text-ivory/50 hover:text-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">延长时间（分钟）</label>
                <select
                  value={extensionMinutes}
                  onChange={(e) => setExtensionMinutes(Number(e.target.value))}
                  className="luxury-input"
                >
                  <option value={15}>15 分钟</option>
                  <option value={30}>30 分钟</option>
                  <option value={45}>45 分钟</option>
                  <option value={60}>60 分钟</option>
                </select>
              </div>

              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">延长原因</label>
                <textarea
                  value={extensionReason}
                  onChange={(e) => setExtensionReason(e.target.value)}
                  placeholder="请说明延长沟通时间的原因..."
                  rows={4}
                  className="luxury-input resize-none"
                />
              </div>

              <div className="p-4 bg-slate-blue/10 rounded-lg border border-slate-blue/20">
                <p className="text-slate-blue text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>申请提交后，需要前台管家或管理员同意后才能生效，您可以在服务卡片上查看处理状态。</span>
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="luxury-button"
                >
                  取消
                </button>
                <button
                  onClick={handleRequestExtension}
                  disabled={!extensionReason}
                  className="luxury-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  提交申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAdjustModal && (
        <div className="fixed inset-0 bg-deep-space/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="luxury-card p-8 w-full max-w-md gradient-border animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-serif text-xl text-ivory/90">
                {adjustType === 'TOP' ? '置顶排队位置' : '延后排队位置'}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="p-2 rounded-lg hover:bg-deep-space-dark/50 text-ivory/50 hover:text-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className={`p-4 rounded-lg border ${
                adjustType === 'TOP' 
                  ? 'bg-matcha/10 border-matcha/30'
                  : 'bg-slate-blue/10 border-slate-blue/30'
              }`}>
                <p className={`text-sm flex items-start gap-2 ${
                  adjustType === 'TOP' ? 'text-matcha' : 'text-slate-blue'
                }`}>
                  {adjustType === 'TOP' 
                    ? <Pin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <ArrowDown className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  }
                  <span>
                    此操作将把顾客队列位置{adjustType === 'TOP' ? '置顶到第一位' : '延后到队列末尾'}，
                    调整记录将包含您的姓名和操作原因，请谨慎操作。
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">调整原因</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={adjustType === 'TOP' 
                    ? '例如：VIP顾客有紧急商务行程需要优先接待' 
                    : '例如：顾客需要稍作休息，延后进入咨询'
                  }
                  rows={3}
                  className="luxury-input resize-none"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="luxury-button"
                >
                  取消
                </button>
                <button
                  onClick={handleAdjustConfirm}
                  disabled={!adjustReason}
                  className="luxury-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {adjustType === 'TOP' ? '确认置顶' : '确认延后'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManagement;
