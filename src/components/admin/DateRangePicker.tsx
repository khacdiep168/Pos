'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Clock, Filter } from 'lucide-react';

export type QuickPickKey = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  preset: QuickPickKey;
  label: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export const getBoundaryForPreset = (preset: QuickPickKey, customStart?: string, customEnd?: string): DateRange => {
  const now = new Date();

  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: start, endDate: end, preset: 'today', label: 'Hôm nay' };
  }

  if (preset === 'week') {
    // Current week starting from Monday
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { startDate: monday, endDate: end, preset: 'week', label: 'Tuần này' };
  }

  if (preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { startDate: start, endDate: end, preset: 'month', label: 'Tháng này' };
  }

  if (preset === 'year') {
    const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    return { startDate: start, endDate: end, preset: 'year', label: 'Năm nay' };
  }

  // Custom
  const s = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1);
  s.setHours(0, 0, 0, 0);

  const e = customEnd ? new Date(customEnd) : new Date();
  e.setHours(23, 59, 59, 999);

  return {
    startDate: s,
    endDate: e,
    preset: 'custom',
    label: `Tùy chỉnh: ${s.toLocaleDateString('vi-VN')} - ${e.toLocaleDateString('vi-VN')}`,
  };
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
  const [activePreset, setActivePreset] = useState<QuickPickKey>(value.preset);
  
  // Format Date to YYYY-MM-DD for native input
  const toDateInputValue = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [customStartDate, setCustomStartDate] = useState<string>(toDateInputValue(value.startDate));
  const [customEndDate, setCustomEndDate] = useState<string>(toDateInputValue(value.endDate));
  const [showCustomInputs, setShowCustomInputs] = useState(value.preset === 'custom');

  const handleSelectPreset = (preset: QuickPickKey) => {
    setActivePreset(preset);
    if (preset === 'custom') {
      setShowCustomInputs(true);
      const range = getBoundaryForPreset('custom', customStartDate, customEndDate);
      onChange(range);
    } else {
      setShowCustomInputs(false);
      const range = getBoundaryForPreset(preset);
      onChange(range);
    }
  };

  const handleCustomDateChange = (startStr: string, endStr: string) => {
    setCustomStartDate(startStr);
    setCustomEndDate(endStr);
    const range = getBoundaryForPreset('custom', startStr, endStr);
    onChange(range);
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
      {/* Quick Picks Buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl overflow-x-auto no-scrollbar shrink-0">
        <button
          type="button"
          onClick={() => handleSelectPreset('today')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activePreset === 'today'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Hôm Nay
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('week')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activePreset === 'week'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Tuần Này
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('month')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activePreset === 'month'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Tháng Này
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('year')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activePreset === 'year'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Năm Nay
        </button>

        <button
          type="button"
          onClick={() => handleSelectPreset('custom')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
            activePreset === 'custom'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          Tùy Chỉnh
        </button>
      </div>

      {/* Date Range Display or Custom Inputs */}
      <div className="flex items-center gap-2">
        {showCustomInputs ? (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs">
              <span className="text-stone-400 text-[11px]">Từ:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => handleCustomDateChange(e.target.value, customEndDate)}
                className="bg-transparent border-none text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 dark:bg-stone-800 rounded-xl text-xs">
              <span className="text-stone-400 text-[11px]">Đến:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => handleCustomDateChange(customStartDate, e.target.value)}
                className="bg-transparent border-none text-xs font-semibold text-stone-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-100/70 dark:bg-stone-800/60 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300">
            <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>
              {value.startDate.toLocaleDateString('vi-VN')} — {value.endDate.toLocaleDateString('vi-VN')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
