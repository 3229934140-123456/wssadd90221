import { useState, useEffect } from 'react';
import { DoorOpen, Clock, Sparkles, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { format } from 'date-fns';
import type { RoomStatus } from '@/types';

const RoomManagement = () => {
  const { rooms, updateRoomStatus, getInServiceEntries, getCustomerById, getRoomById } = useAppStore();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      rooms.forEach(room => {
        if (room.status === 'CLEANING' && room.cleaningProgress < 100) {
          const newProgress = Math.min(100, room.cleaningProgress + 5);
          updateRoomStatus(room.id, 'CLEANING', newProgress);
          if (newProgress >= 100) {
            updateRoomStatus(room.id, 'IDLE', 100);
          }
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [rooms, updateRoomStatus]);

  const inServiceEntries = getInServiceEntries();

  const getRoomStatusConfig = (status: RoomStatus) => {
    const config: Record<RoomStatus, { color: string; bgColor: string; text: string; dotColor: string }> = {
      IDLE: { color: 'text-matcha', bgColor: 'bg-matcha/10', text: '空闲', dotColor: 'bg-matcha' },
      IN_USE: { color: 'text-rose-gold', bgColor: 'bg-rose-gold/10', text: '使用中', dotColor: 'bg-rose-gold' },
      CLEANING: { color: 'text-slate-blue', bgColor: 'bg-slate-blue/10', text: '清洁中', dotColor: 'bg-slate-blue' },
      DOCTOR_PENDING: { color: 'text-warm-gold', bgColor: 'bg-warm-gold/10', text: '医生待入场', dotColor: 'bg-warm-gold' },
    };
    return config[status];
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'VIP': return 'VIP 包间';
      case 'SURGICAL': return '手术室';
      default: return '标准包间';
    }
  };

  const handleStatusChange = (roomId: string, status: RoomStatus) => {
    updateRoomStatus(roomId, status, status === 'CLEANING' ? 0 : 100);
    setSelectedRoom(null);
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-3 gap-6 mb-8">
        {rooms.map((room, index) => {
          const statusConfig = getRoomStatusConfig(room.status);
          const entry = inServiceEntries.find(e => e.roomId === room.id);
          const customer = entry ? getCustomerById(entry.customerId) : null;
          const isSelected = selectedRoom === room.id;

          return (
            <div
              key={room.id}
              className={`luxury-card p-6 gradient-border cursor-pointer transition-all duration-300 animate-slide-up ${
                isSelected ? 'ring-2 ring-rose-gold/50 shadow-luxury' : ''
              }`}
              style={{ animationDelay: `${0.1 * index}s` }}
              onClick={() => setSelectedRoom(isSelected ? null : room.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DoorOpen className={`w-5 h-5 ${statusConfig.color}`} />
                    <h4 className="font-serif text-xl text-ivory/90">{room.name}</h4>
                  </div>
                  <p className="text-ivory/40 text-sm">{getRoomTypeLabel(room.type)}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${statusConfig.bgColor} ${statusConfig.color}`}>
                  {statusConfig.text}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className={`w-2 h-2 rounded-full ${statusConfig.dotColor} animate-pulse-soft`} />
                <span className="text-ivory/50 text-sm">{statusConfig.text}</span>
              </div>

              {room.status === 'CLEANING' && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-ivory/50 mb-2">
                    <span>清洁进度</span>
                    <span>{room.cleaningProgress}%</span>
                  </div>
                  <div className="h-2 bg-deep-space-dark rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-slate-blue to-matcha transition-all duration-500"
                      style={{ width: `${room.cleaningProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {room.status === 'IN_USE' && customer && (
                <div className="p-3 bg-deep-space-dark/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-rose-gold/70" />
                    <span className="text-ivory/80 text-sm">{customer.codeName}</span>
                  </div>
                  <p className="text-ivory/40 text-xs">
                    开始 {format(entry!.checkinTime, 'HH:mm')}
                  </p>
                </div>
              )}

              {room.status === 'DOCTOR_PENDING' && (
                <div className="p-3 bg-warm-gold/10 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-warm-gold" />
                  <span className="text-warm-gold text-sm">等待医生入场</span>
                </div>
              )}

              {room.status === 'IDLE' && (
                <div className="p-3 bg-matcha/10 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-matcha" />
                  <span className="text-matcha text-sm">可立即使用</span>
                </div>
              )}

              {room.estimatedFreeTime && room.status !== 'IDLE' && (
                <div className="flex items-center gap-1 mt-3 text-ivory/40 text-xs">
                  <Clock className="w-3 h-3" />
                  <span>预计 {format(room.estimatedFreeTime, 'HH:mm')} 空闲</span>
                </div>
              )}

              {isSelected && (
                <div className="mt-4 pt-4 border-t border-rose-gold/10 animate-fade-in">
                  <p className="text-ivory/40 text-xs mb-3">更新状态</p>
                  <div className="grid grid-cols-4 gap-2">
                    {(['IDLE', 'IN_USE', 'CLEANING', 'DOCTOR_PENDING'] as RoomStatus[]).map(status => {
                      const config = getRoomStatusConfig(status);
                      return (
                        <button
                          key={status}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(room.id, status);
                          }}
                          className={`px-2 py-2 rounded-lg text-xs transition-all ${
                            room.status === status
                              ? `${config.bgColor} ${config.color} border border-current`
                              : 'bg-deep-space-dark/50 text-ivory/50 hover:text-ivory'
                          }`}
                        >
                          {config.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="luxury-card p-6 gradient-border animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="font-serif text-lg text-ivory/80 tracking-wider mb-6">使用状态说明</h3>
        <div className="grid grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-matcha animate-pulse-soft" />
            <div>
              <p className="text-ivory/80">空闲</p>
              <p className="text-ivory/40 text-xs">可分配使用</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-rose-gold animate-pulse-soft" />
            <div>
              <p className="text-ivory/80">使用中</p>
              <p className="text-ivory/40 text-xs">正在接待顾客</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-slate-blue animate-pulse-soft" />
            <div>
              <p className="text-ivory/80">清洁中</p>
              <p className="text-ivory/40 text-xs">消毒清洁准备</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-warm-gold animate-pulse-soft" />
            <div>
              <p className="text-ivory/80">医生待入场</p>
              <p className="text-ivory/40 text-xs">等待医生到达</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;
