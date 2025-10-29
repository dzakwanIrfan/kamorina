'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PaginationMeta } from '@/types/pagination.types';
import { DataTableConfig } from '@/types/data-table.types';
import { DataTableToolbar } from './data-table-toolbar';

interface DataTableAdvancedProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: PaginationMeta;
  config?: DataTableConfig<TData>;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSearch?: (search: string) => void;
  onFiltersChange?: (filters: Record<string, any>) => void;
  onResetFilters?: () => void; 
  isLoading?: boolean;
}

export function DataTableAdvanced<TData, TValue>({
  columns: userColumns,
  data,
  meta,
  config,
  onPageChange,
  onPageSizeChange,
  onSearch,
  onFiltersChange,
  onResetFilters, 
  isLoading = false,
}: DataTableAdvancedProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [searchValue, setSearchValue] = React.useState('');
  const [filters, setFilters] = React.useState<Record<string, any>>({});

  // Add selection column if selectable
  const columns = React.useMemo(() => {
    if (config?.selectable) {
      return [
        {
          id: 'select',
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && 'indeterminate')
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className="translate-y-0.5"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className="translate-y-0.5"
            />
          ),
          enableSorting: false,
          enableHiding: false,
        },
        ...userColumns,
      ];
    }
    return userColumns;
  }, [config?.selectable, userColumns]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    manualPagination: true,
    pageCount: meta?.totalPages ?? -1,
    enableRowSelection: config?.selectable,
  });

  const handleSearch = (value: string) => {
    setSearchValue(value);
    const debounce = setTimeout(() => {
      onSearch?.(value);
    }, 500);

    return () => clearTimeout(debounce);
  };

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const handleResetFilters = () => {
    // Reset local state
    setSearchValue('');
    setFilters({});
    
    // Call parent reset handler
    onResetFilters?.();
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <DataTableToolbar
        table={table}
        config={config}
        searchValue={searchValue}
        onSearchChange={handleSearch}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onResetFilters={handleResetFilters} // Pass it down
      />

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2">
            <p className="text-sm text-muted-foreground">
              Showing {((meta.page - 1) * meta.limit) + 1} to{' '}
              {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} results
            </p>
            {config?.selectable && Object.keys(rowSelection).length > 0 && (
              <p className="text-sm font-medium text-primary">
                • {Object.keys(rowSelection).length} item dipilih
              </p>
            )}
          </div>
          <div className="flex items-center space-x-6 lg:space-x-8">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                value={`${meta.limit}`}
                onValueChange={(value) => onPageSizeChange?.(Number(value))}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={meta.limit} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {meta.page} of {meta.totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(1)}
                  disabled={!meta.hasPreviousPage}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(meta.page - 1)}
                  disabled={!meta.hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(meta.page + 1)}
                  disabled={!meta.hasNextPage}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(meta.totalPages)}
                  disabled={!meta.hasNextPage}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}