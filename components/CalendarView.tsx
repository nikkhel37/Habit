
import React, { useState, useMemo } from 'react';
import { Habit, HabitRecord, HabitType } from '../types';
import { ChevronLeft, ChevronRight, Filter, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarViewProps {
  habits: Habit[];
  records: HabitRecord[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ habits, records }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string | 'all'>('all');

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const monthYearLabel = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const calendarData = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    
    const days = [];
    // Padding for previous month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);

  const getStatus = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.date === dateStr);
    
    if (selectedHabitId === 'all') {
      const completed = dayRecords.filter(r => {
        const h = habits.find(hab => hab.id === r.habitId);
        if (!h) return false;
        return r.value >= (h.type === HabitType.YES_NO ? 1 : h.targetValue);
      }).length;
      
      if (completed === 0) return 'none';
      if (completed >= habits.length && habits.length > 0) return 'full';
      return 'partial';
    } else {
      const record = dayRecords.find(r => r.habitId === selectedHabitId);
      const habit = habits.find(h => h.id === selectedHabitId);
      if (!record || !habit) return 'none';
      if (record.isSkipped) return 'skipped';
      return record.value >= (habit.type === HabitType.YES_NO ? 1 : habit.targetValue) ? 'full' : 'partial';
    }
  };

  const activeHabit = habits.find(h => h.id === selectedHabitId);
  const themeColor = activeHabit ? activeHabit.color : '#3b82f6';

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + direction)));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      {/* Header & Filter */}
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="font-black text-xl tracking-tight text-slate-800 dark:text-slate-100 uppercase">{monthYearLabel}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-400" />
            </button>
            <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ChevronRight className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            <Filter className="w-4 h-4" />
          </div>
          <select 
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-none outline-none font-black text-[10px] uppercase tracking-widest text-slate-500 appearance-none cursor-pointer focus:ring-2 ring-blue-500/20"
          >
            <option value="all">Overall Protocol Performance</option>
            {habits.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarData.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="aspect-square" />;
            
            const status = getStatus(date);
            const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            
            let bgStyle = {};
            let textClass = "text-slate-600 dark:text-slate-400";
            
            if (status === 'full') {
              bgStyle = { backgroundColor: themeColor };
              textClass = "text-white";
            } else if (status === 'partial') {
              bgStyle = { backgroundColor: themeColor + '33' }; // 20% opacity
              textClass = activeHabit ? "text-slate-800 dark:text-slate-200" : "text-blue-600";
            } else if (status === 'skipped') {
              bgStyle = { backgroundColor: '#94a3b833' };
              textClass = "text-slate-400";
            }

            return (
              <div 
                key={date.getTime()}
                className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300 border ${isToday ? 'ring-2 ring-blue-500/50 ring-offset-2 dark:ring-offset-slate-900 border-blue-200' : 'border-transparent'}`}
                style={bgStyle}
              >
                <span className={`text-xs font-black ${textClass}`}>{date.getDate()}</span>
                {status === 'skipped' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-slate-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md" style={{ backgroundColor: themeColor }} />
          <span>Complete</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md border border-slate-200" style={{ backgroundColor: themeColor + '33' }} />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-md bg-slate-200 dark:bg-slate-700" />
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
