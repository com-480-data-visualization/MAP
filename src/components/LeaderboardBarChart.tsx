import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface LeaderboardBarChartProps {
  leaderboardData: Array<{ name: string; delay: number; code?: string }>;
  selectedDate: Date;
  dataType: 'airlines' | 'airports';
  sortOrder: 'asc' | 'desc';
  minDelayForColor: number;
  maxDelayForColor: number;
}

const margins = { top: 30, right: 40, bottom: 60, left: 150 };
const rankColors = {
  first: "#FFD700",
  second: "#C0C0C0", 
  third: "#CD7F32",
  default: "#64748b"
};

const getColor = (rank: number, total: number, sortOrder: string): string => {
  const ratio = rank / (total - 1);
  
  if (sortOrder === 'asc') {
    return d3.interpolateRgb("#10B981", "#F59E0B")(ratio);
  } else {
    return d3.interpolateRgb("#EF4444", "#F59E0B")(ratio);
  }
};

const getBadgeColor = (index: number): string => {
  if (index === 0) return rankColors.first;
  if (index === 1) return rankColors.second;
  if (index === 2) return rankColors.third;
  return rankColors.default;
};

const LeaderboardBarChart: React.FC<LeaderboardBarChartProps> = ({
  leaderboardData,
  selectedDate,
  dataType,
  sortOrder,
  minDelayForColor,
  maxDelayForColor
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !leaderboardData || leaderboardData.length <= 0) return;
    
    const svg = d3.select(svgRef.current);
    
    const sortedData = [...leaderboardData].sort((a, b) => {
      return sortOrder === 'asc' ? a.delay - b.delay : b.delay - a.delay;
    });

    const containerWidth = svgRef.current.parentElement?.clientWidth || 800;
    const barHeight = 55;
    const chartHeight = sortedData.length * barHeight + margins.top + margins.bottom;
    
    svg.attr("width", containerWidth).attr("height", chartHeight);

    let chart = svg.select<SVGGElement>(".chart-group");
    if (chart.empty()) {
      chart = svg.append("g")
        .attr("class", "chart-group")
        .attr("transform", `translate(${margins.left},${margins.top})`);
    }

    const maxDelay = d3.max(sortedData, d => d.delay) || 0;
    const xScale = d3.scaleLinear()
      .domain([0, maxDelay * 1.1])
      .range([0, containerWidth - margins.left - margins.right]);

    const yScale = d3.scaleBand()
      .domain(sortedData.map((_, i) => i.toString()))
      .range([0, sortedData.length * barHeight])
      .padding(0.2);

    let defs = svg.select<SVGDefsElement>("defs");
    if (defs.empty()) {
      defs = svg.append("defs");
    }
    
    const gradients = defs.selectAll<SVGLinearGradientElement, number>("linearGradient")
      .data(sortedData.map((_, i) => i));
    
    gradients.exit().remove();
    
    const gradientsEnter = gradients.enter()
      .append("linearGradient")
      .attr("x1", "0%")
      .attr("x2", "100%")
      .attr("y1", "0%")
      .attr("y2", "0%");
    
    gradientsEnter.append("stop")
      .attr("offset", "0%")
      .attr("stop-opacity", 0.8);
      
    gradientsEnter.append("stop")
      .attr("offset", "100%")
      .attr("stop-opacity", 0.6);

    const allGradients = gradientsEnter.merge(gradients);
    
    allGradients.attr("id", (d) => `gradient-${sortOrder}-${d}`);
    
    allGradients.each(function(d) {
      const gradient = d3.select(this);
      const color = getColor(d, sortedData.length, sortOrder);
      gradient.selectAll("stop").attr("stop-color", color);
    });

    const bars = chart.selectAll<SVGRectElement, typeof sortedData[0]>(".bar")
      .data(sortedData, (d: any) => d.code);

    bars.exit()
      .transition()
      .duration(600)
      .attr("width", 0)
      .style("opacity", 0)
      .remove();

    const barsEnter = bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", 0)
      .attr("width", 0)
      .attr("height", yScale.bandwidth())
      .attr("rx", yScale.bandwidth() / 2)
      .attr("stroke-width", 1)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.1))")
      .style("cursor", "pointer")
      .style("opacity", 0);

    const allBars = barsEnter.merge(bars);
    
    allBars
      .attr("fill", (_, i) => `url(#gradient-${sortOrder}-${i})`)
      .attr("stroke", (_, i) => getColor(i, sortedData.length, sortOrder));
    
    allBars
      .transition()
      .duration(800)
      .ease(d3.easeBackOut.overshoot(1.1))
      .attr("y", (_, i) => yScale(i.toString()) || 0)
      .attr("width", d => xScale(d.delay))
      .style("opacity", 1);

    const rankGroups = chart.selectAll<SVGGElement, number>(".rank-group")
      .data(sortedData.map((_, i) => i));

    rankGroups.exit().remove();

    const rankGroupsEnter = rankGroups.enter()
      .append("g")
      .attr("class", "rank-group");

    rankGroupsEnter.append("circle")
      .attr("r", 18)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .attr("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.15))");

    rankGroupsEnter.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("font-size", "14px")
      .style("font-weight", "700")
      .style("fill", "#ffffff");

    const allRankGroups = rankGroupsEnter.merge(rankGroups);
    
    allRankGroups
      .attr("transform", (_, i) => `translate(-50, ${(yScale(i.toString()) || 0) + yScale.bandwidth() / 2})`);

    allRankGroups.select("circle")
      .attr("fill", (_, i) => getBadgeColor(i));

    allRankGroups.select("text")
      .text((_, i) => i + 1);

    const labels = chart.selectAll<SVGTextElement, typeof sortedData[0]>(".label")
      .data(sortedData, (d: any) => d.code);

    labels.exit()
      .transition()
      .duration(600)
      .style("opacity", 0)
      .remove();

    const labelsEnter = labels.enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => {
        const barWidth = xScale(d.delay);
        return barWidth < 70 ? barWidth + 12 : 15;
      })
      .attr("dy", "0.35em")
      .style("font-size", "15px")
      .style("font-weight", "600")
      .style("fill", "#1e293b")
      .style("font-family", "'Inter', -apple-system, BlinkMacSystemFont, sans-serif")
      .style("opacity", 0);

    const allLabels = labelsEnter.merge(labels);
    
    allLabels
      .transition()
      .duration(800)
      .attr("x", d => {
        const barWidth = xScale(d.delay);
        const caption = d.name.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")") + ": " + d.delay.toFixed(1) + " min";
        return barWidth < caption.length * 6 ? barWidth + 12 : 15;
      })
      .attr("y", (_, i) => (yScale(i.toString()) || 0) + yScale.bandwidth() / 2)
      .style("opacity", 1)
      .text(d => d.name.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")") + ": " + d.delay.toFixed(1) + " min")
      .each(function(d, _) {
        const textElement = this as SVGTextElement;
        const barWidth = xScale(d.delay) - 30;
        const textWidth = textElement.getBBox().width;
        
        if (textWidth > barWidth && barWidth > 0) {
          const cleanedName = d.name.replace(/Inc./g, "").replace(/International/g, "Int'l").replace(/Airport/g, "").replace(" )", ")");
          let truncatedText = cleanedName;
          let currentWidth = textWidth;
          
          while (currentWidth > barWidth && truncatedText.length > 1) {
            truncatedText = truncatedText.slice(0, -1);
            d3.select(textElement).text(truncatedText + "...");
            currentWidth = textElement.getBBox().width;
          }
        }
      });

    let xAxisGroup = chart.select<SVGGElement>(".x-axis-group");
    if (xAxisGroup.empty()) {
      xAxisGroup = chart.append("g").attr("class", "x-axis-group");
    }
    
    xAxisGroup
      .attr("transform", `translate(0,${sortedData.length * barHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => `${d}min`));

    xAxisGroup.selectAll(".tick text")
      .style("font-size", "12px")
      .style("fill", "#64748b")
      .style("font-family", "'Inter', sans-serif");

    xAxisGroup.select(".domain").remove();

  }, [leaderboardData, selectedDate, dataType, sortOrder, minDelayForColor, maxDelayForColor]);

  return (
    <div style={{ padding: "0", backgroundColor: "transparent", borderRadius: "0" }}>
      <svg ref={svgRef} style={{ width: "100%", height: "auto" }}></svg>
    </div>
  );
};

export default LeaderboardBarChart; 