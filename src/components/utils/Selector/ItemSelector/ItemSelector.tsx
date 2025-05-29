import React, { useState, useMemo } from 'react';
import './ItemSelector.css';

interface Airport {
  code: string;
  name: string;
  city: string;
  state: string;
  flightCount: number;
}

interface Props {
  availableItems: Airport[];
  selectedItems: string[];
  onItemToggle: (code: string) => void;
  onClearAll: () => void;
  className?: string;
  isAirline?: boolean; // true if airline / false if airport
  hasClearButton?: boolean;
}

const ItemSelector: React.FC<Props> = ({
  availableItems,
  selectedItems,
  onItemToggle,
  onClearAll,
  className = '',
  isAirline = false,
  hasClearButton = true
}) => {

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return availableItems;

    const term = search.toLowerCase();
    return availableItems
      .filter(item =>
        item.code.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.city.toLowerCase().includes(term) ||
        item.state.toLowerCase().includes(term)
      )
  }, [availableItems, search]);

  return (
    <div className={`item-selector ${className}`}>
      <div className="selector-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="item-search"
          />
        </div>
      </div>

      <div className="item-list">
        {filtered.map(item => (
          <div
            key={item.code}
            className={`item-item ${selectedItems.includes(item.code) ? 'selected' : ''}`}
            onClick={() => onItemToggle(item.code)}
          >
            <div className="item-info">
              <div className="item-main">
                {isAirline ?
                  <span className="item-code">{item.name.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")}</span>
                  :
                  <>
                    <span className="item-code">{item.code}</span>
                    <span className="item-name">
                      {item.name.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")}
                    </span>
                  </>
                }
              </div>
              {!isAirline &&
                <span className="item-location">{item.city}, {item.state}</span>
              }
            </div>
          </div>
        ))}
      </div>

      <div className="selection-summary">
        <span>{selectedItems.length} selected</span>
        {hasClearButton &&
          <button onClick={onClearAll} className="control-btn clear">
            Clear
          </button>
        }
      </div>
    </div>
  );
};

export default ItemSelector; 