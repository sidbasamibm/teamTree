import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { useDateRange } from '../utils/DateRangeContext';
import './DateRangePicker.css';

// Helper functions for date calculations
const formatDate = (date) => date.toISOString().split('T')[0];

const formatDisplayDate = (dateStr) => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getPresetRange = (preset) => {
  const today = new Date();
  let start, end;

  switch (preset) {
    case 'last7':
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 7);
      break;
    case 'last30':
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 30);
      break;
    case 'last90':
      end = new Date(today);
      start = new Date(today);
      start.setDate(start.getDate() - 90);
      break;
    case 'thisMonth':
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case 'lastMonth':
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      end = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
    case 'thisQuarter':
      const quarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), quarter * 3, 1);
      end = new Date(today.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'ytd':
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today);
      break;
    case 'allTime':
      start = new Date('2022-01-01');
      end = new Date('2022-12-31');
      break;
    default:
      return null;
  }

  return { start: formatDate(start), end: formatDate(end) };
};

const PRESETS = [
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'last90', label: 'Last 90 Days' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'thisQuarter', label: 'This Quarter' },
  { id: 'ytd', label: 'Year to Date' },
  { id: 'allTime', label: 'All Time (2022)' },
];

export default function DateRangePicker({ onApply }) {
  const { startDate, setStartDate, endDate, setEndDate } = useDateRange();
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const handlePresetClick = (preset) => {
    const range = getPresetRange(preset.id);
    if (range) {
      setActivePreset(preset.id);
      setTempStart(range.start);
      setTempEnd(range.end);
      // Don't close popover - wait for Apply button
    }
  };

  const handleApply = () => {
    // Update context
    setStartDate(tempStart);
    setEndDate(tempEnd);
    setIsOpen(false);

    // Pass the new dates directly to onApply since context won't update until next render
    if (onApply) {
      onApply(tempStart, tempEnd);
    }
  };

  const handleCancel = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    setIsOpen(false);
  };

  const displayText = () => {
    // Check if current dates match any preset
    const matchingPreset = PRESETS.find(preset => {
      const range = getPresetRange(preset.id);
      return range && range.start === startDate && range.end === endDate;
    });

    if (matchingPreset) {
      return matchingPreset.label;
    }
    return `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  };

  return (
    <div className="date-range-picker">
      <button className="date-range-button" onClick={() => setIsOpen(!isOpen)}>
        📅 {displayText()} ▼
      </button>

      {isOpen && (
        <>
          <div className="date-picker-backdrop" onClick={handleCancel} />
          <div className="date-picker-popover">
            <div className="date-picker-content">
              {/* Presets Section */}
              <div className="date-picker-presets">
                <div className="preset-header">Quick Select</div>
                {PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    className={`preset-item ${activePreset === preset.id ? 'active' : ''}`}
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset.label}
                    {activePreset === preset.id && <span className="checkmark">✓</span>}
                  </button>
                ))}
              </div>

              {/* Custom Date Section */}
              <div className="date-picker-custom">
                <div className="preset-header">Custom Range</div>
                <div className="custom-inputs">
                  <div className="input-group">
                    <label>From</label>
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>To</label>
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                    />
                  </div>
                </div>
                <div className="custom-actions">
                  <button className="btn-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className="btn-apply" onClick={handleApply}>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
