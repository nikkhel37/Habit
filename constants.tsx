
import React from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Calendar, 
  Settings, 
  TrendingUp, 
  Layout, 
  Sun, 
  Moon,
  Clock,
  Hash,
  Activity,
  Heart,
  Book,
  Coffee,
  Zap,
  Dumbbell
} from 'lucide-react';

export const HABIT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
];

export const HABIT_ICONS = [
  { id: 'activity', icon: <Activity className="w-5 h-5" /> },
  { id: 'heart', icon: <Heart className="w-5 h-5" /> },
  { id: 'book', icon: <Book className="w-5 h-5" /> },
  { id: 'coffee', icon: <Coffee className="w-5 h-5" /> },
  { id: 'zap', icon: <Zap className="w-5 h-5" /> },
  { id: 'dumbbell', icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'check', icon: <CheckCircle2 className="w-5 h-5" /> },
  { id: 'clock', icon: <Clock className="w-5 h-5" /> },
];

export const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: <CheckCircle2 /> },
  { id: 'habits', label: 'Habits', icon: <Layout /> },
  { id: 'analytics', label: 'Stats', icon: <TrendingUp /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
];
