
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
    samples: Array.from({ length: 151 }, (_, i) => {
      const year = 1950 + i;
      const baseTemp = 70 + i * 0.1;
      return {
        attributes: {
          StdTime: Date.UTC(year, 0, 1),
          tasmax_ssp126: (baseTemp + Math.random() * 5).toFixed(0),
          tasmax_ssp245: (baseTemp + Math.random() * 7 + 2).toFixed(0),
          tasmax_ssp370: (baseTemp + Math.random() * 10 + 5).toFixed(0),
          tasmax_ssp585: (baseTemp + Math.random() * 15 + 10).toFixed(0),
        },
      };
    }),
  };

  try {
    // const response = await fetch(url.toString(), { method: 'GET' });
    // const results = await response.json();
    const results = mockData;

    let invalidData = false;

    if (results.samples && results.samples.length > 0) {
      const yearlyData = {};

      for (const sample of results.samples) {
        const timestamp = sample.attributes.StdTime;
        const date = new Date(timestamp);
        const year = date.getUTCFullYear();

        const tasmax_ssp126 = parseFloat(sample.attributes.tasmax_ssp126);
        const tasmax_ssp245 = parseFloat(sample.attributes.tasmax_ssp245);
        const tasmax_ssp370 = parseFloat(sample.attributes.tasmax_ssp370);
        const tasmax_ssp585 = parseFloat(sample.attributes.tasmax_ssp585);

        if (
          isNaN(tasmax_ssp126) ||
          isNaN(tasmax_ssp245) ||
          isNaN(tasmax_ssp370) ||
          isNaN(tasmax_ssp585)
        ) {
          invalidData = true;
          break;
        }

        if (!yearlyData[year]) {
          yearlyData[year] = {
            tasmax_ssp126,
            tasmax_ssp245,
            tasmax_ssp370,
            tasmax_ssp585,
          };
        } else {
          yearlyData[year].tasmax_ssp126 = Math.max(
            yearlyData[year].tasmax_ssp126,
            tasmax_ssp126
          );
          yearlyData[year].tasmax_ssp245 = Math.max(
            yearlyData[year].tasmax_ssp245,
            tasmax_ssp245
          );
          yearlyData[year].tasmax_ssp370 = Math.max(
            yearlyData[year].tasmax_ssp370,
            tasmax_ssp370
          );
          yearlyData[year].tasmax_ssp585 = Math.max(
            yearlyData[year].tasmax_ssp585,
            tasmax_ssp585
          );
        }
      }

      if (!invalidData) {
        const chartData = Object.keys(yearlyData).map((year) => ({
          x: year.toString(),
          tasmax_ssp126: yearlyData[year].tasmax_ssp126,
          tasmax_ssp245: yearlyData[year].tasmax_ssp245,
          tasmax_ssp370: yearlyData[year].tasmax_ssp370,
          tasmax_ssp585: yearlyData[year].tasmax_ssp585,
        }));

        setChartData(chartData);
      }
    } else {
      invalidData = true;
    }

    return !invalidData;
  } catch (err) {
    console.error('Error fetching data from ImageService:', err);
    return false;
  }
};
