import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Card } from '../ui/Card';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatisticsChartProps {
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  data: any;
  height?: number;
  className?: string;
}

export const StatisticsChart: React.FC<StatisticsChartProps> = ({
  type,
  title,
  data,
  height = 300,
  className = ''
}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
            }
            return label;
          }
        }
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    } : undefined,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart' as const
    }
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={data} options={options} />;
      case 'bar':
        return <Bar data={data} options={options} />;
      case 'doughnut':
        return <Doughnut data={data} options={options} />;
      default:
        return null;
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </Card>
  );
};

// Preset chart configurations
export const chartConfigs = {
  // Line chart untuk progress pembelajaran
  learningProgress: (data: number[]) => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Progress Pembelajaran',
        data: data,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }),

  // Bar chart untuk distribusi nilai
  gradeDistribution: (data: number[]) => ({
    labels: ['A', 'B', 'C', 'D', 'E'],
    datasets: [
      {
        label: 'Jumlah Mahasiswa',
        data: data,
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(251, 191, 36)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1
      }
    ]
  }),

  // Doughnut chart untuk status tugas
  assignmentStatus: (completed: number, pending: number, overdue: number) => ({
    labels: ['Selesai', 'Pending', 'Terlambat'],
    datasets: [
      {
        data: [completed, pending, overdue],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  }),

  // Bar chart untuk aktivitas mingguan
  weeklyActivity: (data: number[]) => ({
    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
    datasets: [
      {
        label: 'Aktivitas',
        data: data,
        backgroundColor: 'rgba(168, 85, 247, 0.8)',
        borderColor: 'rgb(168, 85, 247)',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  }),

  // Multi-line chart untuk perbandingan kelas
  classComparison: (datasets: Array<{label: string, data: number[]}>) => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: [
        'rgb(59, 130, 246)',
        'rgb(34, 197, 94)',
        'rgb(251, 191, 36)',
        'rgb(168, 85, 247)'
      ][index],
      backgroundColor: [
        'rgba(59, 130, 246, 0.1)',
        'rgba(34, 197, 94, 0.1)',
        'rgba(251, 191, 36, 0.1)',
        'rgba(168, 85, 247, 0.1)'
      ][index],
      tension: 0.3
    }))
  })
};