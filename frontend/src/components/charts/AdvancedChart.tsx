import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

export interface ChartDataPoint {
  [key: string]: any;
}

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'radialBar';
  data: ChartDataPoint[];
  xAxisKey?: string;
  yAxisKey?: string;
  valueKey?: string;
  nameKey?: string;
  colors?: string[];
  title?: string;
  subtitle?: string;
  height?: number;
  width?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  customTooltip?: (props: any) => React.ReactNode;
  formatValue?: (value: any) => string;
  formatLabel?: (label: any) => string;
  gradientColors?: {
    start: string;
    end: string;
  };
  strokeWidth?: number;
  curve?: 'monotone' | 'linear' | 'step' | 'basis' | 'natural' | 'monotoneX' | 'monotoneY';
  animate?: boolean;
}

interface AdvancedChartProps {
  config: ChartConfig;
  className?: string;
  loading?: boolean;
  error?: string;
}

const DEFAULT_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#F97316', // orange-500
  '#84CC16', // lime-500
  '#EC4899', // pink-500
  '#6B7280'  // gray-500
];

const AdvancedChart: React.FC<AdvancedChartProps> = ({
  config,
  className = '',
  loading = false,
  error
}) => {
  const {
    type,
    data,
    xAxisKey = 'x',
    yAxisKey = 'y',
    valueKey = 'value',
    nameKey = 'name',
    colors = DEFAULT_COLORS,
    title,
    subtitle,
    height = 400,
    width = '100%',
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    customTooltip,
    formatValue = (value) => value?.toLocaleString() || '',
    formatLabel = (label) => label || '',
    gradientColors,
    strokeWidth = 2,
    curve = 'monotone',
    animate = true
  } = config;

  // Custom tooltip component
  const CustomTooltip = useMemo(() => {
    if (customTooltip) {
      return customTooltip;
    }

    return ({ active, payload, label }: any) => {
      if (!active || !payload || !payload.length) {
        return null;
      }

      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          {label && (
            <p className="font-medium text-gray-900 mb-2">
              {formatLabel(label)}
            </p>
          )}
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">
                {entry.name || entry.dataKey}:
              </span>
              <span className="text-sm font-medium text-gray-900">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    };
  }, [customTooltip, formatValue, formatLabel]);

  // Gradient definition for area charts
  const gradientId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg border border-gray-200 ${className}`} style={{ height }}>
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-500 text-sm">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg border border-red-200 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-600 font-medium">Error loading chart</p>
          <p className="text-red-500 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg border border-gray-200 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">📊</div>
          <p className="text-gray-500 font-medium">No data available</p>
          <p className="text-gray-400 text-sm mt-1">Chart will appear when data is loaded</p>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    const commonProps = {
      data,
      width: typeof width === 'string' ? undefined : width,
      height
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatLabel}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatValue}
            />
            {showTooltip && <Tooltip content={CustomTooltip} />}
            {showLegend && <Legend />}
            <Line
              type={curve as any}
              dataKey={yAxisKey}
              stroke={colors[0]}
              strokeWidth={strokeWidth}
              dot={{ fill: colors[0], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colors[0], strokeWidth: 2 }}
              animationDuration={animate ? 1000 : 0}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={gradientColors?.start || colors[0]}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={gradientColors?.end || colors[0]}
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatLabel}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatValue}
            />
            {showTooltip && <Tooltip content={CustomTooltip} />}
            {showLegend && <Legend />}
            <Area
              type={curve as any}
              dataKey={yAxisKey}
              stroke={colors[0]}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              strokeWidth={strokeWidth}
              animationDuration={animate ? 1000 : 0}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
            <XAxis 
              dataKey={xAxisKey} 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatLabel}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tickFormatter={formatValue}
            />
            {showTooltip && <Tooltip content={CustomTooltip} />}
            {showLegend && <Legend />}
            <Bar
              dataKey={yAxisKey}
              fill={colors[0]}
              radius={[4, 4, 0, 0]}
              animationDuration={animate ? 1000 : 0}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            {showTooltip && <Tooltip content={CustomTooltip} />}
            {showLegend && <Legend />}
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={Math.min(height * 0.35, 120)}
              dataKey={valueKey}
              nameKey={nameKey}
              animationDuration={animate ? 1000 : 0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={colors[index % colors.length]} 
                />
              ))}
            </Pie>
          </PieChart>
        );

      case 'radialBar':
        return (
          <RadialBarChart
            {...commonProps}
            cx="50%"
            cy="50%"
            innerRadius="10%"
            outerRadius="80%"
          >
            {showTooltip && <Tooltip content={CustomTooltip} />}
            {showLegend && <Legend />}
            <RadialBar
              dataKey={valueKey}
              cornerRadius={4}
              fill={colors[0]}
              animationDuration={animate ? 1000 : 0}
            />
          </RadialBarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      {/* Chart Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Chart Container */}
      <div style={{ width, height }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdvancedChart;