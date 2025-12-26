
import React, { useState, useEffect, useRef } from 'react';
import { Habit, HabitType, HabitRecord, Category } from '../types';
import { HABIT_ICONS } from '../constants';
import { Check, Trophy, Play, Pause, RotateCcw, Coffee, Zap, FastForward } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  record?: HabitRecord;
  onUpdate: (value: number) => void;
  onToggleSkip: () => void;
  streak: number;
  categories: Category[];
}

enum PomoStatus {
  IDLE = 'IDLE',
  WORK = 'WORK',
  BREAK = 'BREAK'
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, record, onUpdate, onToggleSkip, streak, categories }) => {
  const Icon = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || HABIT_ICONS[0].icon;
  const category = categories.find(c => c.id === habit.categoryId);
  const currentValue = record?.value || 0;
  const isSkipped = record?.isSkipped || false;
  
  const isCompleted = habit.type === HabitType.TIME 
    ? currentValue >= habit.targetValue 
    : habit.type === HabitType.POMODORO 
    ? currentValue >= habit.targetValue 
    : currentValue >= 1;

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const prevCompletedRef = useRef(isCompleted);
  
  // Timer States
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomoStatus, setPomoStatus] = useState<PomoStatus>(PomoStatus.IDLE);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isCompleted && !prevCompletedRef.current) {
      setShouldAnimate(true);
      const timer = setTimeout(() => setShouldAnimate(false), 500);
      return () => clearTimeout(timer);
    }
    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  // Logic for YES_NO and TIME (Simple countdown/accumulated timer)
  useEffect(() => {
    if (isTimerRunning && habit.type === HabitType.TIME && !isCompleted && !isSkipped) {
      timerRef.current = window.setInterval(() => {
        onUpdate(currentValue + 1);
      }, 1000);
    } else if (habit.type !== HabitType.POMODORO) {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, currentValue, habit.type, isCompleted, isSkipped, onUpdate]);

  // Logic for POMODORO Engine
  useEffect(() => {
    if (isTimerRunning && habit.type === HabitType.POMODORO && !isSkipped) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning, pomoStatus, habit.type, isSkipped]);

  const handlePhaseComplete = () => {
    setIsTimerRunning(false);
    if (pomoStatus === PomoStatus.WORK) {
      onUpdate(currentValue + 1);
      if (habit.pomodoroConfig) {
        setPomoStatus(PomoStatus.BREAK);
        setTimeLeft(habit.pomodoroConfig.breakDuration);
        setIsTimerRunning(true);
      }
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Work Phase Complete!", { body: `Great job on ${habit.name}. Time for a break.` });
      }
    } else if (pomoStatus === PomoStatus.BREAK) {
      setPomoStatus(PomoStatus.IDLE);
      setTimeLeft(0);
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Break's Over!", { body: "Ready to jump back into focus?" });
      }
    }
  };

  const startPomo = () => {
    if (habit.pomodoroConfig && !isSkipped) {
      setPomoStatus(PomoStatus.WORK);
      setTimeLeft(habit.pomodoroConfig.workDuration);
      setIsTimerRunning(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const renderProgress = () => {
    if (isSkipped) return null;

    if (habit.type === HabitType.TIME) {
      const remaining = Math.max(0, habit.targetValue - currentValue);
      return (
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 animate-in fade-in">
          <div className="flex justify-between text-[9px] text-slate-400 mb-2 uppercase tracking-[0.2em] font-black">
            <span>{isCompleted ? 'Goal Achieved' : 'Time Remaining'}</span>
            <span>{formatTime(isCompleted ? currentValue : remaining)}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${Math.min(100, (currentValue / habit.targetValue) * 100)}%`, backgroundColor: isCompleted ? '#22c55e' : habit.color }} />
          </div>
        </div>
      );
    }

    if (habit.type === HabitType.POMODORO) {
      return (
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 animate-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-1">
              {Array.from({ length: habit.targetValue }).map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-500 ${i < currentValue ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-slate-100 dark:bg-slate-800'}`} />
              ))}
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentValue} / {habit.targetValue} Sessions</span>
          </div>

          {pomoStatus !== PomoStatus.IDLE && (
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${pomoStatus === PomoStatus.WORK ? 'bg-orange-500 text-white animate-pulse' : 'bg-emerald-500 text-white'}`}>
                  {pomoStatus === PomoStatus.WORK ? <Zap className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{pomoStatus} Phase</h4>
                  <p className="text-lg font-black dark:text-slate-100 leading-none">{formatTime(timeLeft)}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-transform"
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`p-5 rounded-[2.5rem] bg-white dark:bg-slate-900 border transition-all duration-300 relative overflow-hidden ${shouldAnimate ? 'animate-pop' : ''} ${isSkipped ? 'opacity-60 grayscale-[0.5] border-slate-100' : isCompleted ? 'border-green-200 dark:border-green-900 shadow-lg shadow-green-50' : 'border-slate-200 dark:border-slate-800'}`}>
      {isSkipped && (
        <div className="absolute top-2 right-12 text-[8px] font-black text-slate-400 uppercase tracking-widest pointer-events-none select-none">
          Skip active
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl" style={{ backgroundColor: isSkipped ? '#94a3b8' : habit.color, transform: isCompleted && !isSkipped ? 'rotate(360deg)' : 'none' }}>
            {Icon}
          </div>
          <div>
            {category && (
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSkipped ? '#94a3b8' : category.color }} />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">{category.name}</span>
              </div>
            )}
            <h3 className={`font-black tracking-tight ${isCompleted || isSkipped ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>{habit.name}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
              <Trophy className="w-3 h-3 text-amber-500" />
              <span>{streak} day streak</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCompleted && !isSkipped && (
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleSkip(); }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-slate-500 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              title="Skip for today"
            >
              <FastForward className="w-5 h-5" />
            </button>
          )}

          {isSkipped ? (
            <button 
              onClick={onToggleSkip}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
            >
              Resume
            </button>
          ) : habit.type === HabitType.POMODORO ? (
            <div className="flex items-center gap-2">
              {!isCompleted && pomoStatus === PomoStatus.IDLE && (
                <button onClick={startPomo} className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl active:scale-95 transition-all">
                  <Play className="w-6 h-6 ml-1" />
                </button>
              )}
              {pomoStatus !== PomoStatus.IDLE && (
                <button onClick={() => { setIsTimerRunning(false); setPomoStatus(PomoStatus.IDLE); setTimeLeft(0); }} className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-95 transition-all">
                  <RotateCcw className="w-6 h-6" />
                </button>
              )}
              {isCompleted && <div className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg"><Check className="w-7 h-7" strokeWidth={4} /></div>}
            </div>
          ) : habit.type === HabitType.TIME ? (
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${isTimerRunning ? 'bg-orange-500 text-white animate-pulse' : isCompleted ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'}`}>
              {isCompleted ? <Check className="w-7 h-7" strokeWidth={4} /> : isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
          ) : (
            <button onClick={() => onUpdate(isCompleted ? 0 : 1)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-95 ${isCompleted ? 'bg-green-500 text-white shadow-xl' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              <Check className={`transition-all ${isCompleted ? 'w-7 h-7 scale-110' : 'w-6 h-6'}`} strokeWidth={4} />
            </button>
          )}
        </div>
      </div>

      {renderProgress()}
    </div>
  );
};

export default HabitCard;
