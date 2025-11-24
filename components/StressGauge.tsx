import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface StressGaugeProps {
  value: number; // 0-100
  size?: number;
}

export const StressGauge: React.FC<StressGaugeProps> = ({ value, size = 200 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous

    const margin = 10;
    const radius = size / 2 - margin;
    const innerRadius = radius - 20;

    const g = svg
      .append("g")
      .attr("transform", `translate(${size / 2},${size / 2})`);

    // Scale for color
    const colorScale = d3.scaleLinear<string>()
      .domain([0, 50, 100])
      .range(["#22c55e", "#f59e0b", "#ef4444"]); // Green to Orange to Red

    // Arc Generator
    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .startAngle(-Math.PI / 1.5)
      .cornerRadius(10);

    // Background Arc
    g.append("path")
      .datum({ endAngle: Math.PI / 1.5 })
      .style("fill", "#1e293b")
      .attr("d", arc as any);

    // Foreground Arc (Value)
    const angleScale = d3.scaleLinear()
      .domain([0, 100])
      .range([-Math.PI / 1.5, Math.PI / 1.5]);

    g.append("path")
      .datum({ endAngle: angleScale(value) })
      .style("fill", colorScale(value))
      .attr("d", arc as any)
      .transition()
      .duration(750)
      .attrTween("d", function(d: any) {
        const i = d3.interpolate(d.startAngle || -Math.PI/1.5, d.endAngle);
        return function(t: number) {
          d.endAngle = i(t);
          return arc(d) || "";
        };
      });

    // Text Label
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "0.3em")
      .style("fill", "white")
      .style("font-size", "2rem")
      .style("font-weight", "bold")
      .text(Math.round(value));

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "2em")
      .style("fill", "#94a3b8")
      .style("font-size", "0.875rem")
      .text("STRESS LEVEL");

  }, [value, size]);

  return <svg ref={svgRef} width={size} height={size} />;
};
