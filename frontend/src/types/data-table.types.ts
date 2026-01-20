export interface DataTableFilterField<TData = any> {
  id: string;
  label: string;
  placeholder?: string;
  options?: { label: string; value: string }[];
  type?: "text" | "select" | "date" | "dateRange" | "multiSelect";
}

export interface DataTableToolbarAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost" | "destructive";
  disabled?: boolean;
}

export interface DataTableBulkAction<TData = any> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (selectedRows: TData[]) => void | Promise<void>;
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
}

export interface DataTableConfig<TData = any> {
  searchable?: boolean;
  searchPlaceholder?: string;
  filterable?: boolean;
  filterFields?: DataTableFilterField<TData>[];
  selectable?: boolean;
  bulkActions?: DataTableBulkAction<TData>[];
  toolbarActions?: DataTableToolbarAction[];
  dateRangeFilter?: boolean; // Enable date range filter
}
