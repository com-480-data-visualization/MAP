import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import './AirportDelayTrendChart.css';

interface AirportDelayTrendChartProps {
  airportCode: string;
  airportsMapsRawData: any[];
  color: string;
  selectedDate: Date;
}

const AirportDelayTrendChart: React.FC<AirportDelayTrendChartProps> = ({ airportCode, airportsMapsRawData, color, selectedDate }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!svgRef.current) return; 
    if (!containerRef.current) return; 
    if (airportsMapsRawData.length <= 0) return;
    setLoading(true);

    d3.select(svgRef.current).selectAll("*").remove();

    const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    const chart = d3.select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight).append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const airportData = airportsMapsRawData
      .filter(d => d.IATA_CODE === airportCode)
      .sort((a, b) => {
        return new Date(Number(a.Year), Number(a.Month) - 1).getTime() - new Date(Number(b.Year), Number(b.Month) - 1).getTime();
      });

    const xScale = d3.scaleTime()
      .domain(d3.extent(airportData, d => new Date(Number(d.Year), Number(d.Month) - 1)) as [Date, Date])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(airportData, d => Number(d.AverageDelay)) || 0])
      .range([height, 0]);

    const line = d3.line<typeof airportData[0]>()
      .x(d => xScale(new Date(Number(d.Year), Number(d.Month) - 1)))
      .y(d => yScale(Number(d.AverageDelay)))
      .curve(d3.curveMonotoneX);

    chart.append("path")
      .datum(airportData)
      .attr("fill", "none")
      .attr("stroke", "lightblue")
      .attr("stroke-width", 2)
      .attr("d", line);

    chart.selectAll("circle")
      .data(airportData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(new Date(Number(d.Year), Number(d.Month) - 1)))
      .attr("cy", d => yScale(Number(d.AverageDelay)))
      .attr("r", 3)
      .attr("fill", "lightblue");

    chart.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale)
        .ticks(d3.timeMonth.every(3))
        .tickFormat(d => {
          if ((d as Date).getMonth() == 0) return `Jan ${d3.timeFormat("%Y")(d as Date)}`;
          return "";
        }))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    chart.append("g")
      .call(d3.axisLeft(yScale))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 10)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .text("Average Delay (minutes)");

    const selectedX = xScale(selectedDate);
    
    chart.append("line")
      .attr("class", "selected-date-line")
      .attr("x1", selectedX)
      .attr("x2", selectedX)
      .attr("y1", 0)
      .attr("y2", height)
      .attr("stroke", "#1976d2")
      .attr("stroke-dasharray", "6,6")
      .attr("stroke-width", 2)
      .attr("opacity", 0.7);

    const selectedData = airportData.find(d => {
      const dataDate = new Date(Number(d.Year), Number(d.Month) - 1);
      return dataDate.getFullYear() === selectedDate.getFullYear() && 
             dataDate.getMonth() === selectedDate.getMonth();
    });

    if (selectedData) {
      chart.append("circle")
        .attr("class", "selected-date-dot")
        .attr("cx", selectedX)
        .attr("cy", yScale(Number(selectedData.AverageDelay)))
        .attr("r", 5)
        .attr("fill", "#1976d2")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);
    }

    setLoading(false);
  }, [airportCode, airportsMapsRawData, color, selectedDate]);

  useEffect(() => {
    setLoading(true);
  }, [selectedDate]);

  return (
    <div className={`airport-delay-trend-chart`} ref={containerRef}>
      {loading && (
        <div className="loading-indicator">&nbsp;</div>
      )}
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default AirportDelayTrendChart; 