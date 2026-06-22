import { useState, useMemo } from 'react';
import { FileText, Star, Gift, Calendar, Check, X, Clock, Shield, UserCheck, Coffee, AlertCircle, Info, CheckCircle2, XCircle, Headphones, ArrowDown } from 'lucide-react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import type { TimelineEventType } from '@/types';

const ServiceRecords = () => {
  const {
    getInServiceEntries,
    getCustomerById,
    getConsultantById,
    completeService,
    serviceRecords,
    addNotification,
    getTimelineForEntry,
    queueEntries,
  } = useAppStore();

  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    experienceRating: 5,
    compensation: [] as string[],
    nextAppointmentDate: '',
    notes: '',
    actualDuration: 45,
  });

  const inServiceEntries = getInServiceEntries();

  const compensationOptions = [
    { id: 'discount', label: '项目折扣', value: '下次项目 9 折优惠' },
    { id: 'gift', label: '赠送礼品', value: '赠送高端护肤套装' },
    { id: 'points', label: '积分加倍', value: '赠送 2 倍积分' },
    { id: 'free', label: '免费项目', value: '赠送基础护理一次' },
    { id: 'refund', label: '部分退款', value: '退还部分费用' },
  ];

  const handleCompensationToggle = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      compensation: prev.compensation.includes(value)
        ? prev.compensation.filter(c => c !== value)
        : [...prev.compensation, value],
    }));
  };

  const handleComplete = () => {
    if (!selectedEntry) return;

    const entry = inServiceEntries.find(e => e.id === selectedEntry);
    if (!entry) return;

    completeService(selectedEntry, {
      queueEntryId: selectedEntry,
      customerId: entry.customerId,
      consultantId: entry.consultantId!,
      experienceRating: formData.experienceRating,
      compensation: formData.compensation,
      nextAppointmentDate: formData.nextAppointmentDate ? new Date(formData.nextAppointmentDate) : undefined,
      notes: formData.notes,
      actualDuration: formData.actualDuration,
    });

    const customer = getCustomerById(entry.customerId);
    addNotification({
      type: 'SUCCESS',
      message: `「${customer?.codeName || '贵宾'}」服务已完成，记录已保存`,
      relatedQueueEntryId: selectedEntry,
    });

    setSelectedEntry(null);
    setFormData({
      experienceRating: 5,
      compensation: [],
      nextAppointmentDate: '',
      notes: '',
      actualDuration: 45,
    });
  };

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && setFormData({ ...formData, experienceRating: star })}
            className={`transition-colors ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`w-6 h-6 ${star <= rating ? 'text-warm-gold fill-warm-gold' : 'text-ivory/30'}`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getTimelineIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'CHECKIN': return <UserCheck className="w-3 h-3" />;
      case 'VIEW_DETAILS': return <Info className="w-3 h-3" />;
      case 'CONFIRM_CHECKIN': return <CheckCircle2 className="w-3 h-3" />;
      case 'CONSULTANT_PREPARE': return <UserCheck className="w-3 h-3" />;
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

  const selectedEntryData = selectedEntry ? {
    entry: getInServiceEntries().find(e => e.id === selectedEntry) || queueEntries.find(e => e.id === selectedEntry),
    timeline: getTimelineForEntry(selectedEntry),
  } : null;

  const selectedRecord = selectedRecordId ? serviceRecords.find(r => r.id === selectedRecordId) : null;

  return (
    <div className="grid grid-cols-2 gap-8 animate-fade-in">
      <div className="space-y-6">
        <div className="luxury-card p-6 gradient-border animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider">待完成服务</h3>
            <span className="text-ivory/40 text-sm">共 {inServiceEntries.length} 位</span>
          </div>

          {inServiceEntries.length === 0 ? (
            <div className="text-center py-12 text-ivory/40">
              暂无进行中的服务
            </div>
          ) : (
            <div className="space-y-4">
              {inServiceEntries.map((entry, index) => {
                const customer = getCustomerById(entry.customerId);
                const consultant = entry.consultantId ? getConsultantById(entry.consultantId) : null;
                const isSelected = selectedEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    onClick={() => { setSelectedEntry(entry.id); setSelectedRecordId(null); }}
                    className={`p-5 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-gold/10 border-2 border-rose-gold/30'
                        : 'bg-deep-space-dark/50 border border-transparent hover:bg-deep-space-dark/70'
                    }`}
                    style={{ animationDelay: `${0.1 * index}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-gold/10 flex items-center justify-center">
                          <span className="font-serif text-xl gold-text">
                            {customer?.codeName.charAt(0) || '尊'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-ivory/90 font-serif text-lg">
                              {customer?.codeName || '尊贵嘉宾'}
                            </span>
                            {customer?.level === 'BLACK_CARD' && (
                              <span className="px-2 py-0.5 bg-warm-gold/20 text-warm-gold text-xs rounded-full">
                                黑卡
                              </span>
                            )}
                          </div>
                          <p className="text-ivory/40 text-sm mt-1">
                            {consultant?.name || '待分配'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-ivory/60 text-sm">
                          {entry.serviceStartTime ? format(new Date(entry.serviceStartTime), 'HH:mm') : format(entry.checkinTime, 'HH:mm')} 开始
                        </p>
                        {entry.extensionMinutes > 0 && (
                          <p className="text-warm-gold text-xs mt-1">
                            延长 {entry.extensionMinutes} 分钟
                          </p>
                        )}
                      </div>
                    </div>

                    {entry.privacyNotes && (
                      <div className="mt-3 p-3 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                        <p className="text-rose-gold/70 text-xs mb-1 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          隐私交接备注
                        </p>
                        <p className="text-ivory/70 text-sm">{entry.privacyNotes}</p>
                      </div>
                    )}

                    {entry.extensionReason && (
                      <div className="mt-3 p-3 bg-warm-gold/5 rounded-lg">
                        <p className="text-ivory/40 text-xs mb-1">延长原因</p>
                        <p className="text-ivory/70 text-sm">{entry.extensionReason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {serviceRecords.length > 0 && (
          <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-6">
              今日服务记录
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-hide">
              {serviceRecords.slice(0, 5).map((record, index) => {
                const customer = getCustomerById(record.customerId);
                const consultant = getConsultantById(record.consultantId);
                const isSelected = selectedRecordId === record.id;
                
                return (
                  <div
                    key={record.id}
                    onClick={() => { setSelectedRecordId(record.id); setSelectedEntry(null); }}
                    className={`p-4 rounded-xl cursor-pointer transition-all ${
                      isSelected ? 'bg-matcha/10 border border-matcha/30' : 'bg-deep-space-dark/30 hover:bg-deep-space-dark/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-ivory/80">
                        {customer?.codeName || '尊贵嘉宾'}
                      </span>
                      {renderStars(record.experienceRating)}
                    </div>
                    <div className="flex items-center gap-4 text-ivory/40 text-xs">
                      <span>{consultant?.name}</span>
                      <span>·</span>
                      <span>{format(record.createdAt, 'HH:mm')}</span>
                      <span>·</span>
                      <span>{record.actualDuration} 分钟</span>
                    </div>
                    {record.privacyNotes && (
                      <div className="mt-2 flex items-center gap-1 text-rose-gold/60 text-xs">
                        <Shield className="w-3 h-3" />
                        <span>含隐私交接备注</span>
                      </div>
                    )}
                    {record.compensation.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {record.compensation.map((c, i) => (
                          <span key={i} className="px-2 py-0.5 bg-warm-gold/10 text-warm-gold/70 text-xs rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-rose-gold" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory/90 tracking-wider">
              {selectedRecordId ? '历史服务记录详情' : '服务完成记录'}
            </h3>
            <p className="text-ivory/40 text-sm">
              {selectedRecordId ? '查看该次服务完整信息' : '记录接待体验与后续安排'}
            </p>
          </div>
        </div>

        {!selectedEntry && !selectedRecordId ? (
          <div className="text-center py-16 text-ivory/40">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>请从左侧选择要记录或查看的服务</p>
          </div>
        ) : selectedRecord ? (
          <div className="space-y-6">
            {selectedRecord.timeline && selectedRecord.timeline.length > 0 && (
              <div>
                <h4 className="text-ivory/70 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  完整接待时间线
                </h4>
                <div className="space-y-3 pl-4 border-l-2 border-rose-gold/20 max-h-60 overflow-y-auto scrollbar-hide pr-2">
                  {selectedRecord.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-deep-space-dark bg-rose-gold flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${getTimelineColor(event.type as TimelineEventType).split(' ')[0]}`}>
                          {getTimelineIcon(event.type as TimelineEventType)}
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
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.privacyNotes && (
              <div className="p-4 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                <h5 className="text-rose-gold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  隐私交接备注
                </h5>
                <p className="text-ivory/70 text-sm">{selectedRecord.privacyNotes}</p>
              </div>
            )}

            <div>
              <label className="block text-ivory/70 text-sm mb-3 font-light">接待体验评分</label>
              <div className="flex items-center gap-4">
                {renderStars(selectedRecord.experienceRating)}
                <span className="text-ivory/50 text-sm">
                  {selectedRecord.experienceRating === 5 ? '非常满意' :
                   selectedRecord.experienceRating === 4 ? '满意' :
                   selectedRecord.experienceRating === 3 ? '一般' :
                   selectedRecord.experienceRating === 2 ? '不满意' : '非常不满意'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                <p className="text-ivory/40 text-xs mb-1">实际沟通时长</p>
                <p className="text-ivory/80">{selectedRecord.actualDuration} 分钟</p>
              </div>
              <div className="p-3 bg-deep-space-dark/30 rounded-lg">
                <p className="text-ivory/40 text-xs mb-1">完成时间</p>
                <p className="text-ivory/80">{format(new Date(selectedRecord.createdAt), 'HH:mm')}</p>
              </div>
            </div>

            {selectedRecord.compensation.length > 0 && (
              <div>
                <label className="flex items-center gap-2 text-ivory/70 text-sm mb-3 font-light">
                  <Gift className="w-4 h-4 text-warm-gold" />
                  等待补偿措施
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedRecord.compensation.map((c, i) => (
                    <span key={i} className="px-3 py-1.5 bg-warm-gold/10 text-warm-gold/70 text-xs rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div>
                <label className="block text-ivory/70 text-sm mb-3 font-light">备注</label>
                <p className="text-ivory/60 text-sm bg-deep-space-dark/30 rounded-lg p-3">
                  {selectedRecord.notes}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedRecordId(null)}
              className="w-full luxury-button mt-4"
            >
              返回记录列表
            </button>
          </div>
        ) : selectedEntryData && selectedEntryData.entry ? (
          <div className="space-y-6">
            {selectedEntryData.timeline.length > 0 && (
              <div>
                <h4 className="text-ivory/70 text-sm mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  当前接待时间线
                </h4>
                <div className="space-y-3 pl-4 border-l-2 border-rose-gold/20 max-h-48 overflow-y-auto scrollbar-hide pr-2">
                  {selectedEntryData.timeline.map((event) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-[21px] top-0 w-4 h-4 rounded-full border-2 border-deep-space-dark bg-rose-gold flex items-center justify-center">
                        <div className={`w-3 h-3 rounded-full flex items-center justify-center ${getTimelineColor(event.type as TimelineEventType).split(' ')[0]}`}>
                          {getTimelineIcon(event.type as TimelineEventType)}
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
                  ))}
                </div>
              </div>
            )}

            {selectedEntryData.entry.privacyNotes && (
              <div className="p-4 bg-rose-gold/5 border border-rose-gold/20 rounded-lg">
                <h5 className="text-rose-gold text-sm mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  隐私交接备注
                </h5>
                <p className="text-ivory/70 text-sm">{selectedEntryData.entry.privacyNotes}</p>
              </div>
            )}

            <div>
              <label className="block text-ivory/70 text-sm mb-3 font-light">接待体验评分</label>
              <div className="flex items-center gap-4">
                {renderStars(formData.experienceRating, true)}
                <span className="text-ivory/50 text-sm">
                  {formData.experienceRating === 5 ? '非常满意' :
                   formData.experienceRating === 4 ? '满意' :
                   formData.experienceRating === 3 ? '一般' :
                   formData.experienceRating === 2 ? '不满意' : '非常不满意'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-ivory/70 text-sm mb-3 font-light">实际沟通时长（分钟）</label>
              <input
                type="number"
                value={formData.actualDuration}
                onChange={(e) => setFormData({ ...formData, actualDuration: Number(e.target.value) })}
                className="luxury-input"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-ivory/70 text-sm mb-3 font-light">
                <Gift className="w-4 h-4 text-warm-gold" />
                等待补偿措施
              </label>
              <div className="grid grid-cols-2 gap-3">
                {compensationOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleCompensationToggle(option.id, option.value)}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      formData.compensation.includes(option.value)
                        ? 'bg-warm-gold/10 border-warm-gold/30 text-warm-gold'
                        : 'bg-deep-space-dark/50 border-transparent text-ivory/50 hover:text-ivory/70'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {formData.compensation.includes(option.value) && (
                        <Check className="w-4 h-4" />
                      )}
                      <span className="text-sm">{option.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-ivory/70 text-sm mb-3 font-light">
                <Calendar className="w-4 h-4 text-matcha" />
                下次预约意向
              </label>
              <input
                type="date"
                value={formData.nextAppointmentDate}
                onChange={(e) => setFormData({ ...formData, nextAppointmentDate: e.target.value })}
                className="luxury-input"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>

            <div>
              <label className="block text-ivory/70 text-sm mb-3 font-light">备注</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="记录顾客需求、反馈等信息..."
                rows={4}
                className="luxury-input resize-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                onClick={() => setSelectedEntry(null)}
                className="luxury-button"
              >
                <X className="w-4 h-4 inline mr-2" />
                取消
              </button>
              <button
                onClick={handleComplete}
                className="luxury-button-primary"
              >
                <Check className="w-4 h-4 inline mr-2" />
                完成服务
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ServiceRecords;
