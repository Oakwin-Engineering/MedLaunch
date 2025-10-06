<script lang="ts">
  import { store } from "../../../store.svelte";
  import RankingsChart from "../../../components/RankingsChart.svelte";
  import YearSelector from "../../../components/YearSelector.svelte";

  const availableYears = Object.keys(
    store.allDashboards.providerRankings || {}
  );

  // Get current year
  const currentYear = String(new Date().getFullYear());

  // Local state for active year
  let activeYear = $state(currentYear);

  // Callback function to handle year changes
  function handleYearChange(year: string) {
    activeYear = year;
  }

  // Helper function to sort and extract data from rankings object
  function getRankingsData(metricName: string, year: string) {
    const yearData = store.allDashboards.providerRankings?.[year];
    if (!yearData || !yearData[metricName]) {
      return { data: [], categories: [] };
    }

    const entries = Object.entries(yearData[metricName])
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => (b as number) - (a as number));

    return {
      data: entries.map(([_, value]) => value as number),
      categories: entries.map(([name, _]) =>
        name.split(", ").reverse().join(" ")
      ),
    };
  }

  // Use $derived.by for reactive data that updates when activeYear changes
  const patientCountData = $derived.by(() =>
    getRankingsData("PatientCount", activeYear)
  );
  const rvuData = $derived.by(() => getRankingsData("RVUs", activeYear));
  const g2211Data = $derived.by(() => getRankingsData("G2211", activeYear));
  const sleepStudyData = $derived.by(() =>
    getRankingsData("SleepStudy", activeYear)
  );
</script>

<div class="mt-16 p-4 max-w-7xl mx-auto">
  <YearSelector {availableYears} {activeYear} onYearChange={handleYearChange} />

  <RankingsChart
    title="Total Patients Seen Year to Date {activeYear}"
    data={patientCountData.data}
    categories={patientCountData.categories}
    color="#3B82F6"
  />

  <RankingsChart
    title="RVUs Year to Date {activeYear}"
    data={rvuData.data}
    categories={rvuData.categories}
    color="#F97316"
  />

  <RankingsChart
    title="G2211 Codes Year to Date {activeYear}"
    data={g2211Data.data}
    categories={g2211Data.categories}
    color="#10B981"
  />

  <RankingsChart
    title="Sleep Studies Year to Date {activeYear}"
    data={sleepStudyData.data}
    categories={sleepStudyData.categories}
    color="#8B5CF6"
  />
</div>
