
import React, { useState, useEffect } from 'react';
import { Habit, HabitType, FrequencyType, Reminder, ReminderType, ReminderScheduleType, PomodoroConfig } from '../types';
import { HABIT_COLORS, HABIT_ICONS } from '../constants';
import { X, Check, Trash2, Bell, Clock, Plus, AlertCircle, Calendar, ChevronRight, Settings2, Timer, Zap, Coffee, ChevronDown, ChevronUp, Repeat } from 'lucide-react';

interface HabitFormProps {
  onSave: (habit: Partial<Habit>) => void;
  onDelete?: () => void;
  onClose: () => void;
  initialData?: Habit;
}

const HabitForm: React.FC<HabitFormProps> = ({ onSave, onDelete, onClose, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState<HabitType>(initialData?.type || HabitType.YES_NO);
  const [target, setTarget] = useState(initialData?.targetValue || 1);
  const [color, setColor] = useState(initialData?.color || HABIT_COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || HABIT_ICONS[0].id);
  
  // Frequency State
  const [freqType, setFreqType] = useState<FrequencyType>(initialData?.frequency.type || FrequencyType.DAILY);
  const [weekdays, setWeekdays] = useState<number[]>(initialData?.frequency.weekdays || [1, 2, 3, 4, 5]);
  const [interval, setIntervalDays] = useState<number>(initialData?.frequency.interval || 2);
  
  const [reminders, setReminders] = useState<Reminder[]>(initialData?.reminders || []);
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null);

  // Time-specific duration state
  const [durationHours, setDurationHours] = useState(Math.floor((initialData?.targetValue || 0) / 3600));
  const [durationMinutes, setDurationMinutes] = useState(Math.floor(((initialData?.targetValue || 0) % 3600) / 60));
  const [durationSeconds, setDurationSeconds] = useState((initialData?.targetValue || 0) % 60);

  // Pomodoro-specific state
  const [pomoWorkMins, setPomoWorkMins] = useState(initialData?.pomodoroConfig?.workDuration ? initialData.pomodoroConfig.workDuration / 60 : 25);
  const [pomoBreakMins, setPomoBreakMins] = useState(initialData?.pomodoroConfig?.breakDuration ? initialData.pomodoroConfig.breakDuration / 60 : 5);
  const [pomoSessionsTarget, setPomoSessionsTarget] = useState(initialData?.type === HabitType.POMODORO ? initialData.targetValue : 4);

  // Reminder Picker state
  const [newRemTime, setNewRemTime] = useState("12:00");
  const [newRemType, setNewRemType] = useState<ReminderType>(ReminderType.NOTIFICATION);
  const [newRemSchedule, setNewRemSchedule] = useState<ReminderScheduleType>(ReminderScheduleType.ALWAYS);
  const [newRemSpecificDays, setNewRemSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newRemDaysBefore, setNewRemDaysBefore] = useState(initialData?.reminders?.find(r => r.daysBefore)?.daysBefore || 1);

  // Sync Logic
  useEffect(() => {
    if (type === HabitType.TIME) {
      const totalSeconds = (durationHours * 3600) + (durationMinutes * 60) + durationSeconds;
      setTarget(totalSeconds || 60);
    } else if (type === HabitType.POMODORO) {
      setTarget(pomoSessionsTarget);
    } else {
      setTarget(1);
    }
  }, [durationHours, durationMinutes, durationSeconds, pomoSessionsTarget, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const pomodoroConfig: PomodoroConfig | undefined = type === HabitType.POMODORO ? {
      workDuration: pomoWorkMins * 60,
      breakDuration: pomoBreakMins * 60
    } : undefined;

    onSave({
      name: name.trim(),
      type,
      targetValue: target,
      color,
      icon,
      reminders,
      pomodoroConfig,
      frequency: {
        type: freqType,
        weekdays: freqType === FrequencyType.WEEKDAYS ? weekdays : undefined,
        interval: freqType === FrequencyType.INTERVAL ? interval : undefined,
      }
    });
  };

  const openReminderPicker = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminderId(reminder.id);
      setNewRemTime(reminder.time);
      setNewRemType(reminder.type);
      setNewRemSchedule(reminder.scheduleType);
      setNewRemSpecificDays(reminder.specificDays || [1, 2, 3, 4, 5]);
      setNewRemDaysBefore(reminder.daysBefore || 1);
    } else {
      setEditingReminderId(null);
      setNewRemTime("12:00");
      setNewRemType(ReminderType.NOTIFICATION);
      setNewRemSchedule(ReminderScheduleType.ALWAYS);
      setNewRemSpecificDays([1, 2, 3, 4, 5]);
      setNewRemDaysBefore(1);
    }
    setShowReminderPicker(true);
  };

  const saveReminder = () => {
    const r: Reminder = {
      id: editingReminderId || crypto.randomUUID(),
      time: newRemTime,
      type: newRemType,
      isEnabled: true,
      scheduleType: newRemSchedule,
      specificDays: newRemSchedule === ReminderScheduleType.SPECIFIC_DAYS ? newRemSpecificDays : undefined,
      daysBefore: newRemSchedule === ReminderScheduleType.DAYS_BEFORE ? newRemDaysBefore : undefined
    };

    if (editingReminderId) {
      setReminders(reminders.map(rem => rem.id === editingReminderId ? r : rem));
    } else {
      setReminders([...reminders, r]);
    }
    setShowReminderPicker(false);
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const getScheduleSummary = (r: Reminder) => {
    if (r.scheduleType === ReminderScheduleType.ALWAYS) return 'Every session';
    if (r.scheduleType === ReminderScheduleType.DAYS_BEFORE) return `${r.daysBefore}d before due`;
    if (r.scheduleType === ReminderScheduleType.SPECIFIC_DAYS && r.specificDays) {
      const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      return r.specificDays.map(d => days[d]).join(', ');
    }
    return '';
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border-t sm:border border-white/10 relative">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-black dark:text-slate-100 tracking-tight">Configure Habit</h2>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">Advanced Architecture</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar space-y-10 pb-12">
          {/* Section: Identity */}
          <section className="space-y-6">
            <div className="space-y-2 px-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Naming</label>
              <input 
                required
                className="w-full p-6 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-100 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all text-xl font-black shadow-inner"
                placeholder="What is the goal?"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="space-y-2 px-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Logic Type</label>
              <div className="relative group">
                <select 
                  value={type}
                  onChange={e => setType(e.target.value as HabitType)}
                  className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 dark:text-slate-100 rounded-2xl border-2 border-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800 outline-none appearance-none font-bold transition-all"
                >
                  <option value={HabitType.YES_NO}>Completion (Yes/No)</option>
                  <option value={HabitType.TIME}>Timed Goal (Countdown)</option>
                  <option value={HabitType.POMODORO}>Pomodoro Engine (Focus Sessions)</option>
                </select>
                <ChevronRight className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 rotate-90 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Section: Recurrence refined */}
            <div className="space-y-4 px-1">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recurrence</label>
              <div className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${freqType === FrequencyType.DAILY ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                      <Repeat className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-black text-sm uppercase dark:text-slate-200">Repeat Daily</span>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Every single day</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setFreqType(freqType === FrequencyType.DAILY ? FrequencyType.WEEKDAYS : FrequencyType.DAILY)}
                    className={`w-14 h-7 rounded-full p-1 transition-colors duration-300 ${freqType === FrequencyType.DAILY ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${freqType === FrequencyType.DAILY ? 'translate-x-7' : 'translate-x-0'}`} />
                  </button>
                </div>

                {freqType !== FrequencyType.DAILY && (
                  <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-900 rounded-2xl">
                      <button 
                        type="button" 
                        onClick={() => setFreqType(FrequencyType.WEEKDAYS)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${freqType === FrequencyType.WEEKDAYS ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Specific Days
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setFreqType(FrequencyType.INTERVAL)}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all ${freqType === FrequencyType.INTERVAL ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                      >
                        Interval
                      </button>
                    </div>

                    {freqType === FrequencyType.WEEKDAYS && (
                      <div className="grid grid-cols-7 gap-1.5 animate-in fade-in duration-300">
                        {dayNames.map((day, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setWeekdays(prev => 
                                prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                              );
                            }}
                            className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all border-2 ${weekdays.includes(idx) ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 border-transparent text-slate-400 dark:text-slate-500'}`}
                          >
                            <span className="text-[9px] font-black uppercase">{day[0]}</span>
                            <div className={`w-1.5 h-1.5 rounded-full ${weekdays.includes(idx) ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                          </button>
                        ))}
                      </div>
                    )}

                    {freqType === FrequencyType.INTERVAL && (
                      <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 animate-in fade-in duration-300">
                        <div className="flex-1">
                          <span className="font-black text-[10px] uppercase text-slate-400">Frequency Interval</span>
                          <p className="text-xs font-bold dark:text-slate-200">Every <span className="text-blue-600">{interval}</span> days</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => setIntervalDays(Math.max(2, interval - 1))}
                            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                          <input 
                            type="number" 
                            min="2"
                            value={interval}
                            onChange={e => setIntervalDays(Math.max(2, parseInt(e.target.value) || 2))}
                            className="w-10 text-center font-black text-lg bg-transparent outline-none dark:text-white"
                          />
                          <button 
                            type="button"
                            onClick={() => setIntervalDays(Math.min(99, interval + 1))}
                            className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Section: Goal Targets (Dynamic) */}
            {type === HabitType.TIME && (
              <div className="space-y-4 px-1 animate-in slide-in-from-top-4 duration-300">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Countdown Timer Duration
                </label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-5 rounded-3xl border border-slate-100 dark:border-slate-800">
                  {[{l: 'Hrs', v: durationHours, s: setDurationHours, m: 23}, {l: 'Min', v: durationMinutes, s: setDurationMinutes, m: 59}, {l: 'Sec', v: durationSeconds, s: setDurationSeconds, m: 59}].map((f, i) => (
                    <React.Fragment key={f.l}>
                      <div className="flex-1 space-y-1 text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">{f.l}</span>
                        <input 
                          type="number" min="0" max={f.m} value={f.v}
                          onChange={e => f.s(Math.max(0, Math.min(f.m, parseInt(e.target.value) || 0)))}
                          className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl text-center font-black outline-none border-2 border-transparent focus:border-blue-500 transition-all text-xl"
                        />
                      </div>
                      {i < 2 && <span className="font-black text-slate-400 mt-4">:</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {type === HabitType.POMODORO && (
              <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Work Phase</label>
                    <div className="relative">
                      <input 
                        type="number" value={pomoWorkMins}
                        onChange={e => setPomoWorkMins(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 dark:text-white rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-orange-500"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Min</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Break Phase</label>
                    <div className="relative">
                      <input 
                        type="number" value={pomoBreakMins}
                        onChange={e => setPomoBreakMins(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-5 bg-slate-50 dark:bg-slate-800/40 dark:text-white rounded-2xl font-black text-xl outline-none border-2 border-transparent focus:border-emerald-500"
                      />
                      <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">Min</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Daily Session Target</label>
                  <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-[2rem]">
                    {[1, 2, 4, 8, 12].map(s => (
                      <button 
                        key={s} type="button" onClick={() => setPomoSessionsTarget(s)}
                        className={`flex-1 py-4 rounded-3xl font-black text-sm transition-all ${pomoSessionsTarget === s ? 'bg-white dark:bg-slate-700 shadow-xl text-blue-600 scale-[1.05]' : 'text-slate-400 hover:text-slate-600'}`}
                      >{s}</button>
                    ))}
                    <div className="flex-1 px-4 text-center">
                      <input 
                        type="number" value={pomoSessionsTarget}
                        onChange={e => setPomoSessionsTarget(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-transparent dark:text-white font-black text-center outline-none text-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Section: Visuals & Reminders */}
          <section className="space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Notifications</label>
                <button 
                  type="button" onClick={() => openReminderPicker()}
                  className="text-[11px] font-black text-blue-600 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-5 py-2.5 rounded-2xl hover:bg-blue-100 transition-all uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" /> Add alert
                </button>
              </div>
              
              <div className="space-y-3">
                {reminders.map(r => (
                  <div 
                    key={r.id} onClick={() => openReminderPicker(r)}
                    className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/20 rounded-3xl group cursor-pointer hover:border-blue-400 border border-transparent transition-all"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${r.type === ReminderType.ALARM ? 'bg-orange-500' : 'bg-blue-500'}`}>
                        {r.type === ReminderType.ALARM ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
                      </div>
                      <div>
                        <span className="text-2xl font-black dark:text-slate-100 tracking-tighter">{r.time}</span>
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">{getScheduleSummary(r)}</p>
                      </div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeReminder(r.id); }} className="p-3 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {reminders.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No alerts configured</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Visual Palette</label>
              <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar px-1">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c} type="button" onClick={() => setColor(c)}
                    className={`min-w-[60px] h-14 rounded-2xl flex items-center justify-center transition-all ${color === c ? 'scale-110 ring-4 ring-blue-500/20 shadow-xl' : 'opacity-20 hover:opacity-100'}`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-6 h-6 text-white" strokeWidth={4} />}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <div className="pt-6 flex gap-4">
            {initialData && onDelete && (
              <button type="button" onClick={onDelete} className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center shrink-0"><Trash2 className="w-6 h-6" /></button>
            )}
            <button type="submit" className="flex-1 py-6 bg-blue-600 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-[2rem] shadow-2xl active:scale-[0.97] transition-all">
              {initialData ? 'Update Protocol' : 'Deploy Protocol'}
            </button>
          </div>
        </form>

        {/* Modal: Reminder Picker */}
        {showReminderPicker && (
          <div className="absolute inset-0 z-[70] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border border-white/5 flex flex-col max-h-[90vh]">
              <div className="p-8 text-center bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-4">Trigger Time</label>
                <input 
                  type="time" 
                  value={newRemTime} 
                  onChange={e => setNewRemTime(e.target.value)} 
                  className="text-6xl font-black text-slate-800 dark:text-white bg-transparent outline-none w-auto tracking-tighter text-center" 
                />
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Alert Intensity</label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-[1.75rem]">
                    {[
                      { id: ReminderType.NOTIFICATION, label: 'Standard', icon: <Bell className="w-4 h-4" /> },
                      { id: ReminderType.ALARM, label: 'Critical', icon: <AlertCircle className="w-4 h-4" /> }
                    ].map(t => (
                      <button 
                        key={t.id} 
                        type="button" 
                        onClick={() => setNewRemType(t.id)} 
                        className={`py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all ${newRemType === t.id ? 'bg-white dark:bg-slate-700 shadow-xl text-blue-600' : 'text-slate-400'}`}
                      >
                        {t.icon}
                        <span className="font-black text-[10px] uppercase">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">Scheduling Protocol</label>
                  <div className="space-y-2">
                    {[
                      { id: ReminderScheduleType.ALWAYS, label: 'Standard Cycle', desc: 'Repeat every session', icon: <Clock className="w-4 h-4" /> },
                      { id: ReminderScheduleType.SPECIFIC_DAYS, label: 'Targeted Window', desc: 'Select individual days', icon: <Calendar className="w-4 h-4" /> },
                      { id: ReminderScheduleType.DAYS_BEFORE, label: 'Advance Alert', desc: 'Days prior to due date', icon: <Timer className="w-4 h-4" /> }
                    ].map(s => (
                      <button 
                        key={s.id} 
                        type="button" 
                        onClick={() => setNewRemSchedule(s.id)} 
                        className={`w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all border-2 ${newRemSchedule === s.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500/50 text-blue-600' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${newRemSchedule === s.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          {s.icon}
                        </div>
                        <div className="text-left flex-1">
                          <span className="font-black text-xs uppercase block">{s.label}</span>
                          <span className="text-[9px] font-bold opacity-60 uppercase">{s.desc}</span>
                        </div>
                        {newRemSchedule === s.id && <Check className="w-5 h-5" strokeWidth={3} />}
                      </button>
                    ))}
                  </div>
                </div>

                {newRemSchedule === ReminderScheduleType.SPECIFIC_DAYS && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-7 gap-1.5 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-[2rem]">
                      {dayNames.map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewRemSpecificDays(prev => 
                              prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx].sort()
                            );
                          }}
                          className={`flex flex-col items-center gap-1 py-3 rounded-xl transition-all ${newRemSpecificDays.includes(idx) ? 'bg-blue-600 text-white shadow-lg' : 'bg-transparent text-slate-400'}`}
                        >
                          <span className="text-[9px] font-black uppercase">{day[0]}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${newRemSpecificDays.includes(idx) ? 'bg-white' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {newRemSchedule === ReminderScheduleType.DAYS_BEFORE && (
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="p-5 bg-slate-100 dark:bg-slate-800/80 rounded-[2.5rem] flex items-center justify-between gap-6">
                      <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Advance By</label>
                        <p className="text-[11px] font-bold dark:text-slate-300">Trigger alert days before the target.</p>
                      </div>
                      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800">
                        <button 
                          type="button"
                          onClick={() => setNewRemDaysBefore(Math.max(1, newRemDaysBefore - 1))}
                          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </button>
                        <input 
                          type="number" 
                          min="1" 
                          max="30"
                          value={newRemDaysBefore} 
                          onChange={e => setNewRemDaysBefore(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
                          className="w-10 text-center font-black text-lg bg-transparent outline-none dark:text-white" 
                        />
                        <button 
                          type="button"
                          onClick={() => setNewRemDaysBefore(Math.min(30, newRemDaysBefore + 1))}
                          className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        >
                          <ChevronUp className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 flex gap-4 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowReminderPicker(false)} 
                  className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest"
                >Cancel</button>
                <button 
                  type="button" 
                  onClick={saveReminder} 
                  className="flex-[1.5] py-4 bg-blue-600 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
                >Confirm Alert</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HabitForm;
