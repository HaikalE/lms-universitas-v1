import React, { useState, useMemo, useCallback } from 'react';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  EllipsisVerticalIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';

export interface Column<T> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  cell?: (value: any, row: T) => React.ReactNode;
  filter?: {
    type: 'text' | 'select' | 'date' | 'number';
    options?: { label: string; value: any }[];
  };
}

export interface AdvancedDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

const AdvancedDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  pagination,
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  onRowSelect,
  onRowClick,
  emptyMessage = 'No data available',
  className = ''
}: AdvancedDataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Get cell value
  const getCellValue = useCallback((row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor];
  }, []);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply search
    if (searchTerm && searchable) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(column => {
          const value = getCellValue(row, column);
          return String(value).toLowerCase().includes(term);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([columnId, filterValue]) => {
      if (filterValue !== '' && filterValue != null) {
        const column = columns.find(col => col.id === columnId);
        if (column) {
          filtered = filtered.filter(row => {
            const cellValue = getCellValue(row, column);
            
            if (column.filter?.type === 'select') {
              return cellValue === filterValue;
            } else if (column.filter?.type === 'number') {
              return Number(cellValue) >= Number(filterValue);
            } else {
              return String(cellValue).toLowerCase().includes(String(filterValue).toLowerCase());
            }
          });
        }
      }
    });

    // Apply sorting
    if (sortColumn && sortDirection) {
      const column = columns.find(col => col.id === sortColumn);
      if (column) {
        filtered.sort((a, b) => {
          const aValue = getCellValue(a, column);
          const bValue = getCellValue(b, column);
          
          let comparison = 0;
          if (aValue < bValue) comparison = -1;
          if (aValue > bValue) comparison = 1;
          
          return sortDirection === 'desc' ? -comparison : comparison;
        });
      }
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, filters, columns, getCellValue, searchable]);

  // Handle sorting
  const handleSort = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    if (!column?.sortable) return;

    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnId);
      setSortDirection('asc');
    }
  };

  // Handle row selection
  const handleRowSelect = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedRows(newSelected);
    
    if (onRowSelect) {
      const selectedData = Array.from(newSelected).map(i => processedData[i]);
      onRowSelect(selectedData);
    }
  };

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIndices = new Set(processedData.map((_, index) => index));
      setSelectedRows(allIndices);
      onRowSelect?.(processedData);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      columns.map(col => col.header).join(','),
      ...processedData.map(row =>
        columns.map(col => {
          const value = getCellValue(row, col);
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllSelected = selectedRows.size === processedData.length && processedData.length > 0;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < processedData.length;

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with search and actions */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            {filterable && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors
                  ${showFilters 
                    ? 'border-blue-300 bg-blue-50 text-blue-700' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <FunnelIcon className="w-4 h-4" />
                <span>Filters</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {selectable && selectedRows.size > 0 && (
              <span className="text-sm text-gray-600">
                {selectedRows.size} selected
              </span>
            )}
            
            {exportable && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Filters */}
        {showFilters && filterable && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns
                .filter(col => col.filterable)
                .map(column => (
                  <div key={column.id} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      {column.header}
                    </label>
                    
                    {column.filter?.type === 'select' && column.filter.options ? (
                      <select
                        value={filters[column.id] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [column.id]: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">All</option>
                        {column.filter.options.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={column.filter?.type || 'text'}
                        value={filters[column.id] || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, [column.id]: e.target.value }))}
                        placeholder={`Filter ${column.header}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                ))
              }
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setFilters({})}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              
              {columns.map(column => (
                <th
                  key={column.id}
                  className={`
                    px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                    ${column.width || ''}
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUpIcon 
                          className={`w-3 h-3 ${sortColumn === column.id && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`} 
                        />
                        <ChevronDownIcon 
                          className={`w-3 h-3 -mt-1 ${sortColumn === column.id && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`} 
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => (
                <tr
                  key={index}
                  className={`
                    hover:bg-gray-50 transition-colors
                    ${selectedRows.has(index) ? 'bg-blue-50' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(index)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleRowSelect(index, e.target.checked);
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  
                  {columns.map(column => {
                    const value = getCellValue(row, column);
                    return (
                      <td key={column.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {column.cell ? column.cell(value, row) : String(value)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} results
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              {[10, 25, 50, 100].map(size => (
                <option key={size} value={size}>{size} per page</option>
              ))}
            </select>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => pagination.onPageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 text-sm">
                Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              
              <button
                onClick={() => pagination.onPageChange(pagination.page + 1)}
                disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedDataTable;