
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Habit, HabitRecord, HabitType, ReminderType, ReminderScheduleType, Reminder } from './types';
import { loadState, saveState } from './store';
import { getTodayDate, calculateStreak, isHabitDue, formatDate } from './utils/dateUtils';
import { NAV_ITEMS, HABIT_ICONS } from './constants';
import HabitCard from './components/HabitCard';
import HabitForm from './components/HabitForm';
import Heatmap from './components/Heatmap';
import ReminderOverlay from './components/ReminderOverlay';
import { Plus, Flame, ChevronRight, Activity, Moon, Sun, Download, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState('today');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
  // Reminder State
  const [activeReminder, setActiveReminder] = useState<Habit | null>(null);
  const triggeredToday = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveState(state);
    if (state.settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.settings.darkMode, state]);

  // Reminder Logic Loop
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentHM = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const today = getTodayDate();
      const currentDayOfWeek = now.getDay();

      state.habits.forEach(habit => {
        habit.reminders.forEach(reminder => {
          if (!reminder.isEnabled || reminder.time !== currentHM) return;
          
          let shouldTrigger = false;

          if (reminder.scheduleType === ReminderScheduleType.ALWAYS) {
            if (isHabitDue(habit, today)) shouldTrigger = true;
          }
          else if (reminder.scheduleType === ReminderScheduleType.SPECIFIC_DAYS) {
            if (reminder.specificDays?.includes(currentDayOfWeek)) {
               shouldTrigger = true;
            }
          }
          else if (reminder.scheduleType === ReminderScheduleType.DAYS_BEFORE) {
            const nextCheckDate = new Date(now);
            nextCheckDate.setDate(now.getDate() + (reminder.daysBefore || 0));
            if (isHabitDue(habit, formatDate(nextCheckDate))) {
              shouldTrigger = true;
            }
          }

          if (shouldTrigger) {
            const triggerKey = `${habit.id}-${reminder.id}-${today}`;
            if (triggeredToday.current.has(triggerKey)) return;

            if (reminder.type === ReminderType.ALARM) {
              setActiveReminder(habit);
            } else if (reminder.type === ReminderType.NOTIFICATION) {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`HabitNexus: ${habit.name}`, {
                  body: `Your habit window is open. Stay consistent!`,
                  icon: '/favicon.ico'
                });
              } else {
                setActiveReminder(habit);
              }
            }
            triggeredToday.current.add(triggerKey);
          }
        });
      });
    };

    const interval = setInterval(checkReminders, 10000); 
    return () => clearInterval(interval);
  }, [state.habits]);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const habitsDueToday = useMemo(() => {
    const today = getTodayDate();
    return state.habits.filter(h => isHabitDue(h, today));
  }, [state.habits]);

  const todayRecords = useMemo(() => {
    const today = getTodayDate();
    return state.records.filter(r => r.date === today);
  }, [state.records]);

  const stats = useMemo(() => {
    const completedCount = habitsDueToday.filter(h => {
      const rec = todayRecords.find(r => r.habitId === h.id);
      if (!rec) return false;
      // POMODORO and TIME both use targetValue logic
      return (h.type === HabitType.TIME || h.type === HabitType.POMODORO) ? rec.value >= h.targetValue : rec.value >= 1;
    }).length;

    const totalCount = habitsDueToday.length;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return { completedCount, totalCount, percentage };
  }, [habitsDueToday, todayRecords]);

  const handleUpdateRecord = (habitId: string, value: number) => {
    const today = getTodayDate();
    setState(prev => {
      const existing = prev.records.findIndex(r => r.habitId === habitId && r.date === today);
      const newRecords = [...prev.records];
      if (existing >= 0) {
        newRecords[existing] = { ...newRecords[existing], value };
      } else {
        newRecords.push({ habitId, date: today, value });
      }
      return { ...prev, records: newRecords };
    });
  };

  const handleSaveHabit = (habitData: Partial<Habit>) => {
    setState(prev => {
      if (editingHabit) {
        return {
          ...prev,
          habits: prev.habits.map(h => h.id === editingHabit.id ? { ...h, ...habitData } as Habit : h)
        };
      } else {
        const newHabit: Habit = {
          id: crypto.randomUUID(),
          name: habitData.name || 'New Goal',
          icon: habitData.icon || 'activity',
          color: habitData.color || '#3b82f6',
          type: habitData.type || HabitType.YES_NO,
          targetValue: habitData.targetValue || 1,
          frequency: habitData.frequency || { type: 'DAILY' as any },
          reminders: habitData.reminders || [],
          startDate: habitData.startDate || new Date().toISOString(),
          isArchived: false,
          isPaused: false,
          createdAt: Date.now(),
          ...habitData
        } as Habit;
        return { ...prev, habits: [...prev.habits, newHabit] };
      }
    });
    setIsAddingHabit(false);
    setEditingHabit(null);
  };

  const handleDeleteHabit = (id: string) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.filter(h => h.id !== id),
      records: prev.records.filter(r => r.habitId !== id)
    }));
    setIsAddingHabit(false);
    setEditingHabit(null);
  };

  const updateSettings = (updates: Partial<AppState['settings']>) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `habitnexus_backup_${getTodayDate()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative pb-24 overflow-x-hidden">
      {activeReminder && (
        <ReminderOverlay 
          habit={activeReminder}
          onComplete={() => {
            handleUpdateRecord(activeReminder.id, activeReminder.targetValue || 1);
            setActiveReminder(null);
          }}
          onSnooze={() => {
            const snoozeTime = new Date(Date.now() + 5 * 60000);
            const hm = `${snoozeTime.getHours().toString().padStart(2, '0')}:${snoozeTime.getMinutes().toString().padStart(2, '0')}`;
            const snoozeReminder: Reminder = { 
              id: 'snooze-' + Date.now(), 
              time: hm, 
              type: ReminderType.ALARM, 
              isEnabled: true,
              scheduleType: ReminderScheduleType.ALWAYS
            };
            setState(prev => ({
              ...prev,
              habits: prev.habits.map(h => h.id === activeReminder.id ? { ...h, reminders: [...h.reminders, snoozeReminder] } : h)
            }));
            setActiveReminder(null);
          }}
          onDismiss={() => setActiveReminder(null)}
        />
      )}

      <header className="px-6 py-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-end border-b border-slate-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none mb-1">HABITNEXUS</h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.3em]">
            {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
          </p>
        </div>
        <button 
          onClick={() => { setEditingHabit(null); setIsAddingHabit(true); }}
          className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/20 active:scale-90 transition-all hover:bg-blue-700"
        >
          <Plus className="w-7 h-7" />
        </button>
      </header>

      <main className="flex-1 p-5 space-y-8 overflow-y-auto custom-scrollbar">
        {activeTab === 'today' && (
          <>
            <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Current Momentum</span>
                    <h2 className="text-5xl font-black tracking-tighter mt-1">{stats.percentage}%</h2>
                  </div>
                  <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>
                <div className="w-full bg-white/10 h-4 rounded-full mb-4 shadow-inner">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: `${stats.percentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Progress Log</span>
                  <span>{stats.completedCount} / {stats.totalCount} Success</span>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            </div>

            <section className="space-y-4">
              <h3 className="font-black text-slate-400 dark:text-slate-600 uppercase text-[10px] tracking-[0.4em] px-3">Primary Routine</h3>
              
              {habitsDueToday.length > 0 ? (
                habitsDueToday.map(habit => (
                  <HabitCard 
                    key={habit.id}
                    habit={habit}
                    record={todayRecords.find(r => r.habitId === habit.id)}
                    onUpdate={(val) => handleUpdateRecord(habit.id, val)}
                    streak={calculateStreak(habit.id, state.records, state.habits).current}
                  />
                ))
              ) : (
                <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 p-16 rounded-[3rem] text-center">
                  <p className="text-slate-300 dark:text-slate-700 font-black text-xs mb-8 uppercase tracking-widest leading-relaxed">No protocols scheduled<br/>for this cycle.</p>
                  <button 
                    onClick={() => { setEditingHabit(null); setIsAddingHabit(true); }}
                    className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em] bg-blue-50 dark:bg-blue-900/20 px-8 py-4 rounded-2xl hover:bg-blue-100 transition-all active:scale-95"
                  >
                    Deploy New protocol
                  </button>
                </div>
              )}
            </section>
          </>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter px-2">Protocols</h2>
            <div className="grid gap-4">
              {state.habits.map(habit => {
                const IconComp = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || <Activity className="w-5 h-5" />;
                return (
                  <button 
                    key={habit.id} 
                    onClick={() => { setEditingHabit(habit); setIsAddingHabit(true); }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left hover:border-blue-400 dark:hover:border-blue-800/50 transition-all active:scale-[0.98] shadow-sm group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-105" style={{ backgroundColor: habit.color }}>
                        {IconComp}
                      </div>
                      <div>
                        <h4 className="font-black text-xl dark:text-slate-200 tracking-tight mb-1">{habit.name}</h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-[0.3em]">{habit.frequency.type}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-blue-500 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter px-2">Insight</h2>
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-slate-400 dark:text-slate-600 mb-8 flex items-center gap-4 uppercase text-[10px] tracking-[0.4em]">
                <Flame className="w-6 h-6 text-orange-500" /> Persistence Grid
              </h3>
              <Heatmap records={state.records} color="#3b82f6" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Total Hits</span>
                 <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{state.records.length}</span>
               </div>
               <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                 <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Protocol Count</span>
                 <span className="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tighter">{state.habits.length}</span>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-8">
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter px-2">Environment</h2>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
              <button 
                onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-50 dark:border-slate-800/50 last:border-0 transition-colors"
              >
                <div className="flex items-center gap-5 text-slate-700 dark:text-slate-200">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                    {state.settings.darkMode ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-blue-500" />}
                  </div>
                  <span className="font-black text-lg tracking-tight">Interface Theme</span>
                </div>
                <div className={`w-14 h-7 rounded-full p-1.5 transition-colors shadow-inner ${state.settings.darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${state.settings.darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
                </div>
              </button>
              <button onClick={handleExportData} className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-5 text-slate-700 dark:text-slate-200">
                  <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner">
                    <Download className="w-6 h-6 text-emerald-500" />
                  </div>
                  <span className="font-black text-lg tracking-tight">Backup Protocols</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-200" />
              </button>
            </div>
            
            <button 
              onClick={() => { if(confirm('Erase all session data?')) { localStorage.clear(); window.location.reload(); } }}
              className="w-full p-6 flex items-center gap-5 text-red-500 font-black text-sm bg-red-50 dark:bg-red-900/10 rounded-[2.5rem] border border-red-100 dark:border-red-900/20 active:scale-95 transition-all"
            >
              <Trash2 className="w-6 h-6" /> System Wipe
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 px-10 py-5 flex justify-between items-center max-w-md mx-auto z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {NAV_ITEMS.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeTab === item.id ? 'text-blue-600 -translate-y-1 scale-110' : 'text-slate-400 dark:text-slate-600 hover:text-slate-600'}`}
          >
            <span className={`${activeTab === item.id ? 'text-blue-600' : 'text-slate-400 dark:text-slate-600'}`}>
              {/* Fix: cast element to any to avoid strict type check on cloneElement props */}
              {React.cloneElement(item.icon as React.ReactElement<any>, { size: 26, strokeWidth: activeTab === item.id ? 2.5 : 2 })}
            </span>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {isAddingHabit && (
        <HabitForm 
          onSave={handleSaveHabit} 
          onDelete={editingHabit ? () => handleDeleteHabit(editingHabit.id) : undefined}
          onClose={() => { setIsAddingHabit(false); setEditingHabit(null); }} 
          initialData={editingHabit || undefined}
        />
      )}
    </div>
  );
};

export default App;
