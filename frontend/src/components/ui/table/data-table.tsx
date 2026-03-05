import { Empty, Table } from '@douyinfe/semi-ui';

export type ColumnDef<T> = {
  id: string;
  header: React.ReactNode;
  accessor: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
};

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyState,
  headerContent,
}: DataTableProps<T>) {
  const rows = data.map((row) => ({
    __key: keyExtractor(row),
    __row: row,
  }));

  const tableColumns = columns.map((column) => ({
    title: column.header,
    key: column.id,
    onHeaderCell: () => ({
      className: column.headerClassName,
    }),
    className: column.className,
    render: (_: unknown, record: { __row: T }) => column.accessor(record.__row),
  }));

  return (
    <Table
      dataSource={rows}
      columns={tableColumns}
      rowKey="__key"
      pagination={false}
      loading={Boolean(isLoading)}
      empty={
        emptyState ? (
          <>{emptyState}</>
        ) : (
          <Empty image={null} description="No data" />
        )
      }
      title={headerContent ? () => <>{headerContent}</> : undefined}
      onRow={
        onRowClick
          ? (record) => ({
              role: 'button',
              tabIndex: 0,
              onClick: () => {
                if (record) onRowClick(record.__row);
              },
              onKeyDown: (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (record) onRowClick(record.__row);
                }
              },
            })
          : undefined
      }
    />
  );
}
