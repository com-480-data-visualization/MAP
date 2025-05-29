import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './AirlineDelayBarChart.css';

interface DelayData {
  airline: string;
  weather: number;
  carrier: number;
  nas: number;
  security: number;
  lateAircraft: number;
}

interface AirlineDelayBarChartProps {
  isFullscreen?: boolean;
  airlineData: DelayData[];
  selectedAirlines: string[];
  airlineNames: Map<string, string>;
}

const AirlineDelayBarChart: React.FC<AirlineDelayBarChartProps> = ({ isFullscreen = false, airlineData, selectedAirlines, airlineNames }) => {
  const [loading, setLoading] = useState(true);
  const prevAirlinesRef = useRef<Set<string>>(new Set());
  const [airlinesToDisplay, setAirlinesToDisplay] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const keyToText = {
    weather: 'Weather',
    carrier: 'Carrier',
    nas: 'NAS',
    security: 'Security',
    lateAircraft: 'Late Aircraft'
  };

  useEffect(() => {
    let airlinesToBeDisplayed: string[] = [];
    if (airlineData && airlineData.length > 0) {
      airlinesToBeDisplayed = airlineData.map(d => d.airline)
    } else {
      airlinesToBeDisplayed = selectedAirlines.map(code => airlineNames.get(code) || code);
    }
    setAirlinesToDisplay(airlinesToBeDisplayed);

    const isNewAirline = (code: string) => !prevAirlinesRef.current.has(code);

    if (!svgRef.current || !containerRef.current || airlinesToBeDisplayed.length <= 0) {
       d3.select(svgRef.current).selectAll("*").remove();
       setLoading(false);
       return;
    }

    setLoading(true);
    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 100, left: 60 };
    const containerHeight = isFullscreen ? (window.innerHeight - 100) : 550;
    const width = containerRef.current.clientWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
    .attr("width", containerRef.current.clientWidth)
    .attr("height", containerHeight).append("g");
    const chart = svg.attr("transform", `translate(${margin.left},${margin.top})`);

    let keys: string[] = [];
    if (airlineData && airlineData.length > 0) {
      keys = Object.keys(airlineData[0]).filter(k => k !== 'airline')
    }

    const stack = d3.stack<DelayData>().keys(keys);
    const stackedData = airlineData && airlineData.length > 0 ? stack(airlineData) : [];

    const colorScale = d3.scaleOrdinal<string>().domain(keys).range(["#74add1", "#fdae61", "#f46d43", "purple", "#8bc34b"]);

    const defs = svg.append("defs");
    keys.forEach(key => {
      const g = defs.append("linearGradient")
        .attr("id", `grad-${key}`)
        .attr("x1", "0%").attr("y1", "0%")
        .attr("x2", "0%").attr("y2", "100%");

      g.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.color(colorScale(key))!.brighter(0.3).formatHex());

      g.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.color(colorScale(key))!.darker(0.3).formatHex());
    });

    const xScale = d3.scaleBand().domain(airlinesToBeDisplayed).range([0, width]).padding(0.1);

    const maxY = d3.max(stackedData.length > 0 ? stackedData[stackedData.length - 1] : [], d => d[1]) || 0;

    const yScale = d3.scaleLinear().domain([0, maxY]).range([height, 0]);

    if (airlineData && airlineData.length > 0) {
       chart.append("g")
         .selectAll("g")
         .data(stackedData)
         .enter()
         .append("g")
         .attr("fill", d => `url(#grad-${d.key})`)
         .selectAll("rect")
         .data(d => d)
         .enter()
         .append("rect")
         .attr("x", d => xScale(d.data.airline) || 0)
         .attr("y", d => isNewAirline(d.data.airline) ? height : yScale(d[1]))
         .attr("height", d => isNewAirline(d.data.airline) ? 0 : (yScale(d[0]) - yScale(d[1])))
         .attr("width", xScale.bandwidth())
         .attr("stroke", "white")
         .attr("fill-opacity", 0.9)
         .attr("stroke-width", 1)
         .filter(d => isNewAirline(d.data.airline))
         .transition()
         .duration(750)
         .attr("y", d => yScale(d[1]))
         .attr("height", d => yScale(d[0]) - yScale(d[1]));
    }

    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .style("text-anchor", "middle")
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", "bold")
      .style("font-size", "12px");

    chart.append("g")
      .call(d3.axisLeft(yScale))
      .style("font-size", "12px");

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", margin.left - 95)
      .attr("x", -1.0 * containerHeight / 2.5)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-family", "Inter, sans-serif")
      .style("font-weight", "bold")
      .text("Delay (minutes)");

    if (keys.length > 0) {
      const legend = svg.append("g").attr("transform", `translate(${margin.left}, ${height + margin.top + 20})`);

      keys.forEach((key, i) => {
        const legendRow = legend.append("g").attr("transform", `translate(${i * 100}, 0)`);

        legendRow.append("rect")
          .attr("height", 15)
          .attr("width", 15)
          .attr("fill", `url(#grad-${key})`)
          .attr("fill-opacity", 0.9);

        legendRow.append("text")
          .attr("x", 20)
          .attr("y", 12.5)
          .attr("text-anchor", "start")
          .style("font-size", "14px")
          .style("font-family", "Inter, sans-serif")
          .text(keyToText[key as keyof typeof keyToText]); // used keyof/typeof to satisfy TS
      });
    }
    prevAirlinesRef.current = new Set(airlinesToBeDisplayed);
    setLoading(false);
  }, [isFullscreen, airlineData, selectedAirlines, airlineNames]);

  return (
    <div className={`airline-delay-chart-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
       {loading && <div className="loading-indicator">Loading chart...</div>}
       {!loading && <>
        {airlinesToDisplay.length > 0 && airlineData.length === 0 && <div className="loading-indicator">No data available.</div>}
        {airlinesToDisplay.length === 0 && <div className="loading-indicator">Please select at least one airline.</div>}
      </>}
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default AirlineDelayBarChart;