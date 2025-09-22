<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";
  import { transformToRevisNetworkHierarchy } from "../utils/utils";

  const { data } = $props();

  let container: HTMLDivElement;

  onMount(() => {
    if (!data) return;

    const hierarchy = transformToRevisNetworkHierarchy(data, {
      includeMetrics: true,
      metricKeys: ["operatingProfit"],
    });

    console.log(hierarchy);
    const dx = 30;
    const dy = 250;

    const root = d3.hierarchy<any>(hierarchy, (d: any) => d.children);
    const treeLayout = d3.tree().nodeSize([dx, dy]);
    treeLayout(root);

    // Get container dimensions
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .style("font", "12px sans-serif")
      .style("user-select", "none");

    const g = svg.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Draw links
    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkVertical()
          .x((d: any) => d.x)
          .y((d: any) => d.y)
      );

    // Function to determine node color based on operating profit
    const getNodeColor = (d: any) => {
      const operatingProfit = d.data.metrics?.operatingProfit?.total;

      if (operatingProfit === undefined || operatingProfit === null) {
        // Default color for nodes without operating profit data
        return d.children ? "#555" : "#999";
      }

      return operatingProfit >= 0 ? "#22c55e" : "#ef4444"; // Green for positive, red for negative
    };

    // Draw nodes
    const node = g
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`);

    node.append("circle").attr("fill", getNodeColor).attr("r", 6);

    node
      .append("text")
      .attr("dy", "1.2em")
      .attr("text-anchor", "middle")
      .text((d: any) => d.data.label)
      .clone(true)
      .lower()
      .attr("stroke", "white");

    // Center the tree horizontally and vertically
    const xMin = d3.min(root.descendants(), (d) => d.x)!;
    const xMax = d3.max(root.descendants(), (d) => d.x)!;
    const yMin = d3.min(root.descendants(), (d) => d.y)!;
    const yMax = d3.max(root.descendants(), (d) => d.y)!;

    const treeWidth = xMax - xMin;
    const treeHeight = yMax - yMin;

    const initialTranslateX = (containerWidth - treeWidth) / 2 - xMin;
    const initialTranslateY = (containerHeight - treeHeight) / 2 - yMin;

    g.attr(
      "transform",
      `translate(${initialTranslateX}, ${initialTranslateY})`
    );

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      svg.attr("viewBox", `0 0 ${newWidth} ${newHeight}`);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  });
</script>

<!-- Make sure the container takes full height -->
<div bind:this={container} class="w-full h-full min-h-screen"></div>
