import { useState } from 'react';
import { Settings, Bell, Coffee, Clock, UserCircle, Shield } from 'lucide-react';
import { useAppStore } from '@/store';

const SettingsPage = () => {
  const { settings, updateSettings, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: '通用设置', icon: Settings },
    { id: 'reminders', label: '提醒设置', icon: Bell },
    { id: 'soothe', label: '安抚服务', icon: Coffee },
    { id: 'privacy', label: '隐私设置', icon: Shield },
    { id: 'profile', label: '个人信息', icon: UserCircle },
  ];

  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">标准咨询时长（分钟）</label>
                <input
                  type="number"
                  value={localSettings.standardConsultationMinutes}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    standardConsultationMinutes: Number(e.target.value),
                  })}
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">最大延长次数</label>
                <input
                  type="number"
                  value={localSettings.maxExtensions}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    maxExtensions: Number(e.target.value),
                  })}
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">每次延长时长（分钟）</label>
                <input
                  type="number"
                  value={localSettings.extensionMinutes}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    extensionMinutes: Number(e.target.value),
                  })}
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">清洁准备时长（分钟）</label>
                <input
                  type="number"
                  value={localSettings.roomCleaningMinutes}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    roomCleaningMinutes: Number(e.target.value),
                  })}
                  className="luxury-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-ivory/70 text-sm mb-3 font-light">默认提醒方式</label>
              <div className="grid grid-cols-3 gap-4">
                {(['SILENT', 'SMS', 'CALL'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setLocalSettings({
                      ...localSettings,
                      defaultReminderMethod: method,
                    })}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      localSettings.defaultReminderMethod === method
                        ? 'bg-rose-gold/10 border-rose-gold/30 text-rose-gold'
                        : 'bg-deep-space-dark/30 border-transparent text-ivory/50 hover:text-ivory/70'
                    }`}
                  >
                    <p className="font-medium mb-1">
                      {method === 'SILENT' ? '静默提醒' : method === 'SMS' ? '短信提醒' : '电话提醒'}
                    </p>
                    <p className="text-xs opacity-60">
                      {method === 'SILENT'
                        ? '管家耳机/屏幕闪烁通知'
                        : method === 'SMS'
                        ? '发送短信到顾客手机'
                        : '电话通知顾客'}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">等待时间提醒阈值</h4>
              <div className="grid grid-cols-3 gap-6">
                {Object.entries(localSettings.reminderThresholds).map(([level, minutes]) => (
                  <div key={level}>
                    <label className="block text-ivory/70 text-sm mb-2 font-light">
                      {level === 'BLACK_CARD' ? '黑卡会员' : level === 'VIP' ? 'VIP 会员' : '普通会员'}
                      （分钟）
                    </label>
                    <input
                      type="number"
                      value={minutes as number}
                      onChange={(e) => setLocalSettings({
                        ...localSettings,
                        reminderThresholds: {
                          ...localSettings.reminderThresholds,
                          [level]: Number(e.target.value),
                        },
                      })}
                      className="luxury-input"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">通知方式启用</h4>
              <div className="space-y-4">
                {[
                  { key: 'smsEnabled', label: '短信通知', desc: '通过短信发送排队提醒和服务通知' },
                  { key: 'headsetEnabled', label: '耳机提醒', desc: '管家耳机接收静默提醒' },
                  { key: 'screenNotificationEnabled', label: '屏幕通知', desc: '接待屏幕闪烁提示' },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between p-4 rounded-xl bg-deep-space-dark/30"
                  >
                    <div>
                      <p className="text-ivory/80">{item.label}</p>
                      <p className="text-ivory/40 text-sm">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => setLocalSettings({
                        ...localSettings,
                        [item.key]: !localSettings[item.key as keyof typeof localSettings] as boolean,
                      })}
                      className={`w-14 h-8 rounded-full transition-all ${
                        localSettings[item.key as keyof typeof localSettings]
                          ? 'bg-rose-gold'
                          : 'bg-ivory/20'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full bg-ivory transition-transform ${
                          localSettings[item.key as keyof typeof localSettings]
                            ? 'translate-x-7'
                            : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'soothe':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">安抚服务设置</h4>
              <p className="text-ivory/40 text-sm mb-6">
                当顾客等待时间超过阈值时，系统将自动提示管家提供以下安抚服务
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {Object.entries(localSettings.sootheServices).map(([level, services]) => (
                <div key={level} className="p-6 rounded-xl bg-deep-space-dark/30">
                  <h5 className="text-ivory/80 mb-4">
                    {level === 'BLACK_CARD' ? '黑卡会员' : level === 'VIP' ? 'VIP 会员' : '普通会员'}
                  </h5>
                  <div className="space-y-3">
                    {(services as string[]).map((service, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-rose-gold" />
                        <span className="text-ivory/70 text-sm">{service}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">茶点选项</h4>
              <div className="grid grid-cols-4 gap-3">
                {localSettings.teaOptions.map((tea, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-deep-space-dark/30 text-center text-ivory/70 text-sm"
                  >
                    {tea}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-8 animate-fade-in">
            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">隐私保护设置</h4>
            </div>

            <div className="space-y-4">
              {[
                {
                  key: 'showCodeNameOnly',
                  label: '仅显示专属代号',
                  desc: '接待屏和队列中不显示真实姓名',
                  value: localSettings.privacySettings.showCodeNameOnly,
                },
                {
                  key: 'hideSensitiveProjects',
                  label: '隐藏敏感项目',
                  desc: '对高敏感度项目在队列中不显示项目名称',
                  value: localSettings.privacySettings.hideSensitiveProjects,
                },
                {
                  key: 'silentModeDefault',
                  label: '默认静默叫号',
                  desc: '所有叫号默认使用静默方式，避免公开呼叫',
                  value: localSettings.privacySettings.silentModeDefault,
                },
                {
                  key: 'autoGenerateCodeName',
                  label: '自动生成专属代号',
                  desc: '新顾客签到时自动生成专属代号',
                  value: localSettings.privacySettings.autoGenerateCodeName,
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-deep-space-dark/30"
                >
                  <div>
                    <p className="text-ivory/80">{item.label}</p>
                    <p className="text-ivory/40 text-sm">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setLocalSettings({
                      ...localSettings,
                      privacySettings: {
                        ...localSettings.privacySettings,
                        [item.key]: !item.value,
                      },
                    })}
                    className={`w-14 h-8 rounded-full transition-all ${
                      item.value ? 'bg-rose-gold' : 'bg-ivory/20'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-ivory transition-transform ${
                        item.value ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl bg-rose-gold/5 border border-rose-gold/20">
              <h5 className="text-rose-gold font-serif mb-3">敏感项目类型</h5>
              <p className="text-ivory/40 text-sm mb-4">
                以下类型的项目将被标记为敏感，在公开界面进行特殊处理
              </p>
              <div className="flex flex-wrap gap-2">
                {localSettings.sensitiveProjectTypes.map((type, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full bg-warm-gold/10 text-warm-gold text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex items-center gap-6 p-6 rounded-xl bg-deep-space-dark/30">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-gold to-warm-gold flex items-center justify-center">
                <span className="font-serif text-3xl text-ivory">
                  {currentUser?.name.charAt(0) || '管'}
                </span>
              </div>
              <div>
                <h4 className="text-ivory/90 text-2xl font-serif">{currentUser?.name}</h4>
                <p className="text-ivory/50">
                  {currentUser?.role === 'ADMIN'
                    ? '系统管理员'
                    : currentUser?.role === 'RECEPTION' || currentUser?.role === 'RECEPTIONIST'
                    ? '前台管家'
                    : '咨询顾问'}
                </p>
                <p className="text-ivory/40 text-sm mt-1">员工编号: {currentUser?.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">姓名</label>
                <input
                  type="text"
                  value={currentUser?.name || ''}
                  readOnly
                  className="luxury-input opacity-70"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">角色</label>
                <input
                  type="text"
                  value={
                    currentUser?.role === 'ADMIN'
                      ? '系统管理员'
                      : currentUser?.role === 'RECEPTION' || currentUser?.role === 'RECEPTIONIST'
                      ? '前台管家'
                      : '咨询顾问'
                  }
                  readOnly
                  className="luxury-input opacity-70"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">联系电话</label>
                <input
                  type="text"
                  placeholder="请输入联系电话"
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-ivory/70 text-sm mb-2 font-light">电子邮箱</label>
                <input
                  type="email"
                  placeholder="请输入电子邮箱"
                  className="luxury-input"
                />
              </div>
            </div>

            <div>
              <h4 className="text-ivory/80 text-lg font-serif mb-6">权限说明</h4>
              <div className="p-4 rounded-xl bg-deep-space-dark/30">
                <ul className="space-y-2 text-ivory/60 text-sm">
                  {currentUser?.role === 'ADMIN' && (
                    <>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        系统设置与配置管理
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        所有模块完全访问权限
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        数据统计与报表查看
                      </li>
                    </>
                  )}
                  {(currentUser?.role === 'RECEPTION' || currentUser?.role === 'RECEPTIONIST') && (
                    <>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        贵宾签到与排队管理
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        静默提醒与安抚服务
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        包间状态查看与更新
                      </li>
                    </>
                  )}
                  {currentUser?.role === 'CONSULTANT' && (
                    <>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        个人日程与顾客查看
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        申请延长沟通时间
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-matcha" />
                        服务记录填写
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-rose-gold/10 flex items-center justify-center">
          <Settings className="w-5 h-5 text-rose-gold" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-ivory/90 tracking-wider">系统设置</h2>
          <p className="text-ivory/40 text-sm">配置系统参数与个性化选项</p>
        </div>
      </div>

      <div className="grid grid-cols-[240px_1fr] gap-8">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-rose-gold/10 text-rose-gold'
                    : 'text-ivory/50 hover:text-ivory/70 hover:bg-deep-space-dark/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-light">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="luxury-card p-8 gradient-border">
          {renderTabContent()}

          {activeTab !== 'profile' && (
            <div className="flex justify-end mt-8 pt-6 border-t border-rose-gold/10">
              <button onClick={handleSave} className="luxury-button-primary">
                保存设置
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
