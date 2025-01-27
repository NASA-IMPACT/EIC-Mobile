// @ts-nocheck
import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import crosshairPlugin from 'chartjs-plugin-crosshair';
import { FPS } from '../utils/constants';
import { getTemperatureColor } from '../utils/colors';
import { convertValue } from '../utils/helpers';
import { useAppContext, useVideoContext } from '../contexts';
import React from 'react';

export default function LineChart({ selectedIndex, isFahrenheit, isMm }) {
  const { chartData, selectedDataset } = useAppContext();
  const { currentFrame, videoRefs, setCurrentFrame } = useVideoContext();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const yAxisChartRef = useRef(null);
  const yAxisChartInstanceRef = useRef(null);
  const [loading, setLoading] = useState(true);

  const datasets = Object.keys(chartData[0] || {})
    .filter((key) => key.includes('ssp'))
    .map((key, index) => ({
      label: key.replace(/_/g, ' ').toUpperCase(),
      data: chartData.map((data) => data[key]),
      borderColor:
        selectedIndex === index ? '#FFFFFFBF' : 'rgba(239, 239, 240, 0.4)',
      borderWidth: selectedIndex === index ? 1 : 0.5,
      fill: false,
      pointRadius: 0
    }));

  const yAxisDatasets = Object.keys(chartData[0] || {})
    .filter((key) => key.includes('ssp'))
    .map((key) => ({
      label: key.replace(/_/g, ' ').toUpperCase(),
      data: chartData.map((data) => data[key]),
      borderWidth: 0,
      fill: false,
      pointRadius: 0
    }));

  useEffect(() => {
    if (chartRef.current && yAxisChartRef.current && chartData.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      const yAxisCtx = yAxisChartRef.current.getContext('2d');

      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      if (yAxisChartInstanceRef.current) {
        yAxisChartInstanceRef.current.destroy();
      }

      if (ctx) {
        chartInstanceRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.map((data) => data.x),
            datasets
          },
          options: {
            responsive: true,
            animation: false,
            maintainAspectRatio: false,
            events: [],
            layout: {
              padding: {
                left: 23,
                right: 20
              }
            },
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
                display: true,
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                  drawTicks: false,
                  drawOnChartArea: true
                },
                ticks: {
                  display: false,
                  maxTicksLimit: 5
                }
              }
            },
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#FFFFFF',
                bodyColor: '#FFFFFF',
                displayColors: false,
                callbacks: {
                  title: function (tooltipItems) {
                    return tooltipItems[0].label;
                  },
                  label: function (tooltipItem) {
                    const value = tooltipItem.raw;
                    const variableType =
                      selectedDataset === 'precipitation'
                        ? 'precipitation'
                        : 'max temperature';
                    const targetUnit =
                      variableType === 'max temperature'
                        ? isFahrenheit
                          ? 'F'
                          : 'C'
                        : variableType === 'precipitation'
                        ? isMm
                          ? 'mm'
                          : 'in'
                        : 'F';

                    return `${convertValue(
                      value,
                      variableType,
                      targetUnit
                    )} ${targetUnit}`;
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
                  const activePoint = chart.tooltip._active[0];
                  const ctx = chart.ctx;
                  const x = activePoint.element.x;
                  const y = activePoint.element.y;
                  const dataset = chart.data.datasets[activePoint.datasetIndex];
                  const temperature = dataset.data[activePoint.index];
                  const color = getTemperatureColor(temperature, 'F');
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

                  ctx.save();
                  ctx.beginPath();
                  ctx.arc(x, y, 5, 0, 2 * Math.PI);
                  ctx.fillStyle = color;
                  ctx.fill();
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
                ctx.globalCompositeOperation = 'destination-over';
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

        /**
         * This chart instance is only used to display sticky Y-axis labels on the left-hand side of the chart
         * No data points or lines are shown in this chart. Its purpose is to maintain fixed Y-axis labels
         * that align with the main chart as the user horizontally scrolls the main chart on mobiles.
         */
        yAxisChartInstanceRef.current = new Chart(yAxisCtx, {
          type: 'line',
          data: {
            labels: chartData.map((data) => data.x),
            datasets: yAxisDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            },
            scales: {
              y: {
                grid: {
                  color: 'rgba(255, 255, 255, 0.1)',
                  drawOnChartArea: false,
                  drawTicks: false,
                  left: 50
                },
                ticks: {
                  color: 'white',
                  maxTicksLimit: 5,
                  callback: (value) => {
                    const targetUnit =
                      selectedDataset === 'max temperature'
                        ? isFahrenheit
                          ? 'F'
                          : 'C'
                        : isMm
                        ? ''
                        : '';
                    return `${convertValue(
                      value,
                      selectedDataset,
                      targetUnit
                    )} ${targetUnit}`;
                  }
                },
                beginAtZero: false
              },
              x: {
                display: false
              }
            }
          }
        });

        setLoading(false);
      }

      const updateYAxis = (chart) => {
        const yAxis = chart.options.scales.y;
        yAxis.ticks.callback = (value) => {
          const targetUnit =
            selectedDataset === 'max temperature'
              ? isFahrenheit
                ? 'F'
                : 'C'
              : selectedDataset === 'precipitation'
              ? isMm
                ? 'mm'
                : 'in'
              : 'F';

          return `${convertValue(value, selectedDataset, targetUnit)}`;
        };
      };

      updateYAxis(chartInstanceRef.current);
      updateYAxis(yAxisChartInstanceRef.current);

      chartInstanceRef.current.update();
      yAxisChartInstanceRef.current.update();
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartData, selectedIndex, isFahrenheit, isMm]);

  /**
   * We are manually updating the chart's vertical line to display the current frame's data point.
   * Like this, the chart's tooltip is in sync with the video playback by highlighting the appropriate point on the chart.
   *
   * The way it works:
   * 1. The `chartData` array holds all the data points plotted on the chart
   * 2. The `currentFrame` is the current point in the video playback, and we use it to determine which point on the chart corresponds to this frame
   * 3. The `selectedIndex` represents the dataset currently being displayed (e.g., SSP126, SSP245)
   *
   */
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
                chartInstanceRef.current.getDatasetMeta(selectedIndex).data[
                  boundedIndex
                ]?.x || 0,
              y:
                chartInstanceRef.current.getDatasetMeta(selectedIndex).data[
                  boundedIndex
                ]?.y || 0
            }
          );

          chartInstanceRef.current.update();
        }
      };

      updateChartLineManually();
    }
  }, [chartData, currentFrame, selectedIndex]);

  useEffect(() => {
    const canvas = chartRef.current;

    const handleClick = (event) => {
      const chart = chartInstanceRef.current;
      const points = chart.getElementsAtEventForMode(
        event,
        'nearest',
        { intersect: false },
        true
      );
      if (points.length) {
        const index = points[0].index;
        const newFrame = index * FPS;
        setCurrentFrame(newFrame);
        videoRefs.current.forEach(
          (video) => (video.currentTime = newFrame / FPS)
        );
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [chartData, currentFrame]);

  /**
   * This effect adds touch event handlers for touch interactions on the chart
   * It handles touch-based interactions like selecting a point on the line chart
   *
   * We are following two specific rules here:
   * 1. When dragging or horizontally scrolling the chart on mobile, the selected point must not be updated and,
   * 2. When only tapping on the chart (without dragging) the selected point will be updated (the vertical line will move to the tapped location)
   *
   * - `touchstart` - The start of a touch interaction and disables other events (like hovering)
   * - `touchmove` - Detects if the user is dragging so we can differentiate between a tap and a drag
   * - `touchend` - If no drag occurs, we handle the touch like a click (e.g., selecting the nearest point on the chart)
   * After the touch ends, we re-enable tooltips and chart interactions.
   */
  useEffect(() => {
    const canvas = chartRef.current;
    let isDragging = false;

    const handleTouchStart = () => {
      isDragging = false;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.options.events = [];
      }
    };

    const handleTouchMove = () => {
      isDragging = true;
    };

    const handleTouchEnd = (event) => {
      if (!isDragging) {
        const chart = chartInstanceRef.current;
        const points = chart.getElementsAtEventForMode(
          event,
          'nearest',
          { intersect: false },
          true
        );
        if (points.length) {
          const index = points[0].index;
          setCurrentFrame(index * FPS);
        }
      }

      if (chartInstanceRef.current) {
        chartInstanceRef.current.options.plugins.tooltip.enabled = true;
        chartInstanceRef.current.options.interaction.mode = 'index';
        chartInstanceRef.current.update();
      }
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [chartData, currentFrame]);

  return (
    <div
      style={{ position: 'relative', overflow: 'hidden' }}
      className='h-[150px] md:h-[200px]'
    >
      <div
        style={{
          overflow: 'hidden',
          height: '100%'
        }}
        className='y-axis-canvas'
      >
        <canvas
          style={{
            width: '100%',
            position: 'absolute',
            top: 0
          }}
          ref={yAxisChartRef}
        ></canvas>
      </div>
      <canvas
        ref={chartRef}
        className='main-chart-canvas'
        style={{
          width: '100%',
          position: 'absolute',
          top: 0
        }}
      ></canvas>
      {loading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-full h-1/4 bg-neutral-950 bg-opacity-90 rounded-md animate-pulse'></div>
        </div>
      )}
    </div>
  );
}
