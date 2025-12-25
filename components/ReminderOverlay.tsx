
import React, { useEffect, useState } from 'react';
import { Habit } from '../types';
import { HABIT_ICONS } from '../constants';
import { Bell, Check, X, Clock, AlertCircle } from 'lucide-react';

interface ReminderOverlayProps {
  habit: Habit;
  onComplete: () => void;
  onSnooze: () => void;
  onDismiss: () => void;
}

const ReminderOverlay: React.FC<ReminderOverlayProps> = ({ habit, onComplete, onSnooze, onDismiss }) => {
  const IconComp = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || <Bell />;
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between p-10 overflow-hidden text-white animate-in fade-in duration-700">
      {/* Dynamic Animated Background */}
      <div 
        className="absolute inset-0 z-[-1] transition-colors duration-1000 opacity-90"
        style={{ 
          background: `radial-gradient(circle at center, ${habit.color}dd 0%, #020617 100%)` 
        }}
      />
      <div className="absolute inset-0 z-[-1] opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
      
      {/* Pulsing Aura */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-[120px] animate-pulse pointer-events-none"
        style={{ backgroundColor: habit.color }}
      />

      {/* Top Section: Time and Type */}
      <div className="mt-12 text-center space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10">
          <AlertCircle className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-black uppercase tracking-[0.2em]">{habit.type} Goal</span>
        </div>
        <h2 className="text-6xl font-black tracking-tighter opacity-80">{currentTime}</h2>
      </div>

      {/* Center Section: Icon and Habit Name */}
      <div className="flex flex-col items-center space-y-8 relative z-10 w-full max-w-xs">
        <div 
          className="w-40 h-40 rounded-[2.5rem] flex items-center justify-center relative shadow-2xl transition-transform hover:scale-105 group"
          style={{ backgroundColor: habit.color }}
        >
          {/* Animated rings */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-white opacity-20 animate-ping" />
          <div className="absolute inset-[-10px] rounded-[3rem] border-2 border-white/20 animate-[spin_10s_linear_infinite]" />
          
          <div className="scale-[3] text-white drop-shadow-lg group-hover:rotate-12 transition-transform duration-300">
            {IconComp}
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight drop-shadow-md uppercase">
            {habit.name}
          </h1>
          <p className="text-white/60 font-medium text-lg italic">
            "Your future is created by what you do today."
          </p>
        </div>
      </div>

      {/* Bottom Section: Actions */}
      <div className="w-full max-w-sm space-y-4 mb-8 relative z-10 px-4">
        <button 
          onClick={onComplete}
          className="w-full py-6 bg-white text-slate-950 font-black rounded-3xl shadow-2xl flex items-center justify-center gap-3 transition-all hover:bg-slate-100 active:scale-95 group overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-green-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <Check className="w-7 h-7 text-green-600" /> 
          <span className="text-xl">I'm Doing It!</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onSnooze}
            className="py-5 bg-white/10 backdrop-blur-2xl hover:bg-white/20 text-white font-bold rounded-[1.5rem] flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-95"
          >
            <Clock className="w-5 h-5" /> 5m Snooze
          </button>
          <button 
            onClick={onDismiss}
            className="py-5 bg-white/10 backdrop-blur-2xl hover:bg-white/20 text-white/50 font-bold rounded-[1.5rem] flex items-center justify-center gap-2 border border-white/5 transition-all active:scale-95"
          >
            <X className="w-5 h-5" /> Dismiss
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />
    </div>
  );
};

export default ReminderOverlay;
