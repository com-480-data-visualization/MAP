import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import './ParallelCoordinates.css';
import ItemSelector from './utils/Selector/ItemSelector/ItemSelector';
import AirportAirlineSelector from './utils/AirportAirlineSelector/AirportAirlineSelector';

interface AirlineData {
  Airline: string;
  Name: string;
  TotalFlights: number;
  CancellationRate: number;
  AverageFlightsPerDay: number;
  AverageDelay_CARRIER_DELAY: number;
  AverageDelay_WEATHER_DELAY: number;
  AverageDelay_NAS_DELAY: number;
  AverageDelay_SECURITY_DELAY: number;
  AverageDelay_LATE_AIRCRAFT_DELAY: number;
  AverageArrDelay: number;
  AverageDelay: number;
}

interface AirportData {
  IATA_CODE: string;
  AIRPORT: string;
  TotalFlights: number;
  CancellationRate: number;
  AverageFlightsPerDay: number;
  AverageDelay_CARRIER_DELAY: number;
  AverageDelay_WEATHER_DELAY: number;
  AverageDelay_NAS_DELAY: number;
  AverageDelay_SECURITY_DELAY: number;
  AverageDelay_LATE_AIRCRAFT_DELAY: number;
  AverageArrDelay: number;
  AverageDelay: number;
}

const ParallelCoordinates: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const brushesRef = useRef<{[key: string]: d3.BrushBehavior<unknown>}>({});
  const [data, setData] = useState<AirlineData[]>([]);
  const [selectedRanges, setSelectedRanges] = useState<{[key: string]: [number, number] | null}>({});
  
  const [dataType, setDataType] = useState<string>('airlines');
  const [airlineData, setAirlineData] = useState<AirlineData[]>([]);
  const [airportData, setAirportData] = useState<AirportData[]>([]);
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  const [availableAirports, setAvailableAirports] = useState<string[]>([]);
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedAirports, setSelectedAirports] = useState<string[]>([]);
  const [airlineNames, setAirlineNames] = useState<Map<string, string>>(new Map());
  const [airportNames, setAirportNames] = useState<Map<string, string>>(new Map());

  const dataTypeOptions = [
    { value: 'airlines', label: 'Airlines' },
    { value: 'airports', label: 'Airports' }
  ];

  const dimensions = [
    { key: 'TotalFlights', label: 'Total Flights' },
    { key: 'CancellationRate', label: 'Cancellation (%)' },
    { key: 'AverageFlightsPerDay', label: 'Flights/Day' },
    { key: 'AverageDelay_CARRIER_DELAY', label: 'Carrier Delay' },
    { key: 'AverageDelay_WEATHER_DELAY', label: 'Weather Delay' },
    { key: 'AverageDelay_NAS_DELAY', label: 'NAS Delay' },
    { key: 'AverageDelay_SECURITY_DELAY', label: 'Security Delay' },
    { key: 'AverageDelay_LATE_AIRCRAFT_DELAY', label: 'Late Aircraft Delay' },
    { key: 'AverageArrDelay', label: 'Arrival Delay' },
    { key: 'AverageDelay', label: 'Departure Delay' },
  ];

  const handleBrushEvent = useCallback((dimensionKey: string, scales: {[key: string]: d3.ScaleLinear<number, number>}) => {
    return function(event: any) {
      const selection = event.selection;
      if (selection && selection[0] !== selection[1]) {
        const range: [number, number] = [
          scales[dimensionKey].invert(selection[1]),
          scales[dimensionKey].invert(selection[0])
        ];
        setSelectedRanges(prev => ({ ...prev, [dimensionKey]: range }));
      } else if (event.type === 'end' && !selection) {
        setSelectedRanges(prev => ({ ...prev, [dimensionKey]: null }));
      }
    };
  }, []);

  const clearBrush = useCallback((dimensionKey: string) => {
    const brush = brushesRef.current[dimensionKey];
    if (brush && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const brushElement = svg.select(`.brush-${dimensionKey}`);
      brush.clear(brushElement as any);
      setSelectedRanges(prev => ({ ...prev, [dimensionKey]: null }));
    }
  }, []);

  useEffect(() => {
    d3.csv('data/airlines.csv').then(namesData => {
      const nameMap = new Map(namesData.map(d => [
        d.Code, 
        d.Description.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")
      ]));
      setAirlineNames(nameMap);
    });

    d3.csv('data/airlines-aggregated.csv').then(rawData => {
      const processedData = rawData.map(d => ({
        Airline: d.Airline || '',
        Name: d.Name || '',
        TotalFlights: +d.TotalFlights || 0,
        CancellationRate: +d.CancellationRate || 0,
        AverageFlightsPerDay: +d.AverageFlightsPerDay || 0,
        AverageDelay_CARRIER_DELAY: +d.AverageDelay_CARRIER_DELAY || 0,
        AverageDelay_WEATHER_DELAY: +d.AverageDelay_WEATHER_DELAY || 0,
        AverageDelay_NAS_DELAY: +d.AverageDelay_NAS_DELAY || 0,
        AverageDelay_SECURITY_DELAY: +d.AverageDelay_SECURITY_DELAY || 0,
        AverageDelay_LATE_AIRCRAFT_DELAY: +d.AverageDelay_LATE_AIRCRAFT_DELAY || 0,
        AverageArrDelay: +d.AverageArrDelay || 0,
        AverageDelay: +d.AverageDelay || 0,
      })) as AirlineData[];
      setAirlineData(processedData);
      const codes = processedData.map(d => d.Airline).sort();
      setAvailableAirlines(codes);
      setSelectedAirlines(codes.slice(0, 10));
    }).catch(error => {
      console.error('Error loading airline data:', error);
    });

    d3.csv('data/airports.csv').then(namesData => {
      const nameMap = new Map(namesData.map(d => [
        d.IATA_CODE, 
        d.AIRPORT.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")")
      ]));
      setAirportNames(nameMap);
    });

    d3.csv('data/airports-aggregated.csv').then(rawData => {
      const processedData = rawData.map(d => ({
        IATA_CODE: d.IATA_CODE || '',
        AIRPORT: d.AIRPORT || '',
        TotalFlights: +d.TotalFlights || 0,
        CancellationRate: +d.CancellationRate || 0,
        AverageFlightsPerDay: +d.AverageFlightsPerDay || 0,
        AverageDelay_CARRIER_DELAY: +d.AverageDelay_CARRIER_DELAY || 0,
        AverageDelay_WEATHER_DELAY: +d.AverageDelay_WEATHER_DELAY || 0,
        AverageDelay_NAS_DELAY: +d.AverageDelay_NAS_DELAY || 0,
        AverageDelay_SECURITY_DELAY: +d.AverageDelay_SECURITY_DELAY || 0,
        AverageDelay_LATE_AIRCRAFT_DELAY: +d.AverageDelay_LATE_AIRCRAFT_DELAY || 0,
        AverageArrDelay: +d.AverageArrDelay || 0,
        AverageDelay: +d.AverageDelay || 0,
      })) as AirportData[];
      setAirportData(processedData);
      const codes = processedData.map(d => d.IATA_CODE).filter(code => code !== '').sort();
      setAvailableAirports(codes);
      const topAirports = processedData.slice(0, 10).map(d => d.IATA_CODE);
      setSelectedAirports(topAirports);
    }).catch(error => {
      console.error('Error loading airport data:', error);
    });
  }, []);

  useEffect(() => {
    if (data.length <= 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const scales: {[key: string]: d3.ScaleLinear<number, number>} = {};
    dimensions.forEach(dim => {
      const extent = d3.extent(data, d => d[dim.key as keyof AirlineData] as number) as [number, number];
      scales[dim.key] = d3.scaleLinear()
        .domain(extent)
        .range([height, 0]);
    });

    const xScale = d3.scalePoint()
      .range([0, width])
      .domain(dimensions.map(d => d.key));

    dimensions.forEach(dim => {
      const axisX = xScale(dim.key)!;
      
      const axis = g.append('g')
        .attr('class', `axis axis-${dim.key}`)
        .attr('transform', `translate(${axisX}, 0)`)
        .call(d3.axisLeft(scales[dim.key]));

      axis.append('text')
        .attr('class', 'axis-label')
        .attr('text-anchor', 'middle')
        .attr('y', -20)
        .style('fill', '#333')
        .style('font-size', '12px')
        .style('font-weight', 'bold')
        .text(dim.label);

      const brush = d3.brushY()
        .extent([[-20, 0], [20, height]])
        .on('brush end', handleBrushEvent(dim.key, scales));

      brushesRef.current[dim.key] = brush;

      const brushGroup = axis.append('g')
        .attr('class', `brush brush-${dim.key}`)
        .call(brush);

      brushGroup.selectAll('.handle')
        .style('fill', '#666')
        .style('stroke', '#000')
        .style('stroke-width', 1);

      brushGroup.selectAll('.selection')
        .style('fill', 'rgba(0, 120, 200, 0.2)')
        .style('stroke', 'rgba(0, 120, 200, 0.8)')
        .style('stroke-width', 2);

      axis
        .style('cursor', 'pointer')
        .on('dblclick', () => clearBrush(dim.key));
    });

  }, [data, handleBrushEvent, clearBrush]);

  useEffect(() => {
    if (!data.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const g = svg.select('g');

    const margin = { top: 50, right: 100, bottom: 50, left: 100 };
    const width = 1200 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const scales: {[key: string]: d3.ScaleLinear<number, number>} = {};
    dimensions.forEach(dim => {
      const extent = d3.extent(data, d => d[dim.key as keyof AirlineData] as number) as [number, number];
      scales[dim.key] = d3.scaleLinear()
        .domain(extent)
        .range([height, 0]);
    });

    const xScale = d3.scalePoint()
      .range([0, width])
      .domain(dimensions.map(d => d.key));

    const colorScale = d3.scaleSequential(t => d3.interpolateRdYlGn(1 - t))
      .domain(d3.extent(data, d => d.AverageDelay) as [number, number]);

    const line = d3.line<{key: string, value: number}>()
      .x(d => xScale(d.key)!)
      .y(d => scales[d.key](d.value));

    const filteredData = data.filter(d => {
      return dimensions.every(dim => {
        const range = selectedRanges[dim.key];
        if (!range) return true;
        const value = d[dim.key as keyof AirlineData] as number;
        return value >= range[0] && value <= range[1];
      });
    });

    const revealDuration = 5000;

    let defs = svg.select<SVGDefsElement>('defs');
    if (defs.empty()) {
      defs = svg.append('defs');
    }

    const paths = g.selectAll<SVGPathElement, AirlineData>('.airline-path')
      .data(filteredData, (d: AirlineData) => d.Airline);

    paths.exit()
      .transition()
      .duration(300)
      .style('opacity', 0)
      .remove();

    const enterPaths = paths.enter().append('path')
      .attr('class', 'airline-path')
      .style('fill', 'none')
      .style('stroke-width', 2)
      .style('opacity', 0)
      .each(function(d) {
        const clipId = `clip-${(d.Airline || '').replace(/[^a-zA-Z0-9]/g, '')}`;

        defs.select(`#${clipId}`).remove();

        const clipPath = defs.append('clipPath')
          .attr('id', clipId);

        clipPath.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', 0)
          .attr('height', height)
          .transition()
          .duration(revealDuration)
          .ease(d3.easeCubicOut)
          .attr('width', width);

        d3.select(this).attr('clip-path', `url(#${clipId})`);
      });

    paths
      .attr('d', d => {
        const points = dimensions.map(dim => ({
          key: dim.key,
          value: d[dim.key as keyof AirlineData] as number
        }));
        return line(points);
      })
      .style('stroke', d => colorScale(d.AverageDelay))
      .style('opacity', 0.7);

    enterPaths
      .attr('d', d => {
        const points = dimensions.map(dim => ({
          key: dim.key,
          value: d[dim.key as keyof AirlineData] as number
        }));
        return line(points);
      })
      .style('stroke', d => colorScale(d.AverageDelay))
      .transition()
      .duration(300)
      .style('opacity', 0.7);

    const allPaths = paths.merge(enterPaths);
    
    allPaths
      .on('mouseover', function(event: MouseEvent, d: AirlineData) {
        d3.select(this)
          .style('stroke-width', 4)
          .style('opacity', 1);

        const tooltip = d3.select(tooltipRef.current!);
        tooltip.style('opacity', 1)
          .style('left', event.clientX + 'px')
          .style('top', event.clientY + 'px')
          .html(`
            <strong>${d.Name} (${d.Airline})</strong><br/>
            Total Flights: ${d.TotalFlights.toLocaleString()}<br/>
            Cancellation Rate: ${d.CancellationRate.toFixed(2)}%<br/>
            Average Delay: ${d.AverageDelay.toFixed(1)} min
          `);
      })
      .on('mouseout', function() {
        d3.select(this)
          .style('stroke-width', 2)
          .style('opacity', 0.7);

        d3.select(tooltipRef.current!).style('opacity', 0);
      });

  }, [data, selectedRanges]);

  useEffect(() => {
    if (dataType === 'airlines') {
      const filteredData = airlineData.filter(d => selectedAirlines.includes(d.Airline));
      setData(filteredData);
    } else {
      const convertedData = airportData
        .filter(d => selectedAirports.includes(d.IATA_CODE))
        .map(d => ({
          Airline: d.IATA_CODE,
          Name: d.AIRPORT,
          TotalFlights: d.TotalFlights,
          CancellationRate: d.CancellationRate,
          AverageFlightsPerDay: d.AverageFlightsPerDay,
          AverageDelay_CARRIER_DELAY: d.AverageDelay_CARRIER_DELAY,
          AverageDelay_WEATHER_DELAY: d.AverageDelay_WEATHER_DELAY,
          AverageDelay_NAS_DELAY: d.AverageDelay_NAS_DELAY,
          AverageDelay_SECURITY_DELAY: d.AverageDelay_SECURITY_DELAY,
          AverageDelay_LATE_AIRCRAFT_DELAY: d.AverageDelay_LATE_AIRCRAFT_DELAY,
          AverageArrDelay: d.AverageArrDelay,
          AverageDelay: d.AverageDelay,
        }));
      setData(convertedData);
    }
  }, [dataType, airlineData, airportData, selectedAirlines, selectedAirports]);

  const handleAirlineSelection = (code: string) => {
    setSelectedAirlines(prev => {
      if (prev.includes(code)) {
        return prev.filter(a => a !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleAirportSelection = (code: string) => {
    setSelectedAirports(prev => {
      if (prev.includes(code)) {
        return prev.filter(a => a !== code);
      } else {
        return [...prev, code];
      }
    });
  };

  const handleClearAllAirlines = () => {
    setSelectedAirlines([]);
  };

  const handleClearAllAirports = () => {
    setSelectedAirports([]);
  };

  return (
    <div className="parallel-coordinates-container">
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div className="parallel-coordinates-selector-wrapper">
          <div style={{ marginLeft: -20, marginBottom: 15 }}>
            <AirportAirlineSelector
              options={dataTypeOptions}
              selectedValue={dataType}
              onChange={(newValue) => setDataType(newValue)}
            />
          </div>
          {dataType === 'airlines' ? (
            <ItemSelector
              availableItems={availableAirlines.map(code => ({
                code: code,
                name: airlineNames.get(code) || code,
                city: '',
                state: '',
                flightCount: 0,
              }))}
              selectedItems={selectedAirlines}
              onItemToggle={handleAirlineSelection}
              onClearAll={handleClearAllAirlines}
              isAirline={true}
              hasClearButton={false}
              className="parallel-coordinates-item-selector"
            />
          ) : (
            <ItemSelector
              availableItems={availableAirports.map(code => ({
                code: code,
                name: airportNames.get(code) || code,
                city: '',
                state: '',
                flightCount: 0,
              }))}
              selectedItems={selectedAirports}
              onItemToggle={handleAirportSelection}
              onClearAll={handleClearAllAirports}
              isAirline={true} // for consistency in design
              hasClearButton={false}
              className="parallel-coordinates-item-selector"
            />
          )}
        </div>
        <div>
          <div className="visualization-container">
            <svg
              ref={svgRef}
              width={1200}
              height={600}
              className="parallel-coordinates-svg"
            />
            <div
              ref={tooltipRef}
              className="tooltip"
              style={{ opacity: 0 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParallelCoordinates; 