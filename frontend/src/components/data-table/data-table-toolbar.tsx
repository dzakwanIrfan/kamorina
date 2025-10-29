'use client';

import { X, Search, Filter, ChevronDown } from 'lucide-react';
import { Table } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTableConfig, DataTableBulkAction } from '@/types/data-table.types';
import { Badge } from '@/components/ui/badge';

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  config?: DataTableConfig<TData>;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filters?: Record<string, any>;
  onFiltersChange?: (filters: Record<string, any>) => void;
  onResetFilters?: () => void; 
}

export function DataTableToolbar<TData>({
  table,
  config,
  searchValue = '',
  onSearchChange,
  filters = {},
  onFiltersChange,
  onResetFilters, 
}: DataTableToolbarProps<TData>) {
  const isFiltered = Object.keys(filters).length > 0 || searchValue.length > 0;
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const hasSelection = selectedRows.length > 0;

  const handleFilterChange = (filterId: string, value: any) => {
    const newFilters = { ...filters };
    if (value === undefined || value === null || value === '') {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }
    onFiltersChange?.(newFilters);
  };

  const clearFilters = () => {
    // Clear all filters and search
    onFiltersChange?.({});
    onSearchChange?.('');
    
    // Call parent reset handler to reset query params
    onResetFilters?.();
  };

  const executeBulkAction = async (action: DataTableBulkAction<TData>) => {
    const selectedData = selectedRows.map((row) => row.original);
    await action.onClick(selectedData);
    table.resetRowSelection();
  };

  return (
    <div className="space-y-4">
      {/* Bulk Actions Bar */}
      {hasSelection && config?.bulkActions && config.bulkActions.length > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-medium">
              {selectedRows.length} item dipilih
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {config.bulkActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={() => executeBulkAction(action)}
                disabled={action.disabled}
              >
                {action.icon && <action.icon className="mr-2 h-4 w-4" />}
                {action.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetRowSelection()}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          {/* Search */}
          {config?.searchable !== false && (
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={config?.searchPlaceholder || 'Cari...'}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-8"
              />
            </div>
          )}

          {/* Filter Button with Badge */}
          {config?.filterable && config?.filterFields && config.filterFields.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                  {Object.keys(filters).length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-2 rounded-sm px-1 font-normal"
                    >
                      {Object.keys(filters).length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[250px]">
                <DropdownMenuLabel>Filter Data</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="space-y-2 p-2">
                  {config.filterFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-sm font-medium">{field.label}</label>
                      {field.type === 'select' && field.options ? (
                        <Select
                          value={filters[field.id] || ''}
                          onValueChange={(value) =>
                            handleFilterChange(field.id, value)
                          }
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder={field.placeholder} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type || 'text'}
                          placeholder={field.placeholder}
                          value={filters[field.id] || ''}
                          onChange={(e) =>
                            handleFilterChange(field.id, e.target.value)
                          }
                          className="h-8"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Clear Filters */}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="h-10 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Toolbar Actions */}
          {config?.toolbarActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <action.icon className="mr-2 h-4 w-4" />}
              {action.label}
            </Button>
          ))}

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-auto hidden h-10 lg:flex">
                Columns
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== 'undefined' && column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Active Filters Display */}
      {Object.keys(filters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(filters).map(([key, value]) => {
            const field = config?.filterFields?.find((f) => f.id === key);
            if (!field) return null;

            const displayValue =
              field.type === 'select'
                ? field.options?.find((opt) => opt.value === value)?.label || value
                : value;

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                <span className="font-medium">{field.label}:</span>
                <span>{displayValue}</span>
                <button
                  onClick={() => handleFilterChange(key, undefined)}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}