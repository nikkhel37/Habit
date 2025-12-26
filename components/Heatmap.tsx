
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

  // Map dates to grid
  const recordMap = new Map<string, number>(records.map(r => [r.date, r.value]));

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      // Adjust to start from the most recent week on the right
      date.setDate(today.getDate() - ((weeks - 1 - w) * 7 + (6 - d)));
      grid[d][w] = formatDate(date);
    }
  }

  return (
    <div className="w-full overflow-x-auto pb-2 flex justify-center custom-scrollbar">
      <div className="flex gap-1.5 min-w-max">
        {Array.from({ length: weeks }).map((_, w) => (
          <div key={w} className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }).map((_, d) => {
              const date = grid[d][w];
              const value = recordMap.get(date) || 0;
              const opacity = value > 0 ? Math.min(0.2 + (value * 0.2), 1) : 0.08;
              
              return (
                <div 
                  key={d}
                  title={date}
                  className="w-3.5 h-3.5 rounded-md transition-all duration-300 hover:scale-125 hover:z-10 cursor-pointer"
                  style={{ 
                    backgroundColor: value > 0 ? color : 'currentColor',
                    opacity: value > 0 ? opacity : 0.1
                  }}
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
