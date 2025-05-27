import React, { useMemo, useCallback } from 'react';
import { FaCalendarAlt, FaPlay, FaPause } from 'react-icons/fa';
import './TimeSlider.css';

interface TimeSliderProps {
  selectedDate: Date;
  minDate: Date;
  maxDate: Date;
  totalMonths?: number;
  onDateChange: (date: Date) => void;
  isPlaying?: boolean;
  onToggleAutoplay?: () => void;
  className?: string;
}

const TimeSlider: React.FC<TimeSliderProps> = ({
  selectedDate,
  minDate,
  maxDate,
  totalMonths,
  onDateChange,
  isPlaying,
  onToggleAutoplay,
  className = ''
}) => {
  const formatDate = useCallback(
    (date: Date): string =>
      date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    []
  );

  const monthsRange = useMemo(() => {
    if (typeof totalMonths === 'number' && totalMonths > 0) {
      return totalMonths;
    }
    const diff =
      (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
      (maxDate.getMonth() - minDate.getMonth()) +
      1;
    return diff;
  }, [totalMonths, minDate, maxDate]);

  const sliderValue = useMemo(() => {
    const yearDiff = selectedDate.getFullYear() - minDate.getFullYear();
    return yearDiff * 12 + selectedDate.getMonth();
  }, [selectedDate, minDate]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      const year = Math.floor(value / 12) + minDate.getFullYear();
      const month = value % 12;
      onDateChange(new Date(year, month, 1));
    },
    [onDateChange, minDate]
  );

  return (
    <div className={`time-slider-container ${className}`}>
      <div className="time-slider-header">
        <FaCalendarAlt />
        <div className="date-display">
          <span>{formatDate(selectedDate)}</span>
        </div>
        {typeof isPlaying === 'boolean' && onToggleAutoplay && (
          <button
            onClick={onToggleAutoplay}
            className="autoplay-button"
            title={isPlaying ? 'Pause autoplay' : 'Start autoplay'}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
        )}
      </div>
      <input
        type="range"
        min={0}
        max={monthsRange - 1}
        value={sliderValue}
        onChange={handleSliderChange}
        className="time-slider"
      />
      <div className="time-slider-labels">
        <span>{formatDate(minDate)}</span>
        <span>{formatDate(maxDate)}</span>
      </div>
    </div>
  );
};

export default TimeSlider; 