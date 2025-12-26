
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppState, Habit, HabitRecord, HabitType, ReminderType, ReminderScheduleType, Reminder } from './types';
import { loadState, saveState } from './store';
import { getTodayDate, calculateStreak, isHabitDue, formatDate } from './utils/dateUtils';
import { NAV_ITEMS, HABIT_ICONS } from './constants';
import HabitCard from './components/HabitCard';
import HabitForm from './components/HabitForm';
import Heatmap from './components/Heatmap';
import CalendarView from './components/CalendarView';
import ReminderOverlay from './components/ReminderOverlay';
import { 
  Plus, 
  ChevronRight, 
  Activity, 
  Moon, 
  Sun, 
  Download, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  Zap, 
  Layout, 
  Flame, 
  Award, 
  BarChart3, 
  Clock, 
  ShieldCheck, 
  Database,
  Info,
  Monitor
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(loadState());
  const [activeTab, setActiveTab] = useState('today');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  
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

  const handleUpdateRecord = (habitId: string, value: number) => {
    const today = getTodayDate();
    setState(prev => {
      const existingIdx = prev.records.findIndex(r => r.habitId === habitId && r.date === today);
      const newRecords = [...prev.records];
      
      if (existingIdx >= 0) {
        newRecords[existingIdx] = { ...newRecords[existingIdx], value, isSkipped: false };
      } else {
        newRecords.push({ habitId, date: today, value, isSkipped: false });
      }
      
      return { ...prev, records: newRecords };
    });
  };

  const handleToggleSkip = (habitId: string) => {
    const today = getTodayDate();
    setState(prev => {
      const existingIdx = prev.records.findIndex(r => r.habitId === habitId && r.date === today);
      const newRecords = [...prev.records];
      
      if (existingIdx >= 0) {
        const currentlySkipped = !!newRecords[existingIdx].isSkipped;
        newRecords[existingIdx] = { ...newRecords[existingIdx], isSkipped: !currentlySkipped, value: 0 };
      } else {
        newRecords.push({ habitId, date: today, value: 0, isSkipped: true });
      }
      
      return { ...prev, records: newRecords };
    });
  };

  const habitsDueToday = useMemo(() => {
    const today = getTodayDate();
    return state.habits.filter(h => isHabitDue(h, today));
  }, [state.habits]);

  const todayRecords = useMemo(() => {
    const today = getTodayDate();
    return state.records.filter(r => r.date === today);
  }, [state.records]);

  const dailyStats = useMemo(() => {
    const completedCount = habitsDueToday.filter(h => {
      const rec = todayRecords.find(r => r.habitId === h.id);
      if (!rec) return false;
      return (h.type === HabitType.TIME || h.type === HabitType.COUNT) ? rec.value >= h.targetValue : rec.value >= 1;
    }).length;
    const totalCount = habitsDueToday.length;
    return { 
      completedCount, 
      totalCount, 
      percentage: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0 
    };
  }, [habitsDueToday, todayRecords]);

  const globalStats = useMemo(() => {
    const streakData = state.habits.map(h => ({
      habit: h,
      streak: calculateStreak(h.id, state.records, state.habits)
    }));
    
    const bestStreak = streakData.reduce((max, s) => Math.max(max, s.streak.longest), 0);
    const activeStreak = streakData.reduce((max, s) => Math.max(max, s.streak.current), 0);
    
    let totalPotential = 0;
    let actualDone = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = formatDate(d);
      state.habits.forEach(h => {
        if (isHabitDue(h, dStr)) {
          totalPotential++;
          const rec = state.records.find(r => r.habitId === h.id && r.date === dStr);
          const isDone = rec && ((h.type === HabitType.TIME || h.type === HabitType.COUNT) ? rec.value >= h.targetValue : rec.value >= 1);
          if (isDone) actualDone++;
        }
      });
    }

    return {
      weekPercentage: totalPotential > 0 ? Math.round((actualDone / totalPotential) * 100) : 0,
      activeCount: state.habits.filter(h => !h.isArchived).length,
      bestStreak,
      activeStreak,
      streakData: streakData.sort((a, b) => b.streak.current - a.streak.current),
      totalCompletions: state.records.filter(r => r.value > 0).length
    };
  }, [state.habits, state.records]);

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

  const renderStatsTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="px-2 flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">Insights</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">System Diagnostics</p>
        </div>
        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-sm">
          <BarChart3 className="w-6 h-6 text-blue-600" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 px-2">
        <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white shadow-xl shadow-blue-500/20 col-span-2 overflow-hidden relative group">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <span className="text-blue-100 text-[10px] font-black uppercase tracking-widest">Active Momentum</span>
              <h3 className="text-5xl font-black tracking-tighter mt-1">{globalStats.activeStreak}<span className="text-2xl ml-1">days</span></h3>
            </div>
            <Flame className="w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Record</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{globalStats.bestStreak}d</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-slate-400">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Score</span>
          </div>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{globalStats.weekPercentage}%</p>
        </div>
      </div>

      <section className="px-2 space-y-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight px-2">Temporal Analysis</h3>
        <CalendarView habits={state.habits} records={state.records} />
      </section>

      <section className="px-2 space-y-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight px-2">Protocol Streaks</h3>
        <div className="space-y-3">
          {globalStats.streakData.filter(s => !s.habit.isArchived).map(({ habit, streak }) => {
            const Icon = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || <Activity />;
            return (
              <div key={habit.id} className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm group hover:border-blue-500/30 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: habit.color }}>
                    {Icon}
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 tracking-tight">{habit.name}</h4>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Active Streak</p>
                  </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${streak.current > 0 ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                  {streak.isPending && <Clock className="w-3.5 h-3.5 animate-pulse" />}
                  <Flame className={`w-4 h-4 ${streak.current > 0 ? 'fill-orange-500' : ''}`} />
                  <span className="text-sm font-black tracking-tighter">{streak.current}d</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-2 space-y-4">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight px-2">High-Density Map</h3>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <Heatmap records={state.records} color="#3b82f6" />
        </div>
      </section>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="px-2">
        <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tighter">Environment</h2>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">System Configuration</p>
      </header>

      {/* Appearance Section */}
      <div className="px-2 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Display Logic</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={() => updateSettings({ darkMode: !state.settings.darkMode })}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-5 text-slate-700 dark:text-slate-200">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center">
                {state.settings.darkMode ? <Sun className="w-6 h-6 text-amber-500" /> : <Moon className="w-6 h-6 text-indigo-500" />}
              </div>
              <div className="text-left">
                <span className="font-black text-lg tracking-tight block">Interface Theme</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{state.settings.darkMode ? 'Matrix Dark' : 'Clean Light'}</span>
              </div>
            </div>
            <div className={`w-14 h-7 rounded-full p-1 transition-colors ${state.settings.darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${state.settings.darkMode ? 'translate-x-7' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Data Sovereignty Section */}
      <div className="px-2 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Data Protocol</h3>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
          <button 
            onClick={handleExportData}
            className="w-full p-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-50 dark:border-slate-800/50"
          >
            <div className="flex items-center gap-5 text-slate-700 dark:text-slate-200">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <span className="font-black text-lg tracking-tight block">Export Archive</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Download JSON Protocol</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
          
          <div className="p-6 flex items-center gap-5 text-slate-700 dark:text-slate-200 opacity-60">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="text-left">
              <span className="font-black text-lg tracking-tight block">Local Persistence</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Storage Status: Encrypted & Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Section */}
      <div className="px-2 space-y-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">System Core</h3>
        <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[3rem] text-white space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Core Version</p>
              <h4 className="text-2xl font-black tracking-tighter">v1.4.2-STABLE</h4>
            </div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/10 relative z-10">
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Habit Nodes</p>
              <p className="text-xl font-black tracking-tight">{state.habits.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Record Entities</p>
              <p className="text-xl font-black tracking-tight">{state.records.length}</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        </div>
      </div>

      <div className="px-8 text-center">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.4em]">Designed for Performance • Build 2024</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors relative pb-24 overflow-x-hidden">
      {activeReminder && (
        <ReminderOverlay 
          habit={activeReminder}
          onComplete={() => {
            handleUpdateRecord(activeReminder.id, activeReminder.targetValue || 1);
            setActiveReminder(null);
          }}
          onSnooze={() => setActiveReminder(null)}
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
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">Efficiency Quotient</span>
                    <h2 className="text-5xl font-black tracking-tighter mt-1">{dailyStats.percentage}%</h2>
                  </div>
                  <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                    <Activity className="w-7 h-7" />
                  </div>
                </div>
                <div className="w-full bg-white/10 h-4 rounded-full mb-4 shadow-inner">
                  <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.5)]" style={{ width: `${dailyStats.percentage}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <span>Progress Log</span>
                  <span>{dailyStats.completedCount} / {dailyStats.totalCount} Success</span>
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
                    onToggleSkip={() => handleToggleSkip(habit.id)}
                    streak={calculateStreak(habit.id, state.records, state.habits).current}
                    categories={state.categories}
                  />
                ))
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active protocols due today</p>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'habits' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tighter px-2">Protocols</h2>
            <div className="grid gap-4">
              {state.habits.map(habit => {
                const Icon = HABIT_ICONS.find(i => i.id === habit.icon)?.icon || <Activity />;
                return (
                  <button 
                    key={habit.id} 
                    onClick={() => { setEditingHabit(habit); setIsAddingHabit(true); }}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left hover:border-blue-400 transition-all active:scale-[0.98] shadow-sm group"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-xl" style={{ backgroundColor: habit.color }}>
                        {Icon}
                      </div>
                      <div>
                        <h4 className="font-black text-xl dark:text-slate-200 tracking-tight mb-1">{habit.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">{habit.frequency.type}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-200" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && renderStatsTab()}

        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 px-10 py-5 flex justify-between items-center max-w-md mx-auto z-40">
        {NAV_ITEMS.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center gap-2 transition-all ${activeTab === item.id ? 'text-blue-600 scale-110' : 'text-slate-400 dark:text-slate-600'}`}
          >
            {React.cloneElement(item.icon as React.ReactElement<any>, { size: 24, strokeWidth: activeTab === item.id ? 3 : 2 })}
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </nav>

      {isAddingHabit && (
        <HabitForm 
          onSave={(data) => {
            setState(prev => {
              if (editingHabit) return { ...prev, habits: prev.habits.map(h => h.id === editingHabit.id ? { ...h, ...data } as Habit : h) };
              return { ...prev, habits: [...prev.habits, { id: crypto.randomUUID(), createdAt: Date.now(), isArchived: false, isPaused: false, startDate: new Date().toISOString(), ...data } as Habit] };
            });
            setIsAddingHabit(false);
          }} 
          onDelete={editingHabit ? () => {
             setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== editingHabit.id) }));
             setIsAddingHabit(false);
          } : undefined}
          onClose={() => setIsAddingHabit(false)} 
          initialData={editingHabit || undefined}
        />
      )}
    </div>
  );
};

export default App;
