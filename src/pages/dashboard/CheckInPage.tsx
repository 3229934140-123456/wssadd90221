import { useState } from 'react';
import { Search, UserPlus, Coffee, Sparkles, Check, AlertCircle, Crown, X, Calendar, UserCheck, Shield, Clock, Star, Eye } from 'lucide-react';
import { useAppStore } from '@/store';
import type { Customer, ReminderMethod, Appointment } from '@/types';
import { getLevelBadge } from '@/utils/sortEngine';
import { format } from 'date-fns';

const CheckInPage = () => {
  const {
    findCustomerByMemberId,
    findAppointmentByCode,
    addQueueEntry,
    generateCodeName,
    getIdleConsultants,
    getIdleRooms,
    assignConsultant,
    assignRoom,
    updateTeaStatus,
    settings,
    addNotification,
    getCustomerById,
    getConsultantById,
    addCustomer,
    hasCheckedInAppointment,
  } = useAppStore();

  const [searchType, setSearchType] = useState<'member' | 'appointment' | 'standby'>('member');
  const [searchValue, setSearchValue] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [foundAppointment, setFoundAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  
  const [standbyForm, setStandbyForm] = useState({
    name: '',
    phone: '',
    level: 'NORMAL' as 'NORMAL' | 'VIP' | 'BLACK_CARD',
    isSensitive: false,
    teaPreference: '',
    project: '',
    reminderMethod: 'HEADSET' as ReminderMethod,
  });

  const [checkinForm, setCheckinForm] = useState({
    reminderMethod: 'HEADSET' as ReminderMethod,
  });

  const handleSearch = () => {
    setError('');
    setFoundCustomer(null);
    setFoundAppointment(null);
    setShowDetailDrawer(false);

    if (searchType === 'member') {
      const customer = findCustomerByMemberId(searchValue);
      if (customer) {
        setFoundCustomer(customer);
        setCheckinForm({ reminderMethod: 'HEADSET' });
      } else {
        setError('未找到该会员信息');
      }
    } else if (searchType === 'appointment') {
      const appointment = findAppointmentByCode(searchValue.toUpperCase());
      if (appointment) {
        if (hasCheckedInAppointment(appointment.id)) {
          const customer = getCustomerById(appointment.customerId);
          setError(`「${customer?.codeName || '贵宾'}」已使用该预约码签到过，请勿重复操作`);
          return;
        }
        setFoundAppointment(appointment);
        const customer = getCustomerById(appointment.customerId);
        if (customer) {
          setFoundCustomer(customer);
          setCheckinForm({ reminderMethod: 'HEADSET' });
        }
      } else {
        setError('未找到该预约码');
      }
    }
  };

  const openDetailDrawer = () => {
    setShowDetailDrawer(true);
  };

  const handleCheckIn = (customer: Customer, appointmentId?: string, designatedConsultantId?: string) => {
    const idleConsultants = getIdleConsultants();
    const idleRooms = getIdleRooms();

    const projectInfo = foundAppointment?.isSensitive 
      ? undefined 
      : (foundAppointment?.project || standbyForm.project);

    const entry = addQueueEntry({
      customerId: customer.id,
      status: 'WAITING',
      teaStatus: 'NOT_PREPARED',
      checkinTime: new Date(),
      estimatedStartTime: new Date(Date.now() + 15 * 60000),
      isStandby: searchType === 'standby',
      reminderMethod: searchType === 'standby' ? standbyForm.reminderMethod : checkinForm.reminderMethod,
      appointmentId,
      designatedConsultantId,
      project: projectInfo,
    });

    if (settings.autoAssignConsultant && idleConsultants.length > 0) {
      const consultant = idleConsultants.sort((a, b) => a.currentLoad - b.currentLoad)[0];
      assignConsultant(entry.id, consultant.id);
    }

    if (idleRooms.length > 0) {
      const room = idleRooms[0];
      assignRoom(entry.id, room.id);
    }

    if (customer.teaPreference) {
      updateTeaStatus(entry.id, 'PREPARING');
    }

    setSuccess(`「${customer.codeName}」已成功签到`);
    addNotification({
      type: 'SUCCESS',
      message: `「${customer.codeName}」已签到，${customer.level === 'BLACK_CARD' ? '黑卡' : customer.level === 'VIP' ? 'VIP' : '普通'}会员`,
      relatedQueueEntryId: entry.id,
    });

    setSearchValue('');
    setFoundCustomer(null);
    setFoundAppointment(null);
    setShowDetailDrawer(false);
    setStandbyForm({
      name: '',
      phone: '',
      level: 'NORMAL',
      isSensitive: false,
      teaPreference: '',
      project: '',
      reminderMethod: 'HEADSET',
    });

    setTimeout(() => setSuccess(''), 3000);
  };

  const handleStandbyCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!standbyForm.name || !standbyForm.phone) {
      setError('请填写姓名和手机号');
      return;
    }

    const codeName = generateCodeName();
    
    const newCustomer: Customer = {
      id: `c${Date.now()}`,
      name: standbyForm.name,
      phone: standbyForm.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      level: standbyForm.level,
      codeName: codeName,
      teaPreference: standbyForm.teaPreference,
      isSensitive: standbyForm.isSensitive,
      totalVisits: 1,
    };

    addCustomer(newCustomer);
    handleCheckIn(newCustomer);
  };

  const levelBadge = foundCustomer ? getLevelBadge(foundCustomer.level) : null;
  const designatedConsultant = foundAppointment?.consultantId 
    ? getConsultantById(foundAppointment.consultantId) 
    : null;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {success && (
        <div className="mb-6 p-4 bg-matcha/10 border border-matcha/30 rounded-xl flex items-center gap-3 text-matcha animate-fade-in">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="luxury-card p-8 gradient-border mb-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-rose-gold" />
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory/90 tracking-wider">贵宾签到</h3>
            <p className="text-ivory/40 text-sm">通过会员号、预约码签到或临时登记</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          {[
            { key: 'member', label: '会员号签到' },
            { key: 'appointment', label: '预约码签到' },
            { key: 'standby', label: 'VIP 临时到店' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSearchType(tab.key as any);
                setSearchValue('');
                setFoundCustomer(null);
                setFoundAppointment(null);
                setError('');
                setShowDetailDrawer(false);
              }}
              className={`flex-1 py-4 px-6 rounded-xl transition-all ${
                searchType === tab.key
                  ? 'bg-rose-gold/10 text-rose-gold border border-rose-gold/30'
                  : 'bg-deep-space-dark/30 text-ivory/50 border border-transparent hover:text-ivory/70'
              }`}
            >
              {tab.key === 'standby' && (
                <Crown className="w-4 h-4 inline mr-2 text-warm-gold" />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        {searchType !== 'standby' ? (
          <>
            <div className="flex gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-gold/50" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={searchType === 'member' ? '请输入会员号或手机号' : '请输入预约码'}
                  className="luxury-input pl-12"
                />
              </div>
              <button
                onClick={handleSearch}
                className="luxury-button-primary px-8"
              >
                搜索
              </button>
            </div>

            {error && (
              <div className="p-4 bg-warm-gold/10 border border-warm-gold/30 rounded-xl flex items-center gap-3 text-warm-gold animate-fade-in">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            )}

            {foundCustomer && (
              <div className="mt-6 p-6 bg-deep-space-dark/50 rounded-xl border border-rose-gold/20 animate-slide-up">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-rose-gold/10 flex items-center justify-center">
                      <span className="font-serif text-2xl gold-text">
                        {foundCustomer.codeName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-serif text-xl text-ivory/90">
                          {foundCustomer.codeName}
                        </span>
                        {levelBadge && (
                          <span className={`px-3 py-1 rounded-full text-xs ${levelBadge.color}`}>
                            {levelBadge.text}
                          </span>
                        )}
                        {(foundCustomer.isSensitive || foundAppointment?.isSensitive) && (
                          <span className="px-2 py-0.5 bg-rose-gold/10 text-rose-gold text-xs rounded-full">
                            高敏感度
                          </span>
                        )}
                      </div>
                      <p className="text-ivory/50 text-sm mt-1">
                        会员号：{foundCustomer.id} | 到店 {foundCustomer.totalVisits} 次
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={openDetailDrawer}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-deep-space-dark/50 text-ivory/60 hover:text-rose-gold transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    查看详情
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-deep-space-dark/50 rounded-lg">
                    <div className="flex items-center gap-2 text-ivory/40 text-sm mb-1">
                      <Coffee className="w-4 h-4" />
                      <span>茶饮偏好</span>
                    </div>
                    <p className="text-ivory/80">{foundCustomer.teaPreference || '未设置'}</p>
                  </div>
                  <div className="p-4 bg-deep-space-dark/50 rounded-lg">
                    <div className="flex items-center gap-2 text-ivory/40 text-sm mb-1">
                      <Sparkles className="w-4 h-4" />
                      <span>上次到店</span>
                    </div>
                    <p className="text-ivory/80">
                      {foundCustomer.lastVisit 
                        ? format(new Date(foundCustomer.lastVisit), 'yyyy-MM-dd')
                        : '首次到店'}
                    </p>
                  </div>
                  <div className="p-4 bg-deep-space-dark/50 rounded-lg">
                    <div className="text-ivory/40 text-sm mb-1">提醒方式</div>
                    <select
                      value={checkinForm.reminderMethod}
                      onChange={(e) => setCheckinForm({ reminderMethod: e.target.value as ReminderMethod })}
                      className="w-full bg-transparent text-ivory/80 focus:outline-none"
                    >
                      <option value="HEADSET">耳机提醒</option>
                      <option value="SMS">短信提醒</option>
                      <option value="NONE">不提醒</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setFoundCustomer(null);
                      setFoundAppointment(null);
                    }}
                    className="luxury-button"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => handleCheckIn(
                      foundCustomer, 
                      foundAppointment?.id,
                      foundAppointment?.consultantId
                    )}
                    className="luxury-button-primary"
                  >
                    确认签到
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleStandbyCheckIn} className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">姓名</label>
                <input
                  type="text"
                  value={standbyForm.name}
                  onChange={(e) => setStandbyForm({ ...standbyForm, name: e.target.value })}
                  placeholder="请输入客户姓名"
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">手机号</label>
                <input
                  type="tel"
                  value={standbyForm.phone}
                  onChange={(e) => setStandbyForm({ ...standbyForm, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="luxury-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">会员等级</label>
                <select
                  value={standbyForm.level}
                  onChange={(e) => setStandbyForm({ ...standbyForm, level: e.target.value as any })}
                  className="luxury-input"
                >
                  <option value="NORMAL">普通会员</option>
                  <option value="VIP">VIP 会员</option>
                  <option value="BLACK_CARD">黑卡会员</option>
                </select>
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">茶饮偏好</label>
                <select
                  value={standbyForm.teaPreference}
                  onChange={(e) => setStandbyForm({ ...standbyForm, teaPreference: e.target.value })}
                  className="luxury-input"
                >
                  <option value="">请选择</option>
                  {settings.teaOptions.map(tea => (
                    <option key={tea} value={tea}>{tea}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-ivory/70 text-sm mb-2 font-light">咨询项目</label>
              <input
                type="text"
                value={standbyForm.project}
                onChange={(e) => setStandbyForm({ ...standbyForm, project: e.target.value })}
                placeholder="请输入咨询项目（可选）"
                className="luxury-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">提醒方式</label>
                <select
                  value={standbyForm.reminderMethod}
                  onChange={(e) => setStandbyForm({ ...standbyForm, reminderMethod: e.target.value as ReminderMethod })}
                  className="luxury-input"
                >
                  <option value="HEADSET">耳机提醒</option>
                  <option value="SMS">短信提醒</option>
                  <option value="NONE">不提醒</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={standbyForm.isSensitive}
                    onChange={(e) => setStandbyForm({ ...standbyForm, isSensitive: e.target.checked })}
                    className="w-5 h-5 rounded border-rose-gold/30 bg-deep-space-dark text-rose-gold focus:ring-rose-gold/50"
                  />
                  <span className="text-ivory/70">高敏感度项目</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  setStandbyForm({
                    name: '',
                    phone: '',
                    level: 'NORMAL',
                    isSensitive: false,
                    teaPreference: '',
                    project: '',
                    reminderMethod: 'HEADSET',
                  });
                }}
                className="luxury-button"
              >
                重置
              </button>
              <button type="submit" className="luxury-button-primary">
                加入候补队列
              </button>
            </div>
          </form>
        )}
      </div>

      {showDetailDrawer && foundCustomer && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowDetailDrawer(false)}
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-deep-space border-l border-rose-gold/20 shadow-2xl animate-slide-in-right overflow-y-auto">
            <div className="sticky top-0 bg-deep-space/95 backdrop-blur-sm p-6 border-b border-rose-gold/10 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-rose-gold" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-ivory/90">到店详情确认</h3>
                  <p className="text-ivory/40 text-xs">请核对信息后确认签到</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailDrawer(false)}
                className="w-10 h-10 rounded-xl bg-deep-space-dark/50 flex items-center justify-center text-ivory/40 hover:text-ivory transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 p-6 bg-deep-space-dark/50 rounded-xl border border-rose-gold/20">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-gold/20 to-warm-gold/20 flex items-center justify-center">
                  <span className="font-serif text-3xl gold-text">
                    {foundCustomer.codeName.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-serif text-2xl text-ivory/90">{foundCustomer.codeName}</span>
                    {levelBadge && (
                      <span className={`px-3 py-1 rounded-full text-xs ${levelBadge.color}`}>
                        {levelBadge.text}
                      </span>
                    )}
                  </div>
                  <p className="text-ivory/50 text-sm">会员号：{foundCustomer.id}</p>
                </div>
              </div>

              {foundAppointment && (
                <div className="space-y-4 p-6 bg-deep-space-dark/30 rounded-xl border border-warm-gold/20">
                  <h4 className="flex items-center gap-2 text-warm-gold font-serif">
                    <Calendar className="w-4 h-4" />
                    预约信息
                  </h4>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-ivory/40 text-sm">预约码</span>
                      <span className="text-ivory/80 font-mono">{foundAppointment.code}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-ivory/40 text-sm">预约时间</span>
                      <span className="text-ivory/80">
                        {format(new Date(foundAppointment.appointmentTime), 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-ivory/40 text-sm pt-1">预约项目</span>
                      <div className="text-right">
                        {foundAppointment.isSensitive ? (
                          <div className="flex items-center gap-1 text-rose-gold">
                            <Shield className="w-4 h-4" />
                            <span>私密项目</span>
                          </div>
                        ) : (
                          <span className="text-ivory/80">{foundAppointment.project}</span>
                        )}
                      </div>
                    </div>
                    {designatedConsultant && (
                      <div className="flex justify-between items-center">
                        <span className="text-ivory/40 text-sm">指定顾问</span>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-rose-gold/10 flex items-center justify-center">
                            <span className="text-xs gold-text">{designatedConsultant.name.charAt(0)}</span>
                          </div>
                          <span className="text-ivory/80">{designatedConsultant.name}</span>
                          <span className="text-ivory/40 text-xs">
                            · {designatedConsultant.specialties[0]}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4 p-6 bg-deep-space-dark/30 rounded-xl border border-matcha/10">
                <h4 className="flex items-center gap-2 text-matcha font-serif">
                  <UserCheck className="w-4 h-4" />
                  顾客信息
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-ivory/40 text-sm">历史到店</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-warm-gold" />
                      <span className="text-ivory/80">{foundCustomer.totalVisits} 次</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ivory/40 text-sm">茶饮偏好</span>
                    <div className="flex items-center gap-1">
                      <Coffee className="w-4 h-4 text-rose-gold/70" />
                      <span className="text-ivory/80">{foundCustomer.teaPreference || '未设置'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-ivory/40 text-sm">上次到店</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-blue/70" />
                      <span className="text-ivory/80">
                        {foundCustomer.lastVisit 
                          ? format(new Date(foundCustomer.lastVisit), 'yyyy-MM-dd')
                          : '首次到店'}
                      </span>
                    </div>
                  </div>
                  {(foundCustomer.isSensitive || foundAppointment?.isSensitive) && (
                    <div className="mt-3 p-3 bg-rose-gold/5 rounded-lg border border-rose-gold/20">
                      <div className="flex items-center gap-2 text-rose-gold text-sm">
                        <Shield className="w-4 h-4" />
                        <span>本次接待涉及敏感项目，请注意隐私保护</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-deep-space-dark/50 rounded-xl">
                <label className="block text-ivory/70 text-sm mb-3 font-light">提醒方式确认</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'HEADSET', label: '耳机提醒', desc: '管家耳机' },
                    { value: 'SMS', label: '短信提醒', desc: '手机短信' },
                    { value: 'NONE', label: '静默', desc: '不通知' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCheckinForm({ reminderMethod: opt.value as ReminderMethod })}
                      className={`p-3 rounded-lg border transition-all text-center ${
                        checkinForm.reminderMethod === opt.value
                          ? 'bg-rose-gold/10 border-rose-gold/30 text-rose-gold'
                          : 'bg-deep-space-dark/50 border-transparent text-ivory/50 hover:text-ivory'
                      }`}
                    >
                      <p className="text-sm">{opt.label}</p>
                      <p className="text-xs opacity-60 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-deep-space/95 backdrop-blur-sm p-6 border-t border-rose-gold/10">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="luxury-button flex-1"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowDetailDrawer(false);
                    setTimeout(() => {
                      handleCheckIn(
                        foundCustomer, 
                        foundAppointment?.id,
                        foundAppointment?.consultantId
                      );
                    }, 100);
                  }}
                  className="luxury-button-primary flex-1"
                >
                  <Check className="w-4 h-4 inline mr-2" />
                  确认签到
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInPage;
