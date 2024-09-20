
export const handleImageServiceRequest = async (event, variable, setChartData) => {
  const point = event.mapPoint;

  const url = new URL(variable.service + "/getSamples");

  url.searchParams.append("geometry", `${point.longitude},${point.latitude}`);
  url.searchParams.append("geometryType", "esriGeometryPoint");
  url.searchParams.append("returnFirstValueOnly", "false");
  url.searchParams.append("f", "json");

  const startDate = variable.datetimeRange?.[0] || Date.UTC(1950, 0, 1);
  const endDate = variable.datetimeRange?.[1] || Date.UTC(2100, 0, 31);
  url.searchParams.append("dimensionalName", `${new Date(startDate).toISOString()},${new Date(endDate).toISOString()}`);
  url.searchParams.append("interpolation", "RSP_NearestNeighbor");

  const mockData = {
    samples: Array.from({ length: 150 }, (_, i) => {
      const year = 1950 + i;
      const baseTemp = 70 + i * 0.1;
      return {
        attributes: {
          StdTime: Date.UTC(year, 0, 1),
          heatmax_ssp126: (baseTemp + Math.random() * 5).toFixed(2),
          heatmax_ssp245: (baseTemp + Math.random() * 7 + 2).toFixed(2),
          heatmax_ssp370: (baseTemp + Math.random() * 10 + 5).toFixed(2),
          heatmax_ssp585: (baseTemp + Math.random() * 15 + 10).toFixed(2),
        },
      };
    }),
  };

  try {
    const response = await fetch(url.toString(), { method: 'GET' });
    const results = await response.json();
    // const results = mockData;

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
            heatmax_ssp370: parseFloat(sample.attributes.heatmax_ssp370),
            heatmax_ssp585: parseFloat(sample.attributes.heatmax_ssp585),
          };
        } else {
          yearlyData[year].heatmax_ssp126 = Math.max(yearlyData[year].heatmax_ssp126, parseFloat(sample.attributes.heatmax_ssp126));
          yearlyData[year].heatmax_ssp245 = Math.max(yearlyData[year].heatmax_ssp245, parseFloat(sample.attributes.heatmax_ssp245));
          yearlyData[year].heatmax_ssp370 = Math.max(yearlyData[year].heatmax_ssp370, parseFloat(sample.attributes.heatmax_ssp370));
          yearlyData[year].heatmax_ssp585 = Math.max(yearlyData[year].heatmax_ssp585, parseFloat(sample.attributes.heatmax_ssp585));
        }
      });

      const chartData = Object.keys(yearlyData).map(year => ({
        x: year.toString(),
        heatmax_ssp126: yearlyData[year].heatmax_ssp126,
        heatmax_ssp245: yearlyData[year].heatmax_ssp245,
        heatmax_ssp370: yearlyData[year].heatmax_ssp370,
        heatmax_ssp585: yearlyData[year].heatmax_ssp585,
      }));

      setChartData(chartData);
    } else {
      setChartData([]);
    }

  } catch (err) {
    console.error('Error fetching data from ImageService:', err);
  }
};
