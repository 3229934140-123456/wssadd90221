import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAppStore } from '@/store';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAppStore();

  const from = (location.state as { from?: string })?.from || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (login(username, password)) {
      navigate(from, { replace: true });
    } else {
      setError('用户名或密码错误');
    }
  };

  const handleQuickLogin = (role: string) => {
    const credentials: Record<string, { username: string; password: string }> = {
      admin: { username: 'admin', password: '123456' },
      reception: { username: 'reception', password: '123456' },
      consultant: { username: 'consultant1', password: '123456' },
    };
    setUsername(credentials[role].username);
    setPassword(credentials[role].password);
  };

  return (
    <div className="min-h-screen bg-deep-space flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-noise pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-warm-gold/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-rose-gold" />
            <h1 className="font-serif text-4xl font-light tracking-[0.2em] gold-text text-shadow-gold">
              臻颜医美
            </h1>
          </div>
          <p className="text-ivory/50 text-sm tracking-widest font-light">
            内部管理系统
          </p>
        </div>

        <div className="luxury-card p-8 gradient-border">
          <h2 className="font-serif text-2xl text-ivory/90 text-center mb-8 tracking-wider">
            系统登录
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-ivory/70 text-sm mb-2 font-light tracking-wider">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-gold/50" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="luxury-input pl-12"
                />
              </div>
            </div>

            <div>
              <label className="block text-ivory/70 text-sm mb-2 font-light tracking-wider">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-gold/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="luxury-input pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-gold/50 hover:text-rose-gold transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-rose-400 text-sm text-center animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full luxury-button-primary py-4 text-lg"
            >
              登录系统
            </button>
          </form>

          <div className="mt-8">
            <div className="divider mb-6" />
            <p className="text-center text-ivory/40 text-xs mb-4 tracking-wider">
              快捷登录（演示用）
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 border border-rose-gold/30 rounded-lg text-rose-gold/70 text-xs hover:bg-rose-gold/10 hover:border-rose-gold/50 transition-all"
              >
                管理员
              </button>
              <button
                onClick={() => handleQuickLogin('reception')}
                className="py-2 px-3 border border-rose-gold/30 rounded-lg text-rose-gold/70 text-xs hover:bg-rose-gold/10 hover:border-rose-gold/50 transition-all"
              >
                前台管家
              </button>
              <button
                onClick={() => handleQuickLogin('consultant')}
                className="py-2 px-3 border border-rose-gold/30 rounded-lg text-rose-gold/70 text-xs hover:bg-rose-gold/10 hover:border-rose-gold/50 transition-all"
              >
                咨询师
              </button>
            </div>
            <p className="text-center text-ivory/30 text-xs mt-4">
              默认密码：123456
            </p>
          </div>
        </div>

        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/reception')}
            className="text-ivory/40 text-sm hover:text-rose-gold/70 transition-colors font-light tracking-wider"
          >
            → 进入接待区展示屏
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
