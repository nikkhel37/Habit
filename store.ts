
import { AppState } from './types';

const STORAGE_KEY = 'habitnexus_v1_data';

const DEFAULT_STATE: AppState = {
  habits: [],
  records: [],
  routines: [
    { id: 'morning', name: 'Morning Routine', icon: '🌅', habits: [] },
    { id: 'evening', name: 'Evening Routine', icon: '🌙', habits: [] }
  ],
  categories: [],
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
    
    // Safety merge: ensure settings and other top-level keys exist
    return {
      ...DEFAULT_STATE,
      ...parsed,
      settings: {
        ...DEFAULT_STATE.settings,
        ...(parsed.settings || {})
      }
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
