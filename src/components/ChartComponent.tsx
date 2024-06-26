import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chartjs-plugin-zoom';
import html2canvas from 'html2canvas';
import data from '../assets/data.json';
import { Chart, registerables } from 'chart.js';
import type { ChartOptions } from 'chart.js';

Chart.register(...registerables);

interface DataPoint {
  timestamp: string;
  value: number;
}

const ChartComponent: React.FC = () => {
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [timeframe, setTimeframe] = useState<string>('daily');

  useEffect(() => {
    const processChartData = (data: DataPoint[], timeframe: string): DataPoint[] => {
      if (timeframe === 'daily') {
        return data;
      } else if (timeframe === 'weekly') {
        return aggregateData(data, 'week');
      } else if (timeframe === 'monthly') {
        return aggregateData(data, 'month');
      }
      return data;
    };

    const aggregateData = (data: DataPoint[], unit: 'week' | 'month'): DataPoint[] => {
      const aggregatedData: { [key: string]: number[] } = {};

      data.forEach(point => {
        const date = new Date(point.timestamp);
        let key = '';

        if (unit === 'week') {
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
          key = weekStart.toISOString().split('T')[0];
        } else if (unit === 'month') {
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        if (!aggregatedData[key]) {
          aggregatedData[key] = [];
        }
        aggregatedData[key].push(point.value);
      });

      const result: DataPoint[] = Object.keys(aggregatedData).map(key => {
        const values = aggregatedData[key];
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        return { timestamp: key, value: avg };
      });

      return result;
    };

    const processedData = processChartData(data, timeframe);
    const chartData = {
      labels: processedData.map(point => point.timestamp),
      datasets: [
        {
          label: 'Value',
          data: processedData.map(point => point.value),
          fill: false,
          backgroundColor: 'rgba(75,192,192,0.4)',
          borderColor: 'rgba(75,192,192,1)',
        },
      ],
    };
    setChartData(chartData);
  }, [timeframe]);

  const handleExport = async () => {
    const chartElement = document.getElementById('chart');
    if (chartElement) {
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = 'chart.png';
      link.click();
    }
  };

  const handlePointClick = (event: any, elements: any) => {
    if (elements.length > 0) {
      const { index } = elements[0];
      const pointData = chartData.labels[index];
      alert(`Timestamp: ${pointData}, Value: ${chartData.datasets[0].data[index]}`);
    }
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      zoom: {
        pan: {
          enabled: true,
          mode: 'x',
        },
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'x',
        },
      },
    },
    onClick: handlePointClick,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <button onClick={() => setTimeframe('daily')}>Daily</button>
          <button onClick={() => setTimeframe('weekly')}>Weekly</button>
          <button onClick={() => setTimeframe('monthly')}>Monthly</button>
        </div>
        <button onClick={handleExport}>Export as PNG</button>
      </div>
      <div id="chart">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default ChartComponent;
