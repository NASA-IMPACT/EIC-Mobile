interface Sample {
  attributes: {
    StdTime: number;
    [key: string]: string | number;
  };
}

interface FetchResponse {
  samples?: Sample[];
}

/**
 * Fetch data from the Image Service.
 * @param {object} event - The map click or drag event.
 * @param {object} variable - The selected variable for the dataset.
 * @returns {Promise<{chartData: object[], isValid: boolean}>} The fetched chart data and its validity.
 */
export const handleImageServiceRequest = async (
  event: { mapPoint: { latitude: number; longitude: number } },
  variable: { service: string; variable: string; datetimeRange: string[] }
): Promise<{ chartData: object[]; isValid: boolean }> => {
  const point = event.mapPoint;
  const url = new URL(variable.service + '/getSamples');

  url.searchParams.append('geometry', `${point.longitude},${point.latitude}`);
  url.searchParams.append('geometryType', 'esriGeometryPoint');
  url.searchParams.append('returnFirstValueOnly', 'false');
  url.searchParams.append('f', 'json');

  const [startDate, endDate] = variable.datetimeRange || [
    Date.UTC(1950, 0, 1),
    Date.UTC(2100, 0, 31)
  ];
  url.searchParams.append(
    'dimensionalName',
    `${new Date(startDate).toISOString()},${new Date(endDate).toISOString()}`
  );
  url.searchParams.append('interpolation', 'RSP_NearestNeighbor');

  try {
    // @ts-ignore
    const token = import.meta.env.VITE_GIS_TOKEN ?? '';
    // @ts-ignore
    const referer = import.meta.env.VITE_REFERER ?? 'https://earth.gov';
    const response = await fetch(url.toString(), {
      headers: {
        'X-Esri-Authorization': `Bearer ${token}`,
        Referer: referer
      }
    });

    const results: FetchResponse = await response.json();
    if (!results.samples || results.samples.length === 0) {
      return { chartData: [], isValid: false };
    }

    const yearlyData: Record<string, Record<string, number>> = {};
    const variableName = variable.variable.split('_')[0];

    for (const sample of results.samples) {
      const year = new Date(sample.attributes.StdTime).getUTCFullYear();
      const values = {
        [`${variableName}_ssp126`]: parseFloat(
          sample.attributes[`${variableName}_ssp126`] as string
        ),
        [`${variableName}_ssp245`]: parseFloat(
          sample.attributes[`${variableName}_ssp245`] as string
        ),
        [`${variableName}_ssp370`]: parseFloat(
          sample.attributes[`${variableName}_ssp370`] as string
        ),
        [`${variableName}_ssp585`]: parseFloat(
          sample.attributes[`${variableName}_ssp585`] as string
        )
      };

      if (Object.values(values).some(isNaN)) {
        return { chartData: [], isValid: false };
      }

      yearlyData[year] = yearlyData[year]
        ? Object.keys(values).reduce((acc, key) => {
            acc[key] = Math.max(yearlyData[year][key], values[key]);
            return acc;
          }, {} as Record<string, number>)
        : values;
    }

    const chartData = Object.keys(yearlyData).map((year) => ({
      x: year,
      ...yearlyData[year]
    }));

    return { chartData, isValid: true };
  } catch (err) {
    console.error('Error fetching data:', err);
    return { chartData: [], isValid: false };
  }
};
