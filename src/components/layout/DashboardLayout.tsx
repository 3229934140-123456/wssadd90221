import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  Users,
  UserCheck,
  DoorOpen,
  FileText,
  Settings,
  LogOut,
  Bell,
  Sparkles,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const { 
    currentUser, 
    logout, 
    notifications, 
    markNotificationRead,
    getWaitingQueue,
    getInServiceEntries,
  } = useAppStore();

  const waitingQueue = getWaitingQueue();
  const inServiceEntries = getInServiceEntries();

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { state: { from: location.pathname } });
    }
  }, [currentUser, navigate, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: '首页看板', path: '/dashboard' },
    { icon: UserPlus, label: '贵宾签到', path: '/dashboard/checkin' },
    { icon: Users, label: '队列管理', path: '/dashboard/queue' },
    { icon: UserCheck, label: '顾问分配', path: '/dashboard/assignment' },
    { icon: DoorOpen, label: '包间状态', path: '/dashboard/rooms' },
    { icon: FileText, label: '服务记录', path: '/dashboard/records' },
  ];

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'URGENT': return 'bg-rose-gold';
      case 'WARNING': return 'bg-warm-gold';
      case 'SUCCESS': return 'bg-matcha';
      default: return 'bg-slate-blue';
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-deep-space flex">
      <aside className="w-64 bg-deep-space-dark/50 border-r border-rose-gold/10 flex flex-col">
        <div className="p-6 border-b border-rose-gold/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-6 h-6 text-rose-gold" />
            <span className="font-serif text-xl gold-text tracking-wider">臻颜医美</span>
          </div>
          <p className="text-ivory/40 text-xs tracking-wider">内部调度系统</p>
        </div>

        <nav className="flex-1 py-6 px-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <button
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? 'bg-rose-gold/10 text-rose-gold border border-rose-gold/20'
                        : 'text-ivory/60 hover:text-ivory hover:bg-deep-space-light/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm tracking-wider font-light">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {currentUser.role === 'ADMIN' && (
            <>
              <div className="divider my-6" />
              <button
                onClick={() => navigate('/dashboard/settings')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                  location.pathname === '/dashboard/settings'
                    ? 'bg-rose-gold/10 text-rose-gold border border-rose-gold/20'
                    : 'text-ivory/60 hover:text-ivory hover:bg-deep-space-light/50'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm tracking-wider font-light">系统设置</span>
              </button>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-rose-gold/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-rose-gold/20 flex items-center justify-center">
              <span className="text-rose-gold font-serif">
                {currentUser.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ivory text-sm truncate">{currentUser.name}</p>
              <p className="text-ivory/40 text-xs">
                {currentUser.role === 'ADMIN' ? '系统管理员' : 
                 currentUser.role === 'RECEPTIONIST' ? '前台管家' : '咨询师'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-ivory/50 hover:text-rose-gold/70 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-deep-space-dark/30 border-b border-rose-gold/10 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <h2 className="font-serif text-xl text-ivory/80 tracking-wider">
              {menuItems.find(m => m.path === location.pathname)?.label || '系统设置'}
            </h2>
            <div className="flex items-center gap-4 text-ivory/40 text-sm">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-matcha animate-pulse-soft" />
                等候 {waitingQueue.length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-gold animate-pulse-soft" />
                服务中 {inServiceEntries.length}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/reception"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-ivory/50 hover:text-rose-gold/70 transition-colors text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              <span>接待屏</span>
            </a>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-ivory/50 hover:text-ivory transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-gold text-deep-space text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-deep-space-light border border-rose-gold/20 rounded-xl shadow-luxury z-50 overflow-hidden animate-fade-in">
                  <div className="p-4 border-b border-rose-gold/10">
                    <h3 className="font-serif text-ivory/80">通知中心</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-ivory/40 text-sm">
                        暂无通知
                      </div>
                    ) : (
                      notifications.slice(0, 10).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markNotificationRead(notification.id)}
                          className={`p-4 border-b border-rose-gold/5 hover:bg-deep-space-dark/50 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-rose-gold/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationTypeColor(notification.type)}`} />
                            <div className="flex-1">
                              <p className="text-ivory/80 text-sm">{notification.message}</p>
                              <p className="text-ivory/40 text-xs mt-1">
                                {format(notification.timestamp, 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="text-ivory/50 text-sm font-light">
              {format(new Date(), 'yyyy-MM-dd HH:mm')}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
