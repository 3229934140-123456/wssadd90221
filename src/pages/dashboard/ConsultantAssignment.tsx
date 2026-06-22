import { useState } from 'react';
import { UserCheck, Star, Clock, Award, UserX, Check } from 'lucide-react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';

const ConsultantAssignment = () => {
  const {
    consultants,
    getWaitingQueue,
    getCustomerById,
    assignConsultant,
    addNotification,
  } = useAppStore();

  const [selectedConsultant, setSelectedConsultant] = useState<string | null>(null);
  const [selectedQueueEntry, setSelectedQueueEntry] = useState<string | null>(null);

  const waitingQueue = getWaitingQueue().filter(e => !e.consultantId);

  const handleAssign = () => {
    if (selectedConsultant && selectedQueueEntry) {
      assignConsultant(selectedQueueEntry, selectedConsultant);
      const entry = waitingQueue.find(e => e.id === selectedQueueEntry);
      const customer = entry ? getCustomerById(entry.customerId) : null;
      const consultant = consultants.find(c => c.id === selectedConsultant);
      addNotification({
        type: 'SUCCESS',
        message: `已为「${customer?.codeName || '贵宾'}」分配顾问：${consultant?.name}`,
        relatedQueueEntryId: selectedQueueEntry,
      });
      setSelectedConsultant(null);
      setSelectedQueueEntry(null);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-8 animate-fade-in">
      <div className="luxury-card p-6 gradient-border animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg text-ivory/80 tracking-wider">咨询师列表</h3>
          <span className="text-ivory/40 text-sm">
            空闲 {consultants.filter(c => c.status === 'IDLE').length}/{consultants.length}
          </span>
        </div>

        <div className="space-y-4">
          {consultants.map((consultant, index) => {
            const isSelected = selectedConsultant === consultant.id;
            const isIdle = consultant.status === 'IDLE';
            
            return (
              <div
                key={consultant.id}
                onClick={() => isIdle && setSelectedConsultant(consultant.id)}
                className={`p-5 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-rose-gold/10 border-2 border-rose-gold/30'
                    : isIdle
                    ? 'bg-deep-space-dark/50 border border-transparent hover:bg-deep-space-dark/70'
                    : 'bg-deep-space-dark/30 border border-transparent opacity-60 cursor-not-allowed'
                }`}
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img
                      src={consultant.avatar}
                      alt={consultant.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-rose-gold/30"
                    />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-deep-space ${
                      consultant.status === 'IDLE' ? 'bg-matcha' : consultant.status === 'IN_SERVICE' ? 'bg-rose-gold' : 'bg-ivory/30'}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-ivory/90 font-medium">{consultant.name}</span>
                      <div className="flex items-center gap-0.5">
                        <Star className="w-3.5 h-3.5 text-warm-gold fill-warm-gold" />
                        <span className="text-ivory/70 text-sm">{consultant.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {consultant.specialties.slice(0, 2).map((specialty, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-rose-gold/10 text-rose-gold/70 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-ivory/40 text-xs">
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {consultant.yearsOfExperience}年经验
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        今日{consultant.servedToday}位
                      </span>
                      <span>负荷 {consultant.currentLoad}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm ${
                      isIdle ? 'text-matcha' : consultant.status === 'IN_SERVICE' ? 'text-rose-gold' : 'text-ivory/40'
                    }`}>
                      {isIdle ? '空闲' : consultant.status === 'IN_SERVICE' ? '服务中' : '离线'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-6">
        <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-serif text-lg text-ivory/80 tracking-wider">待分配顾客</h3>
            <span className="text-ivory/40 text-sm">共 {waitingQueue.length} 位</span>
          </div>

          {waitingQueue.length === 0 ? (
            <div className="text-center py-12 text-ivory/40">
              所有顾客已分配顾问
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
              {waitingQueue.map((entry, index) => {
                const customer = getCustomerById(entry.customerId);
                const isSelected = selectedQueueEntry === entry.id;

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedQueueEntry(entry.id)}
                    className={`p-4 rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-matcha/10 border-2 border-matcha/30'
                        : 'bg-deep-space-dark/50 border border-transparent hover:bg-deep-space-dark/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-gold/10 flex items-center justify-center">
                          <span className="font-serif text-rose-gold">{entry.position}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-ivory/90">{customer?.codeName || '尊贵嘉宾'}</span>
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
                          <p className="text-ivory/40 text-sm mt-0.5">
                            {format(entry.checkinTime, 'HH:mm')} 签到 · 已等候 {entry.waitTime} 分钟
                          </p>
                        </div>
                      </div>
                      {entry.designatedConsultantId && (
                        <div className="flex items-center gap-1 text-rose-gold/70 text-xs">
                          <UserCheck className="w-3 h-3" />
                          <span>已指定</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-6">分配操作</h3>
          
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-deep-space-dark/50">
              <p className="text-ivory/50 text-sm mb-2">已选择的顾问</p>
              <p className="text-ivory/80">
                {selectedConsultant
                  ? consultants.find(c => c.id === selectedConsultant)?.name || '未选择'
                  : '请从左侧选择顾问'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-deep-space-dark/50">
              <p className="text-ivory/50 text-sm mb-2">已选择的顾客</p>
              <p className="text-ivory/80">
                {selectedQueueEntry
                  ? (() => {
                    const entry = waitingQueue.find(e => e.id === selectedQueueEntry);
                    const customer = entry ? getCustomerById(entry.customerId) : null;
                    return customer?.codeName || '未选择';
                  })()
                  : '请从上方选择顾客'}
              </p>
            </div>

            <button
              onClick={handleAssign}
              disabled={!selectedConsultant || !selectedQueueEntry}
              className="w-full luxury-button-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <UserCheck className="w-5 h-5" />
              确认分配
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultantAssignment;
