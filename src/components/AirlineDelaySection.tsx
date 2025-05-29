import React, { useState, useEffect, useCallback, useRef } from 'react';
import './AirlineDelaySection.css';
import * as d3 from 'd3';
import AirlineDelayBarChart from './AirlineDelayBarChart';
import ItemSelector from './utils/Selector/ItemSelector/ItemSelector';
import TimeSlider from './utils/TimeSlider/TimeSlider';
import AirportAirlineSelector from './utils/AirportAirlineSelector/AirportAirlineSelector';

const CONFIG = {
  INITIAL_DATE: new Date(2009, 0, 1),
  DATE_RANGE: {
    minDate: new Date(2009, 0, 1),
    maxDate: new Date(2018, 11, 1),
    totalMonths: 120
  },
  AUTOPLAY_INTERVAL: 500,
  DEFAULT_SELECTED: 6
};

const AirlineDelaySection: React.FC = () => {
  const intervalRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [airlinesRawData, setAirlinesRawData] = useState<any[]>([]);
  const [airportsRawData, setAirportsRawData] = useState<any[]>([]);
  const [airlineNames, setAirlineNames] = useState<Map<string, string>>(new Map());
  const [airportNames, setAirportNames] = useState<Map<string, string>>(new Map());
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [availableAirports, setAvailableAirports] = useState<string[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [filteredAirlineData, setFilteredAirlineData] = useState<any[]>([]);
  const [filteredAirportData, setFilteredAirportData] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2009, 0, 1));
  const [isPlaying, setIsPlaying] = useState(false);

  const dataTypeOptions = [
    { value: 'airlines', label: 'Airlines' },
    { value: 'airports', label: 'Airports' }
  ];

  const [dataType, setDataType] = useState<string>('airlines'); // airlines / airports

  useEffect(() => {
    d3.csv('data/airlines.csv').then(namesData => {
      setAirlineNames(new Map(namesData.map(d => [d.Code, d.Description.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")])));
      d3.csv('data/airlines-map.csv').then(data => {
        const uniqueAirlineCodes = Array.from(new Set(data.map(d => d.Airline))).sort();
        setAirlinesRawData(data);
        setAvailableAirlines(uniqueAirlineCodes);
        setSelectedAirlines(uniqueAirlineCodes.slice(0, 5)); // initially, select only the first 5
      });
    });

    d3.csv('data/airports.csv').then(namesData => {
      setAirportNames(new Map(namesData.map(d => [d.IATA_CODE, d.AIRPORT.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")])));
      d3.csv('data/airports-map.csv').then(data => {
        const uniqueAirportCodes = Array.from(new Set(data.map(d => d.IATA_CODE).filter(code => code !== ""))).sort();
        setAirportsRawData(data);
        setAvailableAirports(uniqueAirportCodes);
        setSelectedAirports(uniqueAirportCodes.slice(0, 3)); // initially, select only the first 3
      });
    });
  }, []);

  useEffect(() => {
    if (airlinesRawData.length <= 0 || selectedAirlines.length <= 0 || airlineNames.size <= 0) {
      setFilteredAirlineData([]);
      return;
    }
    if (airportsRawData.length <= 0 || selectedAirports.length <= 0 || airportNames.size <= 0) {
      setFilteredAirportData([]);
      return;
    }
    setFilteredAirlineData(selectedAirlines.map(code => {
      const row = airlinesRawData.find(d => d.Airline === code && Number(d.Year) === selectedDate.getFullYear() && Number(d.Month) === selectedDate.getMonth() + 1);
      return {
        airline: airlineNames.get(code) || code,
        weather: row ? Number(row.AverageDelay_WEATHER_DELAY) : 0,
        carrier: row ? Number(row.AverageDelay_CARRIER_DELAY) : 0,
        nas: row ? Number(row.AverageDelay_NAS_DELAY) : 0,
        security: row ? Number(row.AverageDelay_SECURITY_DELAY) : 0,
        lateAircraft: row ? Number(row.AverageDelay_LATE_AIRCRAFT_DELAY) : 0,
      };
    }));

    setFilteredAirportData(selectedAirports.map(code => {
      const row = airportsRawData.find(d => d.IATA_CODE === code && Number(d.Year) === selectedDate.getFullYear() && Number(d.Month) === selectedDate.getMonth() + 1);
      return {
        airline: airportNames.get(code) || code,
        weather: row ? Number(row.AverageDelay_WEATHER_DELAY) : 0,
        carrier: row ? Number(row.AverageDelay_CARRIER_DELAY) : 0,
        nas: row ? Number(row.AverageDelay_NAS_DELAY) : 0,
        security: row ? Number(row.AverageDelay_SECURITY_DELAY) : 0,
        lateAircraft: row ? Number(row.AverageDelay_LATE_AIRCRAFT_DELAY) : 0,
      };
    }));
  }, [selectedDate, selectedAirlines, airlinesRawData, airlineNames, selectedAirports, airportsRawData, airportNames, dataType]);

  const handleDateChange = useCallback((date: Date) => setSelectedDate(date), []);

  const handleAirlineSelection = (code: string) => {
    setSelectedAirlines(prev => {
      if (prev.includes(code)) {
        return prev.filter(a => a !== code);
      }
      else {
        return [...prev, code];
      }
    });
  }

  const handleAirportSelection = (code: string) => {
    setSelectedAirports(prev => {
      if (prev.includes(code)) {
        return prev.filter(a => a !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const stopAutoplay = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startAutoplay = useCallback(() => {
    setIsPlaying(true);
    intervalRef.current = window.setInterval(() => {
      setSelectedDate(prev => {
        const year = prev.getFullYear();
        const month = prev.getMonth();
        const current = ((year - CONFIG.DATE_RANGE.minDate.getFullYear()) * 12) + month;
        const next = current + 1;

        return next >= CONFIG.DATE_RANGE.totalMonths
          ? CONFIG.DATE_RANGE.minDate
          : new Date(
            Math.floor(next / 12) + CONFIG.DATE_RANGE.minDate.getFullYear(),
            next % 12,
            1
          );
      });
    }, CONFIG.AUTOPLAY_INTERVAL);
  }, [CONFIG.DATE_RANGE]);

  const toggleAutoplay = useCallback(() => {
    isPlaying ? stopAutoplay() : startAutoplay();
  }, [isPlaying, stopAutoplay, startAutoplay]);

  const handleClearAllAirlines = () => {
    setSelectedAirlines([]);
  };

  const handleClearAllAirports = () => {
    setSelectedAirports([]);
  };

  return (
    <>
      <div className='delay-section-content'>
        <h2>Comparing Delays 📊</h2>
        <p>
          Let's do a <b>deeper dive</b> into comparing the delays and the different delay types!
        </p>
        <p>
          In our dataset, five causes of delays are recorded, each with its own color in the bar chart:
          <ul>
            <li>🌤️ <b>Weather</b> - Delays caused by weather conditions.</li>
            <li>✈️ <b>Carrier</b> - Delays caused by the airline's operations.</li>
            <li>🛩️ <b>NAS</b> - Delays caused by the National Airspace System (NAS), which includes air traffic control and other system-wide factors, such as congestion, equipment outages, etc.</li>
            <li>🔒 <b>Security</b> - Delays caused by security checks and procedures.</li>
            <li>🕒 <b>Late Aircraft</b> - Delays caused by the previous flight of the aircraft.</li>
          </ul>
        </p>
        <p>
          You can <b>select</b> the airlines or airports you want to compare, and see how their delays change over time. For example, let's try comparing Delta, American, and United airlines! To do so, first de-select the five selected airlines by clicking the blue rows, then search for the three airlines in the search bar and select them.
        </p>
        <p>
          By following the comparison above over time, we see that there is <b>no significant difference</b> in the delays of these three airlines. However, certain patterns emerge; for example, there is almost no <b>🔒 Security</b> delay for any of the airlines, with some exceptions, e.g., in November 2013. The majority of the delays are caused by the reasons <b>✈️ Carrier</b> and <b>🕒 Late Aircraft</b>, while <b>🌤️ Weather</b> contributes to a smaller portion of the delays.
        </p>
      </div>
      <div className={`airline-delay-section ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="airline-delay-content">
          <div className="airline-selection">
            <div style={{ marginLeft: -20, marginBottom: 15 }}>
              <AirportAirlineSelector
                options={dataTypeOptions}
                selectedValue={dataType}
                onChange={(newValue) => {
                  setDataType(newValue);
                }}
              />
            </div>

            {dataType === 'airlines' ?
              <ItemSelector
                availableItems={(availableAirlines).map(code => ({
                  code: code,
                  name: (airlineNames).get(code) || '',
                  city: '',
                  state: '',
                  flightCount: 0,
                }))}
                selectedItems={(selectedAirlines).map(code => code)}
                onItemToggle={handleAirlineSelection}
                onClearAll={handleClearAllAirlines}
                className="bar-plot-airport-selector"
                isAirline={true}
                hasClearButton={false}
              />
              :
              <ItemSelector
                availableItems={availableAirports.map(code => ({
                  code: code,
                  name: airportNames.get(code) || '',
                  city: '',
                  state: '',
                  flightCount: 0,
                }))}
                selectedItems={selectedAirports.map(code => code)}
                onItemToggle={handleAirportSelection}
                onClearAll={handleClearAllAirports}
                className="bar-plot-airport-selector"
                isAirline={true} // to have consistency in appearance to airlines for this component
                hasClearButton={false}
              />
            }
          </div>



          <div className="airline-delay-visualization">
            {dataType == "airlines" ?
              <AirlineDelayBarChart
                isFullscreen={isFullscreen}
                airlineData={filteredAirlineData}
                selectedAirlines={selectedAirlines}
                airlineNames={airlineNames}
              />
              :
              <AirlineDelayBarChart
                isFullscreen={isFullscreen}
                airlineData={filteredAirportData}
                selectedAirlines={selectedAirports}
                airlineNames={airportNames}
              />
            }
          </div>

        </div>

        <TimeSlider
          selectedDate={selectedDate}
          minDate={CONFIG.DATE_RANGE.minDate}
          maxDate={CONFIG.DATE_RANGE.maxDate}
          totalMonths={CONFIG.DATE_RANGE.totalMonths}
          onDateChange={handleDateChange}
          isPlaying={isPlaying}
          onToggleAutoplay={toggleAutoplay}
        />
      </div>
    </>

  );
};

export default AirlineDelaySection; 
