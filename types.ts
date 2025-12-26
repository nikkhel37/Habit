
export enum HabitType {
  YES_NO = 'YES_NO',
  COUNT = 'COUNT',
  TIME = 'TIME',
  POMODORO = 'POMODORO'
}

export enum FrequencyType {
  DAILY = 'DAILY',
  WEEKDAYS = 'WEEKDAYS',
  INTERVAL = 'INTERVAL',
  MONTHLY = 'MONTHLY'
}

export enum ReminderType {
  NONE = 'NONE',
  NOTIFICATION = 'NOTIFICATION',
  ALARM = 'ALARM'
}

export enum ReminderScheduleType {
  ALWAYS = 'ALWAYS',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
  DAYS_BEFORE = 'DAYS_BEFORE'
}

export interface Reminder {
  id: string;
  time: string; // HH:mm
  type: ReminderType;
  isEnabled: boolean;
  scheduleType: ReminderScheduleType;
  specificDays?: number[]; // 0-6
  daysBefore?: number;
}

export interface PomodoroConfig {
  workDuration: number;
  breakDuration: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  type: HabitType;
  categoryId?: string;
  targetValue: number;
  unit?: string;
  frequency: {
    type: FrequencyType;
    weekdays?: number[];
    interval?: number;
    monthlyDays?: number[];
  };
  reminders: Reminder[];
  startDate: string;
  endDate?: string;
  isArchived: boolean;
  isPaused: boolean;
  createdAt: number;
  pomodoroConfig?: PomodoroConfig;
}

export interface HabitRecord {
  habitId: string;
  date: string;
  value: number;
  note?: string;
  mood?: 'great' | 'good' | 'neutral' | 'bad';
  isSkipped?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  icon: string;
  startTime?: string;
  habits: string[];
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface AppState {
  habits: Habit[];
  records: HabitRecord[];
  routines: Routine[];
  categories: Category[];
  settings: {
    darkMode: boolean;
    weekStart: number;
    themeColor: string;
  };
}
