<script lang="ts">
  import type { ApexOptions } from "apexcharts";
  import { Chart } from "@flowbite-svelte-plugins/chart";

  let { title, data, color, categories } = $props();

  // Make options reactive using $derived
  const options: ApexOptions = $derived({
    series: [
      {
        name: "Value",
        color: color,
        data: data,
      },
    ],
    chart: {
      sparkline: {
        enabled: false,
      },
      type: "bar",
      width: "100%",
      height: 350,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: true,
        easing: "easeinout",
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    fill: {
      opacity: 1,
      type: "gradient",
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.95,
        opacityTo: 0.75,
        stops: [0, 100],
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadiusApplication: "end",
        borderRadius: 6,
        dataLabels: {
          position: "top",
        },
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toLocaleString();
      },
      style: {
        fontSize: "11px",
        fontWeight: "600",
        colors: ["#1f2937"],
      },
      offsetY: -22,
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (val: number) {
          return val.toLocaleString();
        },
      },
      style: {
        fontSize: "12px",
        fontFamily: "Inter, sans-serif",
      },
    },
    xaxis: {
      labels: {
        show: true,
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: false,
        trim: false,
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          cssClass: "text-xs font-medium fill-gray-700 dark:fill-gray-300",
        },
        offsetY: 0,
      },
      categories: categories,
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: true,
        color: "#e5e7eb",
        height: 1,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        show: true,
        formatter: function (val: number) {
          return val.toLocaleString();
        },
        style: {
          fontFamily: "Inter, sans-serif",
          fontSize: "11px",
          fontWeight: 500,
          cssClass: "text-xs font-medium fill-gray-700 dark:fill-gray-300",
        },
      },
      axisBorder: {
        show: true,
        color: "#e5e7eb",
      },
    },
    grid: {
      show: true,
      strokeDashArray: 3,
      borderColor: "#e5e7eb",
      position: "back",
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        left: 10,
        right: 10,
        top: -15,
        bottom: 10,
      },
    },
    states: {
      hover: {
        filter: {
          type: "darken",
          value: 0.85,
        },
      },
      active: {
        filter: {
          type: "darken",
          value: 0.75,
        },
      },
    },
  });
</script>

<div class="mb-6">
  <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-3">{title}</h2>
  <Chart {options} />
</div>
