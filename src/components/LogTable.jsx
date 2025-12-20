import React, { useRef, useEffect, memo, useState, useMemo } from 'react';
import { Table, Tag } from 'antd';
import { VariableSizeGrid as Grid } from 'react-window';
import ResizeObserver from 'rc-resize-observer';

const getLevelColor = (level) => {
    if (!level) return 'default';
    const l = String(level).toLowerCase().trim();
    if (l.includes('fatal')) return 'red';
    if (l.includes('error')) return 'volcano';
    if (l.includes('warn')) return 'orange';
    if (l.includes('info') || l.includes('information')) return 'blue';
    if (l.includes('trace')) return 'cyan';
    return 'default';
};



const VirtualTable = React.forwardRef((props, ref) => {
    const { columns, scroll = {}, showColoredRows, showReadableTimestamp, isDarkMode, logsMap, itemCount, loadMoreItems, highlightText, activeRowIndex, ...tableProps } = props;
    const [tableWidth, setTableWidth] = React.useState(0);
    const [tableHeight, setTableHeight] = React.useState(0); // Track height for AutoSizing

    // Calculate columns width to fill screen if not resized
    const widthColumnCount = columns.filter(({ width }) => !width).length;

    // Horizontal Scrolling Logic
    const MIN_COLUMN_WIDTH = 150;

    // Estimate scrollbar presence
    const scrollbarWidth = 17;
    const totalContentHeight = itemCount * 54;
    const hasVerticalScrollbar = totalContentHeight > (tableHeight || 400);
    const availableWidth = tableWidth - (hasVerticalScrollbar ? scrollbarWidth : 0);

    // First pass: Calculate desired widths
    // If distributed width < MIN_COLUMN_WIDTH, force MIN_COLUMN_WIDTH.
    // This will cause total width to exceed availableWidth -> Horizontal Scroll.

    const distWidth = widthColumnCount === 0 ? MIN_COLUMN_WIDTH : Math.floor((availableWidth - 20) / widthColumnCount);
    const safeDistWidth = Math.max(distWidth, MIN_COLUMN_WIDTH);

    const mergedColumns = columns.map((column) => {
        if (column.width) {
            return column;
        }
        return {
            ...column,
            width: safeDistWidth,
        };
    });

    const totalScrollWidth = mergedColumns.reduce((acc, col) => acc + (col.width || 0), 0);

    const gridRef = useRef();

    React.useImperativeHandle(ref, () => ({
        scrollTo: ({ index }) => {
            if (gridRef.current) {
                gridRef.current.scrollToItem({
                    rowIndex: index,
                    align: 'smart',
                });
            }
        }
    }));

    // We need to track scrollLeft to support AntD Table's sync mechanism
    // but react-window Grid might not expose it easily via ref.state. 
    // We'll trust onScroll to update our knowledge if needed, or just return 0 if ref missing.
    // However, AntD just puts this ref on the tbody.

    const [connectObject] = React.useState(() => {
        const obj = {};
        Object.defineProperty(obj, 'scrollLeft', {
            get: () => {
                if (gridRef.current) {
                    // Try to get from state if available, or just 0
                    const state = gridRef.current.state;
                    return state && typeof state.scrollLeft === 'number' ? state.scrollLeft : 0;
                }
                return 0; // Return 0 instead of null to prevent crash
            },
            set: (scrollLeft) => {
                if (gridRef.current) {
                    gridRef.current.scrollTo({
                        scrollLeft,
                    });
                }
            },
        });
        return obj;
    });

    const resetVirtualGrid = () => {
        gridRef.current?.resetAfterIndices({
            columnIndex: 0,
            shouldForceUpdate: true,
        });
    };

    useEffect(() => {
        resetVirtualGrid();
    }, [tableWidth, showColoredRows, showReadableTimestamp, columns]); // Added columns dependency

    // Infinite Loader Logic
    const handleOnItemsRendered = ({
        visibleRowStartIndex,
        visibleRowStopIndex,
        overscanRowStartIndex,
        overscanRowStopIndex,
    }) => {
        // Simple checking mechanism: Check if start or end of overscan is loaded
        // Ideally we check all, but for performance we just check boundaries
        // Batch request a bit

        let missingStart = -1;
        let missingEnd = -1;

        for (let i = overscanRowStartIndex; i <= overscanRowStopIndex; i++) {
            if (!logsMap[i]) {
                if (missingStart === -1) missingStart = i;
                missingEnd = i;
            } else {
                // If we were tracking a missing block, close it
                if (missingStart !== -1) {
                    loadMoreItems({ startIndex: missingStart, stopIndex: missingEnd });
                    missingStart = -1;
                    missingEnd = -1;
                }
            }
        }

        // Final block
        if (missingStart !== -1) {
            loadMoreItems({ startIndex: missingStart, stopIndex: missingEnd });
        }
    };

    const renderVirtualList = (rawData, { scrollbarSize, ref, onScroll }) => {
        ref.current = connectObject;
        const totalHeight = itemCount * 54; // Use itemCount instead of rawData.length

        // Use tracked height or fallback to scroll.y if it is a number, else default to 400
        const gridHeight = tableHeight > 0 ? tableHeight : (typeof scroll.y === 'number' ? scroll.y : 400);



        return (
            <Grid
                ref={gridRef}
                className={`virtual-grid ${isDarkMode ? 'virtual-table-dark' : ''}`}
                columnCount={mergedColumns.length}
                columnWidth={(index) => {
                    const { width } = mergedColumns[index];
                    return width;
                }}
                height={gridHeight}
                rowCount={itemCount}
                rowHeight={() => 54}
                width={tableWidth} // Viewport width
                onScroll={({ scrollLeft, scrollTop, scrollUpdateWasRequested }) => {
                    onScroll({ scrollLeft });
                }}
                onItemsRendered={({
                    visibleRowStartIndex,
                    visibleRowStopIndex,
                    visibleColumnStartIndex,
                    visibleColumnStopIndex,
                    overscanRowStartIndex,
                    overscanRowStopIndex,
                    overscanColumnStartIndex,
                    overscanColumnStopIndex,
                }) => {
                    handleOnItemsRendered({
                        visibleRowStartIndex, visibleRowStopIndex,
                        overscanRowStartIndex, overscanRowStopIndex
                    });
                }}
            >
                {({ columnIndex, rowIndex, style }) => {
                    // Check if data exists
                    const record = logsMap[rowIndex];

                    let content;
                    let className = 'virtual-table-cell';

                    if (!record) {
                        content = <span style={{ color: '#ccc', fontStyle: 'italic' }}>Loading...</span>;
                    } else {
                        const column = mergedColumns[columnIndex];
                        let text = record[column.dataIndex];

                        // Formating Timestamp
                        if (showReadableTimestamp && (column.dataIndex === 'rawTimestamp' || column.dataIndex === 'timeStamp')) {
                            if (text) {
                                try {
                                    let dateStr = text;
                                    if (typeof text === 'string' && text.match(/^\d{2}:\d{2}:\d{2}/) && !text.includes('T') && !text.includes('-')) {
                                        dateStr = new Date().toISOString().split('T')[0] + 'T' + text;
                                    }
                                    const date = new Date(dateStr);
                                    if (!isNaN(date.getTime())) {
                                        text = date.toLocaleString();
                                    }
                                } catch (e) {
                                    // ignore
                                }
                            }
                        }

                        content = text;
                        if (column.dataIndex === 'level') {
                            content = <Tag color={getLevelColor(text)} style={{ fontSize: '13px', lineHeight: '20px', marginRight: 0 }}>{text}</Tag>;
                        } else if (column.dataIndex === 'message' && highlightText && text && typeof text === 'string') {
                            // Simple highlighting
                            const parts = text.split(new RegExp(`(${highlightText})`, 'gi'));
                            content = parts.map((part, i) =>
                                part.toLowerCase() === highlightText.toLowerCase() ? <mark key={i} style={{ padding: 0, backgroundColor: '#ffe58f' }}>{part}</mark> : part
                            );
                        } else if (column.render) {
                            // Note: column.render usually takes (text, record, index)
                            // But here we might not have a full 'render' support if we define columns dynamically without render functions in LogViewer.
                            // The current implementation in LogViewer only generates simple columns.
                            content = text;
                        }

                        const l = (record.level || '').toLowerCase();
                        if (showColoredRows) {
                            if (l.includes('fatal')) className += ' log-row-fatal';
                            else if (l.includes('error')) className += ' log-row-error';
                            else if (l.includes('warn')) className += ' log-row-warn';
                            else if (l.includes('info') || l.includes('information')) className += ' log-row-info';
                        }
                    }

                    if (rowIndex % 2 === 1) className += ' virtual-table-cell-even';

                    return (
                        <div
                            className={className}
                            style={{
                                ...style,
                                padding: '8px',
                                borderBottom: '1px solid #f0f0f0',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis'
                            }}
                            title={record && typeof record[mergedColumns[columnIndex]?.dataIndex] === 'string' ? record[mergedColumns[columnIndex].dataIndex] : ''}
                        >
                            {content}
                        </div>
                    );
                }}
            </Grid>
        );
    };

    // Create placeholder data to force AntD to render the body
    const dataSource = React.useMemo(() => new Array(itemCount).fill({}), [itemCount]);

    // If no items, render normal table to show "No Data" state
    if (itemCount === 0) {
        return (
            <Table
                {...tableProps}
                className={`virtual-table ${isDarkMode ? 'dark-mode' : ''}`}
                columns={mergedColumns}
                dataSource={[]}
                pagination={false}
                scroll={{ y: '100%', x: '100%' }}
                locale={{ emptyText: 'No Data Found' }}
            />
        );
    }

    return (
        <ResizeObserver
            onResize={({ width, height }) => {
                setTableWidth(width);
                if (height > 0) setTableHeight(height); // Capture height dynamically
            }}
        >
            <div style={{ height: '100%', width: '100%' }}>
                <Table
                    {...tableProps}
                    className={`virtual-table ${isDarkMode ? 'dark-mode' : ''}`}
                    columns={mergedColumns}
                    dataSource={dataSource} // Pass placeholder
                    rowKey={(record, index) => index} // Use index as key to prevent crashing on missing keys
                    pagination={false}
                    components={{
                        body: renderVirtualList,
                    }}
                    scroll={{
                        y: '100%',
                        x: totalScrollWidth, // IMPORTANT: Enables horizontal scrolling matching content
                    }}
                />
            </div>
        </ResizeObserver>
    );
});

const LogTable = memo(React.forwardRef(({ logsMap, itemCount, loadMoreItems, columns, loading, showColoredRows, showReadableTimestamp, isDarkMode, highlightText, activeRowIndex }, ref) => {
    return (
        <VirtualTable
            ref={ref}
            columns={columns}
            logsMap={logsMap}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            loading={loading}
            rowKey="key"
            showColoredRows={showColoredRows}
            showReadableTimestamp={showReadableTimestamp}
            isDarkMode={isDarkMode}
            highlightText={highlightText}
            activeRowIndex={activeRowIndex}
            scroll={{ y: 400 }}
        />
    );
}));

export default LogTable;
