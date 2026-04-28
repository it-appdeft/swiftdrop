import * as React from 'react';

import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
    id: string;
    header: React.ReactNode;
    /** Renders the cell. Falls back to `row[id]` when not provided. */
    cell?: (row: T, rowIndex: number) => React.ReactNode;
    align?: 'left' | 'right' | 'center';
    width?: string;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    /** Returned key per row. Defaults to row index, but you should pass a stable id. */
    rowKey?: (row: T, index: number) => string | number;
    loading?: boolean;
    empty?: React.ReactNode;
    onRowClick?: (row: T) => void;
    /** Optional footer slot — typically used for pagination controls. */
    footer?: React.ReactNode;
    className?: string;
}

const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
} as const;

/**
 * Light-weight presentational table built on the design system table primitive.
 * It deliberately stays unopinionated about sorting / filtering / pagination so
 * the data layer (TanStack Table, server state, etc.) can be plugged in later
 * without rewriting the visuals.
 */
export function DataTable<T>({
    data,
    columns,
    rowKey,
    loading = false,
    empty,
    onRowClick,
    footer,
    className,
}: DataTableProps<T>) {
    return (
        <Card className={cn('overflow-hidden p-0', className)}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead
                                key={column.id}
                                style={column.width ? { width: column.width } : undefined}
                                className={cn(alignClass[column.align ?? 'left'], column.className)}
                            >
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="py-12 text-center">
                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                    <Spinner size="lg" tone="primary" />
                                    <span className="text-sm">Loading…</span>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="py-12 text-center text-sm text-muted-foreground">
                                {empty ?? 'No results.'}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, index) => (
                            <TableRow
                                key={rowKey ? rowKey(row, index) : index}
                                onClick={onRowClick ? () => onRowClick(row) : undefined}
                                className={cn(onRowClick && 'cursor-pointer')}
                            >
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        className={cn(alignClass[column.align ?? 'left'], column.className)}
                                    >
                                        {column.cell ? column.cell(row, index) : (row as Record<string, React.ReactNode>)[column.id]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {footer ? <div className="border-t bg-muted/20 px-4 py-3">{footer}</div> : null}
        </Card>
    );
}
