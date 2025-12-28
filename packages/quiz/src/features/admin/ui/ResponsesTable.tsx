'use client';

import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
} from '@tabler/icons-react';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table';
import { Badge, Button, Checkbox, DropdownMenu, Label, Select, Table, Tabs } from '@ui/shadcn';
import * as React from 'react';

import {
  getArtistColorHex,
  getArtistIconPath,
} from '../../analysis/ui/artist-type/artist-data-utils.js';
import type { AnalysisResult } from '../../analysis/schema.js';
import type { QuizResponse } from '../../responses/schema.js';

// Helper component for artist type badge with icon and color
const ArtistTypeBadge: React.FC<{
  artistType: string;
  variant?: 'default' | 'secondary';
}> = ({ artistType, variant = 'default' }) => {
  // Convert clean name back to database ID for icon lookup
  const databaseId = `the-${artistType.toLowerCase().replace(/\s+/g, '-')}-artist`;
  const iconPath = getArtistIconPath(databaseId);
  const color = getArtistColorHex(artistType);

  return (
    <Badge
      variant={variant}
      className="px-2 flex items-center gap-1.5"
      style={{
        backgroundColor: `${color}20`,
        borderColor: color,
        color,
      }}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition */}
      {iconPath !== null && iconPath !== undefined && iconPath !== '' && (
        <img
          src={iconPath}
          alt={`${artistType} icon`}
          className="w-4 h-4 rounded-full"
          style={{ filter: `brightness(0) invert(1)` }}
        />
      )}
      {artistType}
    </Badge>
  );
};

type TableRow = QuizResponse & {
  analysisResult?: AnalysisResult;
  primaryArtistType?: string;
  secondaryArtistType?: string;
  userInfo?: {
    name?: string;
    email?: string;
    profilePicture?: string;
  };
  isTypeform?: boolean;
};

// Helper function to extract user information from response metadata
function extractUserInfo(response: QuizResponse): {
  name?: string;
  email?: string;
  profilePicture?: string;
} {
  // Check session metadata custom fields first
  const sessionCustomFields = response.sessionMetadata.customFields;
  if (sessionCustomFields !== undefined) {
    const name = sessionCustomFields.name as string | undefined;
    const email = sessionCustomFields.email as string | undefined;
    const profilePicture = sessionCustomFields.profilePicture as string | undefined;

    if (
      (name !== undefined && name !== '') ||
      (email !== undefined && email !== '') ||
      (profilePicture !== undefined && profilePicture !== '')
    ) {
      const result: { name?: string; email?: string; profilePicture?: string } = {};
      if (name !== undefined && name !== '') result.name = name;
      if (email !== undefined && email !== '') result.email = email;
      if (profilePicture !== undefined && profilePicture !== '')
        result.profilePicture = profilePicture;
      return result;
    }
  }

  // Check response metadata custom fields
  const responseCustomFields = response.metadata?.customFields;
  if (responseCustomFields !== undefined) {
    const name = responseCustomFields.name as string | undefined;
    const email = responseCustomFields.email as string | undefined;
    const profilePicture = responseCustomFields.profilePicture as string | undefined;

    if (
      (name !== undefined && name !== '') ||
      (email !== undefined && email !== '') ||
      (profilePicture !== undefined && profilePicture !== '')
    ) {
      const result: { name?: string; email?: string; profilePicture?: string } = {};
      if (name !== undefined && name !== '') result.name = name;
      if (email !== undefined && email !== '') result.email = email;
      if (profilePicture !== undefined && profilePicture !== '')
        result.profilePicture = profilePicture;
      return result;
    }
  }

  return {};
}

// Helper function to detect if response is from Typeform
function isTypeformResponse(response: QuizResponse): boolean {
  // Check session metadata custom fields
  const sessionCustomFields = response.sessionMetadata.customFields;
  if (sessionCustomFields?.source === 'typeform' || sessionCustomFields?.typeform === true) {
    return true;
  }

  // Check response metadata
  const responseCustomFields = response.metadata?.customFields;
  if (responseCustomFields?.source === 'typeform' || responseCustomFields?.typeform === true) {
    return true;
  }

  // Check if metadata has typeform flag
  if (response.metadata?.customFields?.typeform === true) {
    return true;
  }

  return false;
}

// Helper function to convert database ID to artist type name
function convertDatabaseIdToArtistType(databaseId: string): string {
  // Remove "the-" prefix and "-artist" suffix, then capitalize
  return databaseId
    .replace(/^the-/, '')
    .replace(/-artist$/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to extract artist types from analysis results
function extractArtistTypes(analysisResult?: AnalysisResult): {
  primary?: string;
  secondary?: string;
} {
  if (analysisResult === undefined) {
    return {};
  }

  const endingResults = analysisResult.endingResults;
  if (endingResults.length === 0) {
    return {};
  }

  // Sort by percentage (descending) to get top results
  const sortedResults = [...endingResults].sort((a, b) => b.percentage - a.percentage);

  const primary = sortedResults[0]?.endingId;
  const secondary = sortedResults[1]?.endingId;

  const result: { primary?: string; secondary?: string } = {};
  if (primary !== undefined) {
    result.primary = convertDatabaseIdToArtistType(primary);
  }
  if (secondary !== undefined) {
    result.secondary = convertDatabaseIdToArtistType(secondary);
  }
  return result;
}

// Helper function to combine response data with analysis data
export function combineResponseWithAnalysis(
  responses: ReadonlyArray<QuizResponse>,
  analysisResults: ReadonlyArray<AnalysisResult>,
): ReadonlyArray<TableRow> {
  const analysisMap = new Map(analysisResults.map((ar) => [ar.responseId, ar]));

  return responses.map((response) => {
    const analysisResult = analysisMap.get(response.id);
    const { primary, secondary } = extractArtistTypes(analysisResult);
    const userInfo = extractUserInfo(response);
    const isTypeform = isTypeformResponse(response);

    return {
      ...response,
      analysisResult: analysisResult ?? undefined,
      primaryArtistType: primary ?? undefined,
      secondaryArtistType: secondary ?? undefined,
      userInfo: Object.keys(userInfo).length > 0 ? userInfo : undefined,
      isTypeform,
    } as TableRow;
  });
}

const columns: Array<ColumnDef<TableRow>> = [
  {
    id: 'select',
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(Boolean(value));
          }}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(Boolean(value));
          }}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'userInfo',
    header: 'User',
    cell: ({ row }) => {
      const userInfo = row.original.userInfo;
      if (userInfo === undefined) {
        return <div className="text-sm text-muted-foreground">Anonymous</div>;
      }

      return (
        <div className="flex items-center gap-2">
          {userInfo.profilePicture !== undefined && userInfo.profilePicture !== '' && (
            <img src={userInfo.profilePicture} alt="Profile" className="w-6 h-6 rounded-full" />
          )}
          <div className="flex flex-col">
            {userInfo.name !== undefined && userInfo.name !== '' && (
              <div className="text-sm font-medium">{userInfo.name}</div>
            )}
            {userInfo.email !== undefined && userInfo.email !== '' && (
              <div className="text-xs text-muted-foreground">{userInfo.email}</div>
            )}
            {(userInfo.name === undefined || userInfo.name === '') &&
              (userInfo.email === undefined || userInfo.email === '') && (
                <div className="text-sm text-muted-foreground">Anonymous</div>
              )}
          </div>
        </div>
      );
    },
    enableHiding: false,
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.original.createdAt.epochMillis).toLocaleDateString()}
      </div>
    ),
  },
  {
    accessorKey: 'answers',
    header: 'Answers',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.answers?.length ?? 0} answers
      </Badge>
    ),
  },
  {
    accessorKey: 'sessionMetadata',
    header: 'Duration',
    cell: ({ row }) => {
      const duration = row.original.sessionMetadata.totalDurationMs;
      return duration !== undefined && duration > 0 ? (
        <div className="text-sm">{Math.round(duration / 1000)}s</div>
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: 'interactionLogs',
    header: 'Interactions',
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.interactionLogs?.length ?? 0} logs
      </Badge>
    ),
  },
  {
    accessorKey: 'sessionMetadata.completedAt',
    header: 'Status',
    cell: ({ row }) => {
      const completedAt = row.original.sessionMetadata.completedAt;
      return completedAt !== undefined ? (
        <Badge variant="outline" className="text-green-600 px-1.5">
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
          Completed
        </Badge>
      ) : (
        <Badge variant="outline" className="text-yellow-600 px-1.5">
          <IconLoader className="mr-1" />
          In Progress
        </Badge>
      );
    },
  },
  {
    accessorKey: 'isTypeform',
    header: 'Source',
    cell: ({ row }) => {
      const isTypeform = row.original.isTypeform;
      return isTypeform === true ? (
        <Badge variant="outline" className="text-blue-600 px-1.5">
          Typeform
        </Badge>
      ) : (
        <Badge variant="outline" className="text-gray-600 px-1.5">
          Web App
        </Badge>
      );
    },
  },
  {
    accessorKey: 'primaryArtistType',
    header: 'Primary Type',
    cell: ({ row }) => {
      const primaryType = row.original.primaryArtistType;
      return primaryType !== undefined && primaryType !== '' ? (
        <ArtistTypeBadge artistType={primaryType} variant="default" />
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: 'secondaryArtistType',
    header: 'Secondary Type',
    cell: ({ row }) => {
      const secondaryType = row.original.secondaryArtistType;
      return secondaryType !== undefined && secondaryType !== '' ? (
        <ArtistTypeBadge artistType={secondaryType} variant="secondary" />
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      );
    },
  },
  {
    id: 'actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content align="end" className="w-32">
          <DropdownMenu.Item>View Details</DropdownMenu.Item>
          <DropdownMenu.Item>Export</DropdownMenu.Item>
          <DropdownMenu.Separator />
          <DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    ),
  },
];

function ResponseRow({ row }: { row: Row<TableRow> }) {
  return (
    <Table.Row data-state={row.getIsSelected() && 'selected'}>
      {row.getVisibleCells().map((cell) => (
        <Table.Cell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </Table.Cell>
      ))}
    </Table.Row>
  );
}

export function ResponsesTable({ data }: { data: ReadonlyArray<TableRow> }) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'createdAt', desc: true }, // Sort by createdAt descending (most recent first)
  ]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [activeTab, setActiveTab] = React.useState('responses');

  // Filter data based on active tab
  const filteredData = React.useMemo(() => {
    switch (activeTab) {
      case 'completed':
        return data.filter((response) => response.sessionMetadata.completedAt !== undefined);
      case 'in-progress':
        return data.filter((response) => response.sessionMetadata.completedAt === undefined);
      default:
        return data;
    }
  }, [data, activeTab]);

  const table = useReactTable({
    data: filteredData as Array<TableRow>,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <Tabs defaultValue="responses" className="w-full flex-col justify-start gap-6">
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <Select.Trigger className="flex w-fit @4xl/main:hidden" size="sm" id="view-selector">
            <Select.Value placeholder="Select a view" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="responses">All Responses</Select.Item>
            <Select.Item value="completed">Completed</Select.Item>
            <Select.Item value="in-progress">In Progress</Select.Item>
          </Select.Content>
        </Select>
        <Tabs.List className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <Tabs.Trigger
            value="responses"
            onClick={() => {
              setActiveTab('responses');
            }}
          >
            All Responses
          </Tabs.Trigger>
          <Tabs.Trigger
            value="completed"
            onClick={() => {
              setActiveTab('completed');
            }}
          >
            <span>Completed</span>
            <span className="ml-2">
              <Badge variant="secondary">
                {data.filter((r) => r.sessionMetadata.completedAt !== undefined).length}
              </Badge>
            </span>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="in-progress"
            onClick={() => {
              setActiveTab('in-progress');
            }}
          >
            <span>In Progress</span>
            <span className="ml-2">
              <Badge variant="secondary">
                {data.filter((r) => r.sessionMetadata.completedAt === undefined).length}
              </Badge>
            </span>
          </Tabs.Trigger>
        </Tabs.List>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className="w-56">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenu.CheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => {
                        column.toggleVisibility(Boolean(value));
                      }}
                    >
                      {column.id}
                    </DropdownMenu.CheckboxItem>
                  );
                })}
            </DropdownMenu.Content>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Export Data</span>
          </Button>
        </div>
      </div>
      <Tabs.Content
        value={activeTab}
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <Table.Header className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <Table.Row key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <Table.Head key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </Table.Head>
                    );
                  })}
                </Table.Row>
              ))}
            </Table.Header>
            <Table.Body>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => <ResponseRow key={row.id} row={row} />)
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={columns.length} className="h-24 text-center">
                    No responses found.
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{' '}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <Select.Trigger size="sm" className="w-20" id="rows-per-page">
                  <Select.Value placeholder={table.getState().pagination.pageSize} />
                </Select.Trigger>
                <Select.Content side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <Select.Item key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => {
                  table.setPageIndex(0);
                }}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => {
                  table.previousPage();
                }}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => {
                  table.nextPage();
                }}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => {
                  table.setPageIndex(table.getPageCount() - 1);
                }}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </Tabs.Content>
    </Tabs>
  );
}
