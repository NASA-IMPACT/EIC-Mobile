export const isMobileDevice = () => {
    return (
        /Mobi|Android/i.test(navigator.userAgent) ||
        window.matchMedia('(max-width: 767px)').matches
    );
};

export const convertToCelsius = (fahrenheit) => {
    return (((fahrenheit - 32) * 5) / 9).toFixed(0);
};

export const convertTemperature = (value, isFahrenheit) => {
    if (value === 'N/A') return value;
    return isFahrenheit ? value.toFixed(0) : convertToCelsius(value);
};
