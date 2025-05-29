import React, { useState, useEffect } from 'react';
import { FaSortAmountDown, FaSortAmountUp, FaExpand, FaCompress } from 'react-icons/fa';
import * as d3 from 'd3';
import LeaderboardBarChart from './LeaderboardBarChart';
import TimeSlider from './utils/TimeSlider/TimeSlider';
import AirportAirlineSelector from './utils/AirportAirlineSelector/AirportAirlineSelector';
import './LeaderboardSection.css';

const dateRange = {
  min: new Date(2009, 0, 1),
  max: new Date(2018, 11, 1),
  default: new Date(2009, 0, 1)
};

interface DataEntry {
  Year: string;
  Month: string;
  Airline?: string;
  IATA_CODE?: string;
  AverageDelay: string;
}

interface LeaderboardItem {
  name: string;
  delay: number;
  code: string;
}

const LeaderboardSection: React.FC = () => {
  const [airlinesData, setAirlinesData] = useState<DataEntry[]>([]);
  const [airportsData, setAirportsData] = useState<DataEntry[]>([]);
  const [airlineNames, setAirlineNames] = useState<Map<string, string>>(new Map());
  const [airportNames, setAirportNames] = useState<Map<string, string>>(new Map());

  const [selectedDate, setSelectedDate] = useState<Date>(dateRange.default);
  const [dataType, setDataType] = useState<'airlines' | 'airports'>('airlines');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [minDelayForColor, setMinDelayForColor] = useState<number>(0);
  const [maxDelayForColor, setMaxDelayForColor] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const dataTypeOptions = [
    { value: 'airlines', label: 'Airlines' },
    { value: 'airports', label: 'Airports' }
  ];

  const handleDataTypeChange = (value: string) => {
    setDataType(value as 'airlines' | 'airports');
  };

  const loadData = async (path: string) => {
    try {
      return await d3.csv(path);
    } catch (error) {
      console.error(`Error loading ${path}:`, error);
      return [];
    }
  };

  const processData = () => {
    if (loading) return;

    const currentData = dataType === 'airlines' ? airlinesData : airportsData;
    const names = dataType === 'airlines' ? airlineNames : airportNames;

    if (currentData.length === 0) {
      setLeaderboardData([]);
      setMinDelayForColor(0);
      setMaxDelayForColor(0);
      return;
    }

    const currentMonth = selectedDate.getMonth() + 1;
    const currentYear = selectedDate.getFullYear();
    
    const filtered = currentData.filter(d => 
      Number(d.Year) === currentYear && Number(d.Month) === currentMonth
    );

    const grouped = new Map<string, number>();
    const counts = new Map<string, number>();
    
    const keyField = dataType === 'airlines' ? 'Airline' : 'IATA_CODE';
    
    for (const item of filtered) {
      const key = item[keyField] as string;
      if (!key) continue;
      
      const delay = Number(item.AverageDelay);
      grouped.set(key, (grouped.get(key) || 0) + delay);
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    for (const [key, sum] of grouped) {
      const count = counts.get(key) || 1;
      grouped.set(key, sum / count);
    }

    const values = Array.from(grouped.values());
    setMinDelayForColor(d3.min(values) || 0);
    setMaxDelayForColor(d3.max(values) || 0);

    const items = Array.from(grouped, ([key, value]) => ({ key, value }));
    const sorted = items.sort((a, b) => 
      sortOrder === 'asc' ? a.value - b.value : b.value - a.value
    );

    const count = isFullscreen ? 10 : 5;
    const final = sorted.slice(0, count).map(item => ({
      name: names.get(item.key) || item.key,
      delay: Number(item.value),
      code: item.key
    }));
    
    setLeaderboardData(final);
  };

  const getNextDate = (current: Date): Date => {
    const next = new Date(current);
    next.setMonth(next.getMonth() + 1);
    
    if (next > dateRange.max) {
      return dateRange.min;
    }
    
    return next;
  };

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      if (prev === true) {
        setIsPlaying(false);
      }
      return !prev;
    });
  };

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      
      try {
        const [airlines, airports, airlinesMap, airportsMap] = await Promise.all([
          loadData('data/airlines.csv'),
          loadData('data/airports.csv'),
          loadData('data/airlines-map.csv'),
          loadData('data/airports-map.csv')
        ]);

        setAirlineNames(new Map(airlines.map(d => [d.Code, d.Description])));
        setAirportNames(new Map(airports.map(d => [d.IATA_CODE, d.AIRPORT])));
        setAirlinesData(airlinesMap as DataEntry[]);
        setAirportsData(airportsMap as DataEntry[]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    processData();
  }, [selectedDate, dataType, sortOrder, airlinesData, airportsData, airlineNames, airportNames, loading, isFullscreen]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedDate(prev => getNextDate(prev));
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`leaderboard-section ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="leaderboard-section-content">
        <div className="leaderboard-section-text">
          <h2>Delay Leaderboard</h2>
          <p>
            Explore the top performers and worst performers in flight delays. This leaderboard shows:
          </p>
          <ul>
            <li>Toggle between Airlines and Airports rankings</li>
            <li>Sort by best (ascending) or worst (descending) delays</li>
            <li>Visual color coding based on delay severity</li>
          </ul>
        </div>

        <div className="leaderboard-section-visualization">
          {isFullscreen && (
            <div className="leaderboard-header">
              <AirportAirlineSelector
                options={dataTypeOptions}
                selectedValue={dataType}
                onChange={handleDataTypeChange}
              />

              <button className="sort-icon-button" onClick={toggleSort}>
                {sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />}
              </button>
            </div>
          )}

          {isFullscreen && (
            <TimeSlider
              selectedDate={selectedDate}
              minDate={dateRange.min}
              maxDate={dateRange.max}
              onDateChange={setSelectedDate}
              isPlaying={isPlaying}
              onToggleAutoplay={togglePlay}
            />
          )}

          <div className="leaderboard-plot-container">
            {(leaderboardData.length === 0 && !loading) ? (
              <div>No data available</div>
            ) : (
              <LeaderboardBarChart 
                leaderboardData={leaderboardData} 
                selectedDate={selectedDate} 
                dataType={dataType} 
                sortOrder={sortOrder}
                minDelayForColor={minDelayForColor}
                maxDelayForColor={maxDelayForColor}
              />
            )}
          </div>

          {!isFullscreen && (
            <div className="leaderboard-controls-overlay">
              <button className="action-btn fullscreen-btn" onClick={toggleFullscreen}>
                <FaExpand />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isFullscreen && (
        <button 
          className="exit-fullscreen-btn"
          onClick={toggleFullscreen} 
          aria-label="Exit fullscreen"
        >
          <FaCompress />
        </button>
      )}
    </div>
  );
};

export default LeaderboardSection; 
