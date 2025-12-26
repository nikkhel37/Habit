
import { AppState } from './types';

export const STORAGE_KEY = 'habitnexus_v1_data';

const DEFAULT_STATE: AppState = {
  habits: [],
  records: [],
  routines: [
    { id: 'morning', name: 'Morning Routine', icon: '🌅', habits: [] },
    { id: 'evening', name: 'Evening Routine', icon: '🌙', habits: [] }
  ],
  categories: [
    { id: 'cat-health', name: 'Health', color: '#10b981' },
    { id: 'cat-work', name: 'Productivity', color: '#3b82f6' },
    { id: 'cat-personal', name: 'Self-Care', color: '#f472b6' },
    { id: 'cat-finance', name: 'Finance', color: '#f59e0b' },
    { id: 'cat-mind', name: 'Mindset', color: '#8b5cf6' }
  ],
  settings: {
    darkMode: false,
    weekStart: 1,
    themeColor: '#3b82f6'
  }
};

export const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return DEFAULT_STATE;
    
    const parsed = JSON.parse(saved);
    
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: {
        ...DEFAULT_STATE.settings,
        ...(parsed.settings || {})
      },
      categories: parsed.categories?.length ? parsed.categories : DEFAULT_STATE.categories
    };
  } catch (e) {
    console.error('Failed to load state', e);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
};

export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
