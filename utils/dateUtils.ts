
import { Habit, HabitRecord, FrequencyType } from '../types';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getTodayDate = (): string => {
  return formatDate(new Date());
};

/**
 * Normalizes a date to midnight UTC for comparison purposes
 */
const toMidnight = (date: string | Date): number => {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
};

export const isHabitDue = (habit: Habit, date: string): boolean => {
  if (habit.isArchived || habit.isPaused) return false;
  
  const targetMidnight = toMidnight(date);
  const startMidnight = toMidnight(habit.startDate);
  
  // Basic date range check
  if (targetMidnight < startMidnight) return false;
  if (habit.endDate && targetMidnight > toMidnight(habit.endDate)) return false;

  switch (habit.frequency.type) {
    case FrequencyType.DAILY:
      return true;
    case FrequencyType.WEEKDAYS: {
      // Force local midnight for reliable day-of-week checks.
      const localDay = new Date(date + 'T12:00:00').getDay();
      return habit.frequency.weekdays?.includes(localDay) ?? false;
    }
    case FrequencyType.INTERVAL: {
      const diffTime = Math.abs(targetMidnight - startMidnight);
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      return diffDays % (habit.frequency.interval || 1) === 0;
    }
    case FrequencyType.MONTHLY: {
      const dayOfMonth = new Date(date + 'T12:00:00').getDate();
      return habit.frequency.monthlyDays?.includes(dayOfMonth) ?? false;
    }
    default:
      return false;
  }
};

export const calculateStreak = (habitId: string, records: HabitRecord[], habits: Habit[]): { current: number; longest: number } => {
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return { current: 0, longest: 0 };

  const targetVal = habit.type === 'YES_NO' ? 1 : habit.targetValue;
  
  const habitRecords = records
    .filter(r => r.habitId === habitId && r.value >= targetVal)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (habitRecords.length === 0) return { current: 0, longest: 0 };

  let current = 0;
  let checkDate = new Date();
  const todayStr = getTodayDate();
  
  if (habitRecords[0].date !== todayStr) {
    if (isHabitDue(habit, todayStr)) {
      // Due today but not done
    } else {
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  let recordIdx = 0;
  while (recordIdx < habitRecords.length) {
    const dateStr = formatDate(checkDate);
    if (isHabitDue(habit, dateStr)) {
      if (habitRecords[recordIdx].date === dateStr) {
        current++;
        recordIdx++;
      } else {
        break;
      }
    }
    checkDate.setDate(checkDate.getDate() - 1);
    if (toMidnight(checkDate) < toMidnight(habit.startDate)) break;
  }
  
  return { current, longest: current };
};
