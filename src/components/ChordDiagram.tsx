import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import './ChordDiagram.css';
import TimeSlider from './utils/TimeSlider/TimeSlider';
import AirportSelector from './utils/Selector/AirportSelector/AirportSelector';

interface Route {
  origin: string;
  destination: string;
  numFlights: number;
  averageDelay: number;
  year: number;
  month: number;
}

interface Airport {
  iataCode: string;
  airport: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

interface Props {
  className?: string;
  isFullscreen?: boolean;
}

interface AvailableAirport {
  code: string;
  airport: string;
  city: string;
  state: string;
  flightCount: number;
}

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

const ChordDiagram: React.FC<Props> = ({ className = '', isFullscreen = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const intervalRef = useRef<number | null>(null);
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(CONFIG.INITIAL_DATE);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [dateRange, setDateRange] = useState(CONFIG.DATE_RANGE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [availableAirports, setAvailableAirports] = useState<AvailableAirport[]>([]);

  const colorScale = useMemo(() => 
    d3.scaleSequential(d3.interpolateRdYlBu).domain([30, 0]), []
  );

  const getColor = useCallback((delay: number) => 
    colorScale(Math.min(30, Math.max(0, delay))), [colorScale]
  );

  const getFilteredData = useCallback(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    
    const filteredRoutes = routes.filter(route => 
      route.year === year && route.month === month
    );

    const filteredAirports = airports.filter(airport => 
      selectedAirports.includes(airport.iataCode)
    );
    
    const selectedRoutes = filteredRoutes.filter(route => 
      selectedAirports.includes(route.origin) && selectedAirports.includes(route.destination)
    );

    return { airports: filteredAirports, routes: selectedRoutes };
  }, [selectedDate, routes, airports, selectedAirports]);

  const handleDateChange = useCallback((date: Date) => setSelectedDate(date), []);

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
        const current = ((year - dateRange.minDate.getFullYear()) * 12) + month;
        const next = current + 1;
        
        return next >= dateRange.totalMonths 
          ? dateRange.minDate 
          : new Date(
              Math.floor(next / 12) + dateRange.minDate.getFullYear(),
              next % 12,
              1
            );
      });
    }, CONFIG.AUTOPLAY_INTERVAL);
  }, [dateRange]);

  const toggleAutoplay = useCallback(() => {
    isPlaying ? stopAutoplay() : startAutoplay();
  }, [isPlaying, stopAutoplay, startAutoplay]);

  const handleAirportToggle = useCallback((code: string) => {
    setSelectedAirports(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    );
  }, []);

  const handleClearAll = useCallback(() => setSelectedAirports([]), []);

  useEffect(() => {
    if (!tooltipRef.current) {
      tooltipRef.current = d3.select("body").append("div")
        .attr("class", "chord-tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "4px")
        .style("font-size", "12px")
        .style("pointer-events", "none")
        .style("z-index", "1000");
    }

    return () => {
      tooltipRef.current?.remove();
      tooltipRef.current = null;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        const [airportsRes, routesRes] = await Promise.all([
          fetch('./data/airports.csv'),
          fetch('./data/routes.csv')
        ]);
        
        const [airportsText, routesText] = await Promise.all([
          airportsRes.text(),
          routesRes.text()
        ]);

        const airportsData = d3.csvParse(airportsText, d => ({
          iataCode: d.IATA_CODE!,
          airport: d.AIRPORT!,
          city: d.CITY!,
          state: d.STATE!,
          country: d.COUNTRY!,
          latitude: +d.LATITUDE!,
          longitude: +d.LONGITUDE!
        }));

        const routesData = d3.csvParse(routesText, d => ({
          origin: d.Origin!,
          destination: d.Destination!,
          numFlights: +d.NumFlights!,
          averageDelay: +d.AverageDelay!,
          year: +d.Year!,
          month: +d.Month!
        }));

        const years = [...new Set(routesData.map(d => d.year))].sort();
        const [minYear, maxYear] = [Math.min(...years), Math.max(...years)];
        const [minDate, maxDate] = [new Date(minYear, 0, 1), new Date(maxYear, 11, 1)];
        const totalMonths = (maxYear - minYear + 1) * 12;

        setAirports(airportsData);
        setRoutes(routesData);
        setDateRange({ minDate, maxDate, totalMonths });
        setSelectedDate(minDate);

        const flightCounts = new Map<string, number>();
        routesData.forEach(route => {
          flightCounts.set(route.origin, (flightCounts.get(route.origin) || 0) + route.numFlights);
          flightCounts.set(route.destination, (flightCounts.get(route.destination) || 0) + route.numFlights);
        });

        const airportsList = Array.from(flightCounts.entries())
          .map(([code, count]) => {
            const info = airportsData.find(a => a.iataCode === code);
            return {
              code,
              airport: info?.airport || code,
              city: info?.city || '',
              state: info?.state || '',
              flightCount: count
            };
          })
          .sort((a, b) => b.flightCount - a.flightCount);

        setAvailableAirports(airportsList);
        setSelectedAirports(airportsList.slice(0, CONFIG.DEFAULT_SELECTED).map(a => a.code));
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!isFullscreen && isPlaying) stopAutoplay();
  }, [isFullscreen, isPlaying, stopAutoplay]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !svgRef.current || loading || airports.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { airports: filteredAirports, routes: filteredRoutes } = getFilteredData();
    
    if (filteredAirports.length === 0 || filteredRoutes.length === 0) {
      const container = containerRef.current;
      const { width, height: containerHeight } = container.getBoundingClientRect();
      const height = isFullscreen ? containerHeight * 0.8 : containerHeight;
      
      svg.attr("width", width)
        .attr("height", height)
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No flight data available for this time period");
      
      return;
    }

    const container = containerRef.current;
    const { width, height: containerHeight } = container.getBoundingClientRect();
    const height = isFullscreen ? containerHeight * 0.8 : containerHeight;
    const outerRadius = Math.min(width, height) * 0.35;
    const innerRadius = outerRadius * 0.9;
    const translateY = isFullscreen ? height * 0.4 : height / 2;

    svg.attr("width", width).attr("height", height);
    
    const g = svg.append("g").attr("transform", `translate(${width / 2},${translateY})`);

    const airportMap = new Map(filteredAirports.map((airport, i) => [airport.iataCode, i]));
    const matrix = Array(filteredAirports.length).fill(0).map(() => Array(filteredAirports.length).fill(0));

    filteredRoutes.forEach(route => {
      const sourceIndex = airportMap.get(route.origin);
      const targetIndex = airportMap.get(route.destination);

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        const [minIndex, maxIndex] = [Math.min(sourceIndex, targetIndex), Math.max(sourceIndex, targetIndex)];
        matrix[minIndex][maxIndex] += route.numFlights;
      }
    });

    for (let i = 0; i < matrix.length; i++) {
      for (let j = i + 1; j < matrix.length; j++) {
        matrix[j][i] = matrix[i][j];
      }
    }

    const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending);
    const chords = chord(matrix);
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);
    const ribbon = d3.ribbon().radius(innerRadius);

    const groups = g.append("g").selectAll("g").data(chords.groups).join("g");

    groups.append("path")
      .attr("fill", "#ddd")
      .attr("stroke", "#000")
      .attr("stroke-width", 0.5)
      .attr("d", arc as any)
      .on("mouseover", function(event, d) {
        const airport = filteredAirports[d.index];
        tooltipRef.current!.transition().duration(200).style("opacity", 0.9);
        tooltipRef.current!
          .html(`
            <strong>${airport.iataCode} - ${airport.airport}</strong><br/>
            ${airport.city}, ${airport.state}<br/>
            Total Flights: ${d.value}
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function(event) {
        tooltipRef.current!.style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltipRef.current!.transition().duration(500).style("opacity", 0);
      });

    groups.append("text")
      .each(d => { (d as any).angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("transform", d => {
        const angle = (d as any).angle * 180 / Math.PI;
        const rotation = angle < 180 ? angle - 90 : angle + 90;
        const translation = outerRadius + 10;
        const x = Math.cos((d as any).angle - Math.PI / 2) * translation;
        const y = Math.sin((d as any).angle - Math.PI / 2) * translation;
        return `translate(${x},${y}) rotate(${rotation})`;
      })
      .attr("text-anchor", d => ((d as any).angle < Math.PI ? "start" : "end"))
      .text(d => filteredAirports[d.index].iataCode)
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .style("fill", "#333");

    g.append("g")
      .attr("fill-opacity", 0.75)
      .selectAll("path")
      .data(chords)
      .join("path")
      .attr("d", ribbon as any)
      .attr("fill", d => {
        const sourceId = filteredAirports[d.source.index].iataCode;
        const targetId = filteredAirports[d.target.index].iataCode;
        const route = filteredRoutes.find(r => r.origin === sourceId && r.destination === targetId);
        return route ? getColor(route.averageDelay) : "#ccc";
      })
      .attr("stroke", "#000")
      .style("stroke-width", 0.5)
      .on("mouseover", function(event, d) {
        const sourceId = filteredAirports[d.source.index].iataCode;
        const targetId = filteredAirports[d.target.index].iataCode;
        const route = filteredRoutes.find(r => r.origin === sourceId && r.destination === targetId);
        
        if (route) {
          tooltipRef.current!.transition().duration(200).style("opacity", .9);
          tooltipRef.current!.html(`
            <strong>${sourceId} ↔ ${targetId}</strong><br/>
            Flights: ${route.numFlights}<br/>
            Avg Delay: ${route.averageDelay.toFixed(1)} min
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        }
      })
      .on("mouseout", () => {
        tooltipRef.current!.transition().duration(500).style("opacity", 0);
      });
  }, [isFullscreen, selectedDate, airports, routes, loading, selectedAirports, getFilteredData, getColor]);

  if (loading) {
    return (
      <div className={`chord-diagram-container ${className} ${isFullscreen ? 'fullscreen' : ''}`}>
        <div className="loading-indicator">Loading flight data...</div>
      </div>
    );
  }

  return (
    <div className={`chord-diagram-container ${className} ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <svg ref={svgRef}></svg>
      
      {isFullscreen && (
        <>
          <AirportSelector
            availableAirports={availableAirports}
            selectedAirports={selectedAirports}
            onAirportToggle={handleAirportToggle}
            onClearAll={handleClearAll}
            className="chord-diagram-airport-selector"
          />
          
          <div className="color-legend">
            <div className="legend-title">Average Delay (minutes)</div>
            <div className="legend-gradient">
              <svg width="180" height="30" className="legend-svg">
                <defs>
                  <linearGradient id="delayGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={getColor(30)} />
                    <stop offset="25%" stopColor={getColor(22)} />
                    <stop offset="50%" stopColor={getColor(15)} />
                    <stop offset="75%" stopColor={getColor(7)} />
                    <stop offset="100%" stopColor={getColor(0)} />
                  </linearGradient>
                </defs>
                <rect x="0" y="5" width="180" height="20" fill="url(#delayGradient)" stroke="#ddd" strokeWidth="1" rx="10" />
              </svg>
              <div className="legend-labels">
                <span>30+</span>
                <span>22</span>
                <span>15</span>
                <span>7</span>
                <span>0</span>
              </div>
            </div>
          </div>
          
          <TimeSlider
            selectedDate={selectedDate}
            minDate={dateRange.minDate}
            maxDate={dateRange.maxDate}
            totalMonths={dateRange.totalMonths}
            onDateChange={handleDateChange}
            isPlaying={isPlaying}
            onToggleAutoplay={toggleAutoplay}
          />
        </>
      )}
    </div>
  );
};

export default ChordDiagram; 