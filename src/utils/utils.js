
export const handleImageServiceRequest = async (event, currentJSON, setChartData, setVitalsData) => {
  const point = event.mapPoint;

  const url = new URL(currentJSON.service + "/getSamples");

  url.searchParams.append("geometry", `${point.longitude},${point.latitude}`);
  url.searchParams.append("geometryType", "esriGeometryPoint");
  url.searchParams.append("returnFirstValueOnly", "false");
  url.searchParams.append("f", "json");

  const startDate = currentJSON.datetimeRange?.[0] || Date.UTC(1950, 0, 1);
  const endDate = currentJSON.datetimeRange?.[1] || Date.UTC(2100, 0, 31);
  url.searchParams.append("time", `${new Date(startDate).toISOString()},${new Date(endDate).toISOString()}`);

  try {
    const response = await fetch(url.toString(), { method: 'GET' });
    const results = await response.json();

    if (results.samples && results.samples.length > 0) {
      const yearlyData = {};

      results.samples.forEach(sample => {
        const timestamp = sample.attributes.StdTime;
        const date = new Date(timestamp);
        const year = date.getUTCFullYear();

        if (!yearlyData[year]) {
          yearlyData[year] = {
            heatmax_ssp126: parseFloat(sample.attributes.heatmax_ssp126),
            heatmax_ssp245: parseFloat(sample.attributes.heatmax_ssp245),
            heatmax_ssp370: parseFloat(sample.attributes.heatmax_ssp370)
          };
        } else {
          yearlyData[year].heatmax_ssp126 = Math.max(yearlyData[year].heatmax_ssp126, parseFloat(sample.attributes.heatmax_ssp126));
          yearlyData[year].heatmax_ssp245 = Math.max(yearlyData[year].heatmax_ssp245, parseFloat(sample.attributes.heatmax_ssp245));
          yearlyData[year].heatmax_ssp370 = Math.max(yearlyData[year].heatmax_ssp370, parseFloat(sample.attributes.heatmax_ssp370));
        }
      });

      const chartData = Object.keys(yearlyData).map(year => ({
        x: year.toString(),
        heatmax_ssp126: yearlyData[year].heatmax_ssp126,
        heatmax_ssp245: yearlyData[year].heatmax_ssp245,
        heatmax_ssp370: yearlyData[year].heatmax_ssp370
      }));

      setChartData(chartData);
    } else {
      setChartData([]);
    }

  } catch (err) {
    console.error('Error fetching data from ImageService:', err);
  }
};
