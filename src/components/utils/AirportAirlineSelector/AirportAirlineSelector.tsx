import React from 'react';
import './AirportAirlineSelector.css';

export interface AirportAirlineSelectorOption {
  value: string;
  label: string;
}

export interface AirportAirlineSelectorProps {
  options: AirportAirlineSelectorOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  className?: string;
}

const AirportAirlineSelector: React.FC<AirportAirlineSelectorProps> = ({
  options,
  selectedValue,
  onChange,
  className = ''
}) => {
  return (
    <div className={`airport-airline-selector ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={selectedValue === option.value ? 'active' : ''}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default AirportAirlineSelector; 