
import React from 'react';
import { HabitRecord } from '../types';
import { formatDate } from '../utils/dateUtils';

interface HeatmapProps {
  records: HabitRecord[];
  color: string;
}

const Heatmap: React.FC<HeatmapProps> = ({ records, color }) => {
  const today = new Date();
  const weeks = 20; // Show last 20 weeks
  const grid: string[][] = Array.from({ length: 7 }, () => Array(weeks).fill(''));

  // Map dates to grid - Added explicit type Map<string, number>
  const recordMap = new Map<string, number>(records.map(r => [r.date, r.value]));

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
      grid[d][w] = formatDate(date);
    }
  }

  return (
    <div className="overflow-x-auto pb-2 custom-scrollbar">
      <div className="flex gap-1">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 7 }).map((_, d) => {
              const date = grid[d][w];
              const value = recordMap.get(date) || 0;
              // value is now correctly inferred as number
              const opacity = value > 0 ? 0.2 + (Math.min(value, 5) * 0.15) : 0.05;
              
              return (
                <div 
                  key={d}
                  title={date}
                  className="w-3 h-3 rounded-sm transition-all"
                  style={{ 
                    backgroundColor: value > 0 ? color : 'currentColor',
                    opacity: value > 0 ? opacity : 0.1
                  }}
                  // Using currentColor with opacity 0.1 for empty cells in dark mode
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Heatmap;
