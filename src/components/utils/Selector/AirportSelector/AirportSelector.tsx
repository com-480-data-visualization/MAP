import React, { useState, useMemo } from 'react';
import './AirportSelector.css';

interface Airport {
  code: string;
  airport: string;
  city: string;
  state: string;
  flightCount: number;
}

interface Props {
  availableAirports: Airport[];
  selectedAirports: string[];
  onAirportToggle: (code: string) => void;
  onClearAll: () => void;
  className?: string;
}

const AirportSelector: React.FC<Props> = ({
  availableAirports,
  selectedAirports,
  onAirportToggle,
  onClearAll,
  className = ''
}) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return availableAirports;
    
    const term = search.toLowerCase();
    return availableAirports
      .filter(airport => 
        airport.code.toLowerCase().includes(term) ||
        airport.airport.toLowerCase().includes(term) ||
        airport.city.toLowerCase().includes(term) ||
        airport.state.toLowerCase().includes(term)
      )
  }, [availableAirports, search]);

  return (
    <div className={`airport-selector ${className}`}>
      <div className="selector-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search airports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="airport-search"
          />
        </div>
      </div>
      
      <div className="airport-list">
        {filtered.map(airport => (
          <div 
            key={airport.code} 
            className={`airport-item ${selectedAirports.includes(airport.code) ? 'selected' : ''}`}
            onClick={() => onAirportToggle(airport.code)}
          >
            <div className="airport-info">
              <div className="airport-main">
                <span className="airport-code">{airport.code}</span>
                <span className="airport-name">
                  {airport.airport.replace(/International Airport/g, "Int'l")}
                </span>
              </div>
              <span className="airport-location">{airport.city}, {airport.state}</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="selection-summary">
        <span>{selectedAirports.length} airports selected</span>
        <button onClick={onClearAll} className="control-btn clear">
          Clear
        </button>
      </div>
    </div>
  );
};

export default AirportSelector; 