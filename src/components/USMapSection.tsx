import React, { useState, useRef, useEffect } from 'react';
import './USMapSection.css';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { FaExpand, FaCompress, FaTimes, FaSearchPlus, FaSearchMinus } from 'react-icons/fa';
import * as d3 from 'd3';
import AirportDelayTrendChart from './AirportDelayTrendChart';
import AirportRoutes from './AirportRoutes';
import TimeSlider from './utils/TimeSlider/TimeSlider';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const DEFAULT_CENTER: [number, number] = [-96, 36];

const USMapSection: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapScale, setMapScale] = useState(900);
  const [zoomFactor, setZoomFactor] = useState(1);
  const [baseScale, setBaseScale] = useState(900);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [selectedAirport, setSelectedAirport] = useState<typeof airports[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2009, 0, 1));
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [airports, setAirports] = useState<any[]>([]);
  const [airportsRawData, setAirportsRawData] = useState<any[]>([]);
  const [airportsMapsRawData, setAirportsMapsRawData] = useState<any[]>([]);
  const [routesRawData, setRoutesRawData] = useState<any[]>([]);
  const [quartilesByMonth, setQuartilesByMonth] = useState<Record<string, { q1: number; median: number; q3: number }>>({});
  const [selectedRoutes, setSelectedRoutes] = useState<any[]>([]);
  const [hoveredAirport, setHoveredAirport] = useState<null | { name: string; code: string; coordinates: [number, number]; business: number }>(null);

  const airportsByMonthRef = useRef<Record<string, any[]>>({});
  const routesByMonthRef = useRef<Record<string, any[]>>({}); // both for faster animation in play button...

  useEffect(() => {
    d3.csv('data/routes.csv').then(data => setRoutesRawData(data));
    d3.csv('data/airports-map.csv').then(dataMap => {
      d3.csv('data/airports.csv').then(data => {
        setAirportsMapsRawData(dataMap);
        setAirportsRawData(data);

        const quartiles: Record<string, { q1: number; median: number; q3: number }> = {};
        const delays: Record<string, number[]> = {};
        dataMap.forEach(row => {
          const key = `${row.Year}-${row.Month.toString().padStart(2, '0')}`;
          if (!delays[key]) delays[key] = [];
          delays[key].push(Number(row.AverageDelay));
        });
        Object.entries(delays).forEach(([k, arr]) => {
          const sorted = arr.sort((a, b) => a - b);
          quartiles[k] = {
            q1: d3.quantileSorted(sorted, 0.25) || 0,
            median: d3.quantileSorted(sorted, 0.5) || 0,
            q3: d3.quantileSorted(sorted, 0.75) || 0
          };
        });
        setQuartilesByMonth(quartiles);
      });
    });
  }, []);

  useEffect(() => {
    if (airportsRawData.length <= 0 || airportsMapsRawData.length <= 0) return;

    const mappingData = new Map<string, { name: string; code: string; coordinates: [number, number] }>();
    airportsRawData.forEach(d => {
      if (["PR", "VI", "AS", "GU", "MP"].includes(d.STATE)) return; // no states outside the map coordinates
      mappingData.set(d.IATA_CODE, {
        name: d.AIRPORT,
        code: d.IATA_CODE,
        coordinates: [parseFloat(d.LONGITUDE), parseFloat(d.LATITUDE)]
      });
    });

    const byMonthRef: Record<string, any[]> = {};
    airportsMapsRawData.forEach(row => {
      const key = `${row.Year}-${row.Month.toString().padStart(2, '0')}`;
      const currentData = mappingData.get(row.IATA_CODE);
      if (!currentData) {
        return;
      }
      const entry = { ...currentData, avgDelay: Number(row.AverageDelay), business: Number(row.NumFlights), delay: 0 };
      if (!byMonthRef[key]) byMonthRef[key] = [];
      byMonthRef[key].push(entry);
    });
    airportsByMonthRef.current = byMonthRef;

    const keyToStartWith = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`; // start showing what is already selected...
    if (!byMonthRef[keyToStartWith]) {
      setAirports([]);
    } else {
      setAirports(byMonthRef[keyToStartWith]);
    }
  }, [airportsRawData, airportsMapsRawData]);

  useEffect(() => {
    if (routesRawData.length <= 0) return;
    const byMonthDict: Record<string, any[]> = {};
    routesRawData.forEach(eachData => {
      const key = `${eachData.Year}-${eachData.Month.toString().padStart(2, '0')}`;
      if (!byMonthDict[key]) byMonthDict[key] = [];
      byMonthDict[key].push(eachData);
    });
    routesByMonthRef.current = byMonthDict;
  }, [routesRawData]);

  useEffect(() => {
    const key = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!airportsByMonthRef.current[key]) {
      setAirports([]);
    } else {
      setAirports(airportsByMonthRef.current[key]);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedAirport) {
      setSelectedRoutes([]);
      return;
    }
    const key = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!routesByMonthRef.current[key]) {
      setSelectedRoutes([]);
      return;
    }
    const monthRoutes = routesByMonthRef.current[key];
    setSelectedRoutes(monthRoutes.filter(r => r.Origin === selectedAirport.code || r.Destination === selectedAirport.code));
  }, [selectedAirport, selectedDate]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setSelectedAirport(null);
    setZoomFactor(1);
  };

  const handleZoomIn = () => {
    setZoomFactor(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setZoomFactor(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleWheel = (event: WheelEvent) => {
    if (!isFullscreen) return;

    event.preventDefault();

    const delta = event.deltaY > 0 ? -0.1 : 0.1;

    setZoomFactor(prev => {
      const newZoom = prev + delta;
      return Math.max(0.5, Math.min(2.5, newZoom));
    });
  };

  useEffect(() => {
    if (!isFullscreen || !mapRef.current) return;

    const mapElement = mapRef.current;

    mapElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      mapElement.removeEventListener('wheel', handleWheel);
    };
  }, [isFullscreen, zoomFactor]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const { width, height } = container.getBoundingClientRect();

      const aspectRatio = width / height;

      let calculatedBaseScale = 0;
      if (!isFullscreen) calculatedBaseScale = Math.min(width * 0.55, 900);
      else {
        if (aspectRatio > 1.8) {
          calculatedBaseScale = height * 0.8;
        } else {
          calculatedBaseScale = width * 0.45;
        }
      }

      setBaseScale(calculatedBaseScale);
      setMapScale(calculatedBaseScale * zoomFactor);
    };

    updateScale();

    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isFullscreen, zoomFactor]);

  useEffect(() => {
    setMapScale(baseScale * zoomFactor);
  }, [baseScale, zoomFactor]);

  const handleMarkerClick = (airport: typeof airports[0]) => {
    if (isFullscreen) {
      setSelectedAirport(airport);
    }
  };

  const closeAirportDetails = () => {
    setSelectedAirport(null);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const handleTimeChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const toggleAutoplay = () => {
    setIsPlaying(!isPlaying);
  };

  const getDelayColor = (delay: number) => {
    const q = quartilesByMonth[`${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}`];
    if (!q) return "#cccccc";
    if (delay <= q.q1) return "#00cc00";
    if (delay <= q.median) return "#99cc00";
    if (delay <= q.q3) return "#ffcc00";
    return "#cc0000";
  };

  const getAirportSize = (business: number) => {
    // TODO: set size dynamically based on zoom factor
    return 6 + (business / 10000) * 4;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isFullscreen) return;

    const timeSliderContainer = document.querySelector('.time-slider-container');
    if (timeSliderContainer && timeSliderContainer.contains(e.target as Node)) {
      return;
    }

    setIsDragging(true);
    setStartPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isFullscreen) return;
    setPosition({
      x: e.clientX - startPosition.x,
      y: e.clientY - startPosition.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedDate(prevDate => {
        if (prevDate.getFullYear() === 2018 && prevDate.getMonth() === 11) return new Date(2009, 0, 1); // reset to the beginning when we reach end
        const nextMonth = prevDate.getMonth() + 1;
        if (nextMonth === 12) { // if dec, go to jan of next year
          return new Date(prevDate.getFullYear() + 1, 0, 1);
        } else {
          return new Date(prevDate.getFullYear(), nextMonth, 1);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isFullscreen) setPosition({ x: 0, y: 0 });
  }, [isFullscreen]);

  function wrapSvgText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const context = document.createElement('canvas').getContext('2d')!;
    context.font = "bold 8px sans-serif";
    let lines: string[] = [];
    let currentLine = '';
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + ' ' + words[i];
      const { width } = context.measureText(testLine); // enabling multiline
      if (width > maxWidth && currentLine && currentLine.length >= 1) {
        lines.push(currentLine);
        currentLine = words[i];
        continue;
      }
      currentLine = testLine;
    }
    if (currentLine && currentLine.length >= 1) {
      lines.push(currentLine.trim());
    }
    return lines;
  }

  return (
    <div
      className={`usmap-container ${isFullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
    >
      <div className="usmap-content">
        <div className="usmap-text">
          <h2>Delays on the Map 🗺️</h2>
          <p>
            Let's take a quick look at the flight delays of different airports across the United States. Use the <b>full screen button</b> on the top right corner to <b>start interacting</b> with the map. The size of circles show the number of flights, while the colors (<b><span style={{ color: '#00cc00' }}>low</span>, <span style={{ color: '#99cc00' }}>medium</span>, <span style={{ color: '#ffcc00' }}>high</span>, <span style={{ color: '#cc0000' }}>very high</span></b>) indicate the delay. Feel free to zoom using the designated buttons on the bottom right on the screen, and then click on an airport to see its details, including delay trend over time.
          </p>
          <p>
            <i><b>Bonus:</b></i> clicking on an airport in the <b>full screen</b> mode will also show you the <b>routes</b> that are connected to it, and you can see the delays of those routes as well using the same colors. Give it a try!
          </p>
          <p>
            The map shows a highly variable distribution of delays across the US over time. However, a more clear pattern can be seen when you look at the size of the circles; airports such as <i>Hartsfield-Jackson Atlanta International Airport</i> (<b>ATL</b>) and <i>Chicago O'Hare International Airport</i> (<b>ORD</b>) have a significantly higher number of flights compared to others. Also, with the possible exception of <i>Denver International Airport</i> (<b>DEN</b>), most of the airports in the center of the US have a lower number of flights, which is likely due to the fact that they are not major hubs.
          </p>
        </div>

        <div
          className="usmap-visualization"
          ref={mapRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <div
            className="map-main-container"
            style={{
              transform: `translate(${position.x}px, ${position.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.1s ease'
            }}
          >
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{
                scale: mapScale,
                center: DEFAULT_CENTER
              }}
              style={{
                width: "100%",
                height: "100%"
              }}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map(geo => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#f2f2f2"
                      stroke="#d9d9d9"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { outline: 'none' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  ))
                }
              </Geographies>

              {selectedRoutes.length > 0 && (
                <AirportRoutes routes={selectedRoutes} airports={airports} getDelayColor={getDelayColor} />
              )}

              {airports
                .filter(airport => Number(airport.avgDelay) !== 0)
                .map((airport) => (
                  <Marker
                    key={airport.code}
                    coordinates={airport.coordinates}
                    onClick={() => handleMarkerClick(airport)}
                    className="airport-marker"
                    onMouseEnter={() => setHoveredAirport(airport)}
                    onMouseLeave={() => setHoveredAirport(null)}
                  >
                    <circle
                      r={getAirportSize(airport.business)}
                      fill={getDelayColor(Number(airport.avgDelay))}
                      stroke={selectedAirport?.code == airport.code ? "black" : "#fff"}
                      style={{ cursor: 'pointer' }}
                      strokeWidth={selectedAirport?.code == airport.code ? 3 : 2}
                      opacity={0.8}
                    />
                  </Marker>
                ))}

              {hoveredAirport && (
                <g style={{ pointerEvents: 'none' }}>
                  {(() => {
                    const lines = wrapSvgText(`${hoveredAirport.name} (${hoveredAirport.code})`, 100);
                    const tooltipHeight = 11 * lines.length + 8;
                    return (
                      <Marker coordinates={hoveredAirport.coordinates}>
                        <g>
                          <rect
                            x={-55} y={-getAirportSize(hoveredAirport.business) - tooltipHeight - 4}
                            width={110} height={tooltipHeight}
                            rx={6} fill="#fff" stroke="#ccc" strokeWidth={0.5} opacity={0.92} />
                          <text
                            x={0} y={-getAirportSize(hoveredAirport.business) - tooltipHeight + 6}
                            textAnchor="middle" fontSize="9px" fill="#222" fontWeight="bold" style={{ dominantBaseline: 'middle' }}>
                            {lines.map((line, i) => (
                              <tspan x={0} dy={i == 0 ? 0 : 13} key={i}>{line}</tspan>
                            ))}
                          </text>
                        </g>
                      </Marker>
                    );
                  })()}
                </g>
              )}
            </ComposableMap>
          </div>

          <button className="fullscreen-btn" onClick={toggleFullscreen}>
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>

          {isFullscreen && (
            <div className="zoom-controls">
              <button className="zoom-btn zoom-in" onClick={handleZoomIn} title="Zoom In">
                <FaSearchPlus />
              </button>
              <button className="zoom-btn zoom-out" onClick={handleZoomOut} title="Zoom Out">
                <FaSearchMinus />
              </button>
            </div>
          )}

          {isFullscreen && (
            <TimeSlider
              selectedDate={selectedDate}
              minDate={new Date(2009, 0, 1)}
              maxDate={new Date(2018, 11, 1)}
              onDateChange={handleTimeChange}
              isPlaying={isPlaying}
              onToggleAutoplay={toggleAutoplay}
            />
          )}

          {selectedAirport && isFullscreen && (
            <div className="airport-details-card">
              <button className="close-card-btn" onClick={closeAirportDetails} style={{ position: 'absolute', right: 10, top: 10 }}>
                <FaTimes />
              </button>
              <div className="airport-header">
                <h2 style={{ marginTop: '24px' }}>{selectedAirport.name} <span className="airport-code">({selectedAirport.code})</span></h2>
              </div>
              <div className="airport-stats">
                <div className="stat-item">
                  <span className="stat-label">Average Delay in {formatDate(selectedDate)}:</span>
                  <span className="stat-value">{selectedAirport.avgDelay}</span>
                </div>
              </div>
              <div className="airport-trend">
                <h3>Delay Trend (2009-2018)</h3>
                <AirportDelayTrendChart
                  key={`${selectedAirport.code}-${selectedDate.getTime()}`}
                  airportCode={selectedAirport.code}
                  airportsMapsRawData={airportsMapsRawData}
                  color={getDelayColor(Number(selectedAirport.avgDelay))}
                  selectedDate={selectedDate}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default USMapSection;
