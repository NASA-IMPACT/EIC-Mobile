export const isMobileDevice = () => {
  return (
    /Mobi|Android/i.test(navigator.userAgent) ||
    window.matchMedia('(max-width: 767px)').matches
  );
};

export const convertValue = (value, variableType, targetUnit) => {
  if (value === 'N/A' || value == null) return value;

  const parsedValue = parseFloat(value);

  switch (variableType) {
    case 'max temperature':
      if (targetUnit === 'C') {
        return (((parsedValue - 32) * 5) / 9).toFixed(0);
      } else if (targetUnit === 'F') {
        return parsedValue.toFixed();
      }
      break;

    case 'precipitation':
      if (targetUnit === 'mm') {
        return parsedValue.toFixed(0);
      } else if (targetUnit === 'in') {
        return (parsedValue / 25.4).toFixed(1);
      }
      break;

    default:
      return parsedValue;
  }
};
