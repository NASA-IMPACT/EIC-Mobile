import { useContext, useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { ChartDataContext } from '../contexts/AppContext';
import { VideoContext } from '../contexts/VideoContext';
import { FPS } from '../utils/constants';

export default function LineChart({ selectedIndex }) {
    const { chartData } = useContext(ChartDataContext);
    const { currentFrame, isPlaying, setIsPlaying } =
        useContext(VideoContext);
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const [loading, setLoading] = useState(true);
    const [wasPlaying, setWasPlaying] = useState(false);

    useEffect(() => {
        if (chartRef.current && chartData.length > 0) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            if (ctx) {
                chartInstanceRef.current = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: chartData.map((data) => data.x),
                        datasets: [
                            {
                                label: 'SSP126',
                                data: chartData.map(
                                    (data) => data.tasmax_ssp126
                                ),
                                borderColor:
                                    selectedIndex === 0
                                        ? 'steelblue'
                                        : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 0 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0,
                                borderWidth: 1
                            },
                            {
                                label: 'SSP245',
                                data: chartData.map(
                                    (data) => data.tasmax_ssp245
                                ),
                                borderColor:
                                    selectedIndex === 1
                                        ? 'green'
                                        : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 1 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0,
                                borderWidth: 1
                            },
                            {
                                label: 'SSP370',
                                data: chartData.map(
                                    (data) => data.tasmax_ssp370
                                ),
                                borderColor:
                                    selectedIndex === 2
                                        ? 'orange'
                                        : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 2 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0,
                                borderWidth: 1
                            },
                            {
                                label: 'SSP585',
                                data: chartData.map(
                                    (data) => data.tasmax_ssp585
                                ),
                                borderColor:
                                    selectedIndex === 3
                                        ? 'red'
                                        : 'rgba(239, 239, 240, 0.2)',
                                borderWidth: selectedIndex === 2 ? 2 : 0.5,
                                fill: false,
                                pointRadius: 0,
                                borderWidth: 1
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        animation: false,
                        maintainAspectRatio: false,
                        interaction: {
                            intersect: false,
                            mode: 'index'
                        },
                        scales: {
                            x: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    display: false,
                                    maxTicksLimit: 5
                                }
                            },
                            y: {
                                grid: {
                                    color: 'rgba(255, 255, 255, 0.1)'
                                },
                                ticks: {
                                    color: 'white',
                                    maxTicksLimit: 10
                                },
                                beginAtZero: false
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            },
                            tooltip: {
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                titleColor: '#FFD700',
                                bodyColor: '#FFFFFF',
                                displayColors: false,
                                callbacks: {
                                    title: function (tooltipItems) {
                                        return tooltipItems[0].label;
                                    },
                                    label: function (tooltipItem) {
                                        const datasetIndex =
                                            tooltipItem.datasetIndex;
                                        if (datasetIndex === selectedIndex) {
                                            return (
                                                Math.round(
                                                    tooltipItem.raw * 100
                                                ) /
                                                    100 +
                                                ' °F'
                                            );
                                        }
                                        return '';
                                    }
                                }
                            },
                            crosshair: {
                                line: {
                                    color: 'transparent',
                                    width: 1
                                },
                                snap: true,
                                sync: {
                                    enabled: true,
                                    group: 1,
                                    suppressTooltips: false
                                },
                                callbacks: {
                                    beforeZoom: function (start, end) {
                                        return true;
                                    },
                                    afterZoom: function (start, end) {}
                                }
                            }
                        }
                    },
                    plugins: [
                        crosshairPlugin,
                        {
                            id: 'verticalLinePlugin',
                            afterDraw: (chart) => {
                                if (chart.tooltip?._active?.length) {
                                    const activePoint =
                                        chart.tooltip._active[0];
                                    const ctx = chart.ctx;
                                    const x = activePoint.element.x;
                                    const topY = chart.scales.y.top;
                                    const bottomY = chart.scales.y.bottom;

                                    ctx.save();
                                    ctx.beginPath();
                                    ctx.moveTo(x, topY);
                                    ctx.lineTo(x, bottomY);
                                    ctx.lineWidth = 1;
                                    ctx.strokeStyle = '#FFFFFF';
                                    ctx.stroke();
                                    ctx.restore();
                                }
                            }
                        },
                        {
                            id: 'customCanvasBackgroundColor',
                            beforeDraw: (chart) => {
                                const ctx = chart.canvas.getContext('2d');
                                ctx.save();
                                ctx.globalCompositeOperation =
                                    'destination-over';
                                ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
                                const yAxisWidth = chart.scales.y.width;
                                ctx.fillRect(
                                    yAxisWidth,
                                    0,
                                    chart.width - yAxisWidth,
                                    chart.height
                                );
                                ctx.restore();
                            }
                        }
                    ]
                });

                setLoading(false);
            }
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartData, selectedIndex]);

    useEffect(() => {
        if (chartData.length > 0) {
            const updateChartLineManually = () => {
                if (chartInstanceRef.current) {
                    const totalDataPoints = chartData.length;
                    const currentIndex = Math.floor(currentFrame / FPS);
                    const boundedIndex = Math.max(
                        Math.min(currentIndex, totalDataPoints - 1),
                        0
                    );

                    chartInstanceRef.current.tooltip.setActiveElements(
                        [
                            {
                                datasetIndex: selectedIndex,
                                index: boundedIndex
                            }
                        ],
                        {
                            x:
                                chartInstanceRef.current.getDatasetMeta(
                                    selectedIndex
                                ).data[boundedIndex]?.x || 0,
                            y:
                                chartInstanceRef.current.getDatasetMeta(
                                    selectedIndex
                                ).data[boundedIndex]?.y || 0
                        }
                    );

                    chartInstanceRef.current.update();
                }
            };

            updateChartLineManually();
        }
    }, [chartData, currentFrame, selectedIndex]);

    return (
        <div
            style={{
                position: 'relative'
            }}
            className="h-[150px] md:h-[200px]"
            onMouseEnter={() => {
                setWasPlaying(isPlaying);
                setIsPlaying(false);
            }}
            onMouseLeave={() => {
                if (wasPlaying) setIsPlaying(true);
            }}
        >
            <canvas ref={chartRef} style={{ width: '100%' }}></canvas>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-1/4 bg-neutral-950 bg-opacity-90 rounded-md animate-pulse"></div>
                </div>
            )}
        </div>
    );
}