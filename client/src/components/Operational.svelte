<script lang="ts">
  import { Chart } from "@flowbite-svelte-plugins/chart";

  interface Props {
    title: string;
    data: {
      [year: string]: {
        newPatients?: number[];
        charges?: number[];
        rvus?: number[];
        sleepStudy?: number[];
        payerPayment?: number[];
        patientPayment?: number[];
        totalReceipts?: number[];
      };
    };
    metric: "newPatients" | "charges" | "rvus" | "sleepStudy" | "payerPayment" | "patientPayment" | "totalReceipts";
  }

  let { title, data, metric }: Props = $props();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const yearColors: Record<string, string> = {
    "2022": "#9CA3AF", // Gray
    "2023": "#F59E0B", // Yellow/Orange
    "2024": "#3B82F6", // Blue
    "2025": "#10B981", // Green
  };

  // Create datasets for each year
  const datasets = Object.keys(data)
    .sort()
    .map((year) => {
      const yearData = data[year];
      const values = yearData[metric] || [];

      return {
        name: year,
        data: values,
        color: yearColors[year] || "#6B7280",
      };
    });

  const chartOptions = {
    chart: {
      height: "400px",
      maxWidth: "100%",
      type: "line",
      fontFamily: "Inter, sans-serif",
      dropShadow: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      x: {
        show: true,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: "10px",
        fontWeight: 600,
      },
      formatter: function (value: number) {
        if (value === 0) return "";
        if (metric === "charges" || metric === "payerPayment" || metric === "patientPayment" || metric === "totalReceipts") {
          return "$" + (value / 1000).toFixed(0) + "k";
        }
        return value.toLocaleString();
      },
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    grid: {
      show: true,
      strokeDashArray: 4,
      padding: {
        left: 2,
        right: 2,
        top: 0,
      },
    },
    series: datasets,
    legend: {
      show: true,
      position: "bottom",
    },
    xaxis: {
      categories: months,
      labels: {
        show: true,
        style: {
          fontFamily: "Inter, sans-serif",
          cssClass: "text-xs font-normal fill-gray-500",
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      show: true,
      labels: {
        formatter: function (value: number) {
          if (metric === "charges" || metric === "payerPayment" || metric === "patientPayment" || metric === "totalReceipts") {
            return "$" + (value / 1000).toFixed(0) + "k";
          }
          return value.toLocaleString();
        },
      },
    },
  };
</script>

<div class="w-full bg-white rounded-lg shadow p-4 md:p-6 mb-6">
  <div class="flex justify-between mb-5">
    <div>
      <h5 class="text-xl font-bold leading-none text-gray-900">
        {title}
      </h5>
    </div>
  </div>
  <Chart options={chartOptions} />
</div>
