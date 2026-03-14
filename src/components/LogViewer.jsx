import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, Input, Select, Row, Col, Typography, Space, Button, message, DatePicker, Tooltip, Switch, Tag, Spin } from 'antd';
import { SearchOutlined, DeleteOutlined, BarChartOutlined, DownloadOutlined, BgColorsOutlined, ClockCircleOutlined, ArrowUpOutlined, ArrowDownOutlined, CloseOutlined } from '@ant-design/icons';
import LogUploader from './LogUploader';
import LogTable from './LogTable';
import DashboardModal from './DashboardModal';
import { exportToExcel } from '../utils/exportUtils';
import _ from 'lodash';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text } = Typography;

const LogViewer = ({ onThemeChange, isDarkMode }) => {
    // Data State
    const [logCount, setLogCount] = useState(0);
    const [logsMap, setLogsMap] = useState({}); // Cache for loaded rows: { [index]: logData }
    const [columns, setColumns] = useState([]);

    // Performance State (From Worker)
    const [globalStats, setGlobalStats] = useState({ total: 0, error: 0, warn: 0 });
    const [dateLimits, setDateLimits] = useState(null); // { min, max }
    const [analyticsData, setAnalyticsData] = useState(null);

    // UI State
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isFileLoaded, setIsFileLoaded] = useState(false);

    // Feature Toggles
    const [showColoredRows, setShowColoredRows] = useState(false);
    const [showReadableTimestamp, setShowReadableTimestamp] = useState(false);

    // Filters
    const [searchText, setSearchText] = useState('');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState(null);

    // Find State
    const [showFind, setShowFind] = useState(false);
    const [findQuery, setFindQuery] = useState('');
    const [findIndices, setFindIndices] = useState([]);
    const [currentFindIndex, setCurrentFindIndex] = useState(-1);
    const tableRef = useRef(null);
    const findInputRef = useRef(null);

    // Worker
    const workerRef = useRef(null);
    const columnsRef = useRef(columns);
    const visibleColumnsRef = useRef(visibleColumns);

    // Keep refs synced with state
    useEffect(() => {
        columnsRef.current = columns;
        visibleColumnsRef.current = visibleColumns;
    }, [columns, visibleColumns]);

    // Focus find input when toggled
    useEffect(() => {
        if (showFind && findInputRef.current) {
            findInputRef.current.focus();
        }
    }, [showFind]);

    const debouncedFilter = useMemo(
        () => _.debounce((params) => {
            if (workerRef.current) {
                setProcessing(true);
                // Clear cache on filter change
                setLogsMap({});
                workerRef.current.postMessage({ type: 'FILTER', payload: params });
            }
        }, 300),
        []
    );

    const handleFind = (query) => {
        setFindQuery(query);
        if (workerRef.current) {
            workerRef.current.postMessage({ type: 'FIND', payload: { query } });
        }
    };

    const navigateFind = (direction) => {
        if (findIndices.length === 0) return;
        let nextIndex = direction === 'next' ? currentFindIndex + 1 : currentFindIndex - 1;
        if (nextIndex >= findIndices.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = findIndices.length - 1;

        setCurrentFindIndex(nextIndex);
        const rowToScroll = findIndices[nextIndex];

        if (tableRef.current) {
            tableRef.current.scrollTo({ index: rowToScroll });
        }
    };

    const closeFind = () => {
        setShowFind(false);
        setFindQuery('');
        setFindIndices([]);
        setCurrentFindIndex(-1);
    };

    useEffect(() => {
        workerRef.current = new Worker(new URL('../utils/logWorker.js', import.meta.url));
        workerRef.current.onmessage = (e) => {
            const { type, payload } = e.data;
            if (type === 'PARSE_COMPLETE') {
                handleParseComplete(payload);
            } else if (type === 'FILTER_COMPLETE') {
                setLogCount(payload.count);
                // Also trigger a fetch for the first chunk if count > 0
                if (payload.count > 0) {
                    workerRef.current.postMessage({
                        type: 'GET_ROWS',
                        payload: { startIndex: 0, stopIndex: 50 }
                    });
                } else {
                    setLogsMap({});
                    setLoading(false); // Ensure loading is off if no rows
                    setProcessing(false);
                }
                // Always turn off loading here to handle the "Parsing..." state
                setLoading(false);

                // Reset Find if filter changes
                setFindIndices([]);
                setCurrentFindIndex(-1);

            } else if (type === 'ROWS_DATA') {
                const { startIndex, rows } = payload;
                setLogsMap(prev => {
                    const next = { ...prev };
                    rows.forEach((row, i) => {
                        next[startIndex + i] = row;
                    });
                    return next;
                });

                // Use functional update to check latest columns state avoiding stale closure
                setColumns(prevColumns => {
                    if (prevColumns.length === 0 && startIndex === 0 && rows.length > 0) {
                        const generatedColumns = generateColumns(rows);
                        const defaultVisible = ['rawTimestamp', 'level', 'message', 'processName', 'fileName', 'transactionExecutionTime'];
                        setVisibleColumns(generatedColumns.map(c => c.key).filter(k => defaultVisible.includes(k) || generatedColumns.length < 8));
                        return generatedColumns;
                    }
                    return prevColumns;
                });

                setProcessing(false);
            } else if (type === 'FIND_COMPLETE') {
                const { indices, query } = payload;
                setFindIndices(indices);
                setCurrentFindIndex(indices.length > 0 ? 0 : -1);

                // Auto jump to first result
                if (indices.length > 0 && tableRef.current) {
                    tableRef.current.scrollTo({ index: indices[0] });
                }
            } else if (type === 'EXPORT_COMPLETE') {
                const { rows } = payload;
                const currentColumns = columnsRef.current;
                const currentVisible = visibleColumnsRef.current;

                const exportColumns = currentColumns.filter(col => currentVisible.includes(col.key));
                // Fallback to all columns if no visible columns (e.g. initial load logic)
                const finalColumns = exportColumns.length > 0 ? exportColumns : currentColumns;

                if (finalColumns.length === 0) {
                    message.error('No columns to export.');
                } else {
                    exportToExcel(rows, finalColumns);
                    message.success('Export downloaded successfully');
                }
                setProcessing(false);
            } else if (type === 'ERROR') {
                message.error(payload);
                setLoading(false);
                setProcessing(false);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Effect to trigger search when filters change
    useEffect(() => {
        debouncedFilter({
            levelFilter,
            searchText,
            dateRange: dateRange ? { start: dateRange[0].toISOString(), end: dateRange[1].toISOString() } : null
        });
    }, [levelFilter, searchText, dateRange, debouncedFilter]);

    const handleParseComplete = (payload) => {
        const { totalCount, stats, dateRange, previewLogs, analytics } = payload;

        if (totalCount === 0) {
            message.warning('No logs found in file');
            setLoading(false);
            return;
        }

        // Generate columns immediately using preview data
        if (previewLogs && previewLogs.length > 0) {
            const generatedColumns = generateColumns(previewLogs);
            setColumns(generatedColumns);
            const defaultVisible = ['rawTimestamp', 'level', 'message', 'processName', 'fileName', 'transactionExecutionTime'];
            setVisibleColumns(generatedColumns.map(c => c.key).filter(k => defaultVisible.includes(k) || generatedColumns.length < 8));
        }

        setGlobalStats(stats || { total: totalCount, error: 0, warn: 0 });
        setDateLimits(dateRange);
        setAnalyticsData(analytics);
        setIsFileLoaded(true);

        // Initial Filter - Bypass debounce for immediate load
        setProcessing(true);
        if (workerRef.current) {
            workerRef.current.postMessage({
                type: 'FILTER',
                payload: {
                    levelFilter: 'ALL',
                    searchText: '',
                    dateRange: null
                }
            });
        }
    };

    const generateColumns = (logs) => {
        const allKeys = new Set();
        // Guaranteed keys
        allKeys.add('rawTimestamp');
        allKeys.add('level');
        allKeys.add('message');

        // Sample current chunk
        logs.forEach(log => {
            Object.keys(log).forEach(key => {
                if (key !== 'key' && key !== 'parseError' && key !== 'isRaw') {
                    allKeys.add(key);
                }
            });
        });

        return Array.from(allKeys).map(key => ({
            title: key.charAt(0).toUpperCase() + key.slice(1),
            dataIndex: key,
            key: key,
            sorter: true, // Server-side sort not fully implemented yet
            ellipsis: true,
        }));
    };

    const handleFileUpload = (file) => {
        setLoading(true);
        setLogCount(0);
        setLogsMap({});
        setColumns([]); // Reset columns for new file
        setAnalyticsData(null);
        setIsFileLoaded(false);
        // Send file object directly
        workerRef.current.postMessage({ type: 'PARSE', payload: file });
    };

    const clearLogs = () => {
        setLogCount(0);
        setLogsMap({});
        setColumns([]);
        setDateLimits(null);
        setAnalyticsData(null);
        setIsFileLoaded(false);
        // Reset worker state if possible, or just ignore it
    };

    const handleExport = () => {
        if (logCount > 100) {
            message.info('Export is limited to 100 rows. This limit will be increased in future versions.');
            return;
        }

        setProcessing(true);
        if (workerRef.current) {
            workerRef.current.postMessage({ type: 'EXPORT' });
        }
    };

    // Date Constraints using Worker-calculated limits
    const dateConstraints = (current) => {
        if (!dateLimits) return false;
        const currentVal = current.valueOf();
        const minDay = new Date(dateLimits.min).setHours(0, 0, 0, 0);
        const maxDay = new Date(dateLimits.max).setHours(23, 59, 59, 999);
        return currentVal < minDay || currentVal > maxDay;
    };

    const tableColumns = useMemo(() => {
        return columns.filter(col => visibleColumns.includes(col.key));
    }, [columns, visibleColumns]);

    if (!isFileLoaded && !loading) {
        return <LogUploader onFileUpload={handleFileUpload} isDarkMode={isDarkMode} />;
    }

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }} data-theme={isDarkMode ? 'dark' : 'light'}>

            {/* Find Toolbar */}
            {showFind && (
                <div className="find-toolbar">
                    <Input
                        ref={findInputRef}
                        placeholder="Find in logs..."
                        value={findQuery}
                        variant="borderless"
                        onChange={(e) => handleFind(e.target.value)}
                        onPressEnter={() => navigateFind('next')}
                        style={{ width: 240, fontSize: '13px' }}
                    />
                    <div style={{ height: '20px', width: '1px', background: isDarkMode ? '#333' : '#eee' }}></div>
                    <Text type="secondary" style={{ fontSize: '12px', minWidth: '60px', color: isDarkMode ? '#888' : '#666', fontWeight: 500 }}>
                        {findIndices.length > 0 ? `${currentFindIndex + 1} / ${findIndices.length}` : '0 / 0'}
                    </Text>
                    <Space size={4}>
                        <Button size="small" type="text" icon={<ArrowUpOutlined style={{ fontSize: '12px' }} />} onClick={() => navigateFind('prev')} disabled={findIndices.length === 0} />
                        <Button size="small" type="text" icon={<ArrowDownOutlined style={{ fontSize: '12px' }} />} onClick={() => navigateFind('next')} disabled={findIndices.length === 0} />
                        <Button size="small" type="text" icon={<CloseOutlined style={{ fontSize: '12px' }} />} onClick={closeFind} />
                    </Space>
                </div>
            )}

            {/* Opaque Full Loader */}
            {(loading || processing) && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2000,
                    background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <Spin size="medium" />
                    <Typography.Text style={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 500, fontSize: '14px' }}>
                        {loading ? "Parsing log file..." : "Applying filters..."}
                    </Typography.Text>
                </div>
            )}

            <div style={{ 
                padding: '16px 0', 
                borderBottom: `1px solid ${isDarkMode ? '#333' : '#eaeaea'}`,
                marginBottom: '16px'
            }}>
                <Row gutter={[12, 12]} align="middle">
                    {/* Search & Level */}
                    <Col xs={24} md={6}>
                        <Input
                            placeholder="Search in records..."
                            prefix={<SearchOutlined style={{ color: isDarkMode ? '#666' : '#999' }} />}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            style={{ 
                                background: isDarkMode ? '#111' : '#fff',
                                borderColor: isDarkMode ? '#333' : '#eaeaea'
                            }}
                        />
                    </Col>
                    <Col xs={12} md={3}>
                        <Select
                            style={{ width: '100%' }}
                            value={levelFilter}
                            onChange={setLevelFilter}
                            popupClassName={isDarkMode ? 'dark-select' : ''}
                        >
                            <Option value="ALL">All Levels</Option>
                            <Option value="info">Info</Option>
                            <Option value="warn">Warn</Option>
                            <Option value="error">Error</Option>
                            <Option value="fatal">Fatal</Option>
                        </Select>
                    </Col>

                    {/* Column Select */}
                    <Col xs={12} md={5}>
                        <Select
                            mode="multiple"
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Columns"
                            value={visibleColumns}
                            onChange={setVisibleColumns}
                            maxTagCount="responsive"
                        >
                            {columns.map(col => (
                                <Option key={col.key} value={col.key}>{col.title}</Option>
                            ))}
                        </Select>
                    </Col>

                    <Col xs={24} md={10} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Space size={8}>
                            <Tooltip title="Colored Rows">
                                <Button 
                                    type={showColoredRows ? "primary" : "default"}
                                    icon={<BgColorsOutlined />} 
                                    onClick={() => setShowColoredRows(!showColoredRows)}
                                    className={!showColoredRows && isDarkMode ? 'dark-btn-ghost' : ''}
                                />
                            </Tooltip>
                            <Tooltip title="Human Readable Time">
                                <Button 
                                    type={showReadableTimestamp ? "primary" : "default"}
                                    icon={<ClockCircleOutlined />} 
                                    onClick={() => setShowReadableTimestamp(!showReadableTimestamp)}
                                    className={!showReadableTimestamp && isDarkMode ? 'dark-btn-ghost' : ''}
                                />
                            </Tooltip>
                            <div style={{ width: '1px', height: '20px', background: isDarkMode ? '#333' : '#eee', margin: '0 4px' }}></div>
                            <Button icon={<BarChartOutlined />} onClick={() => setIsDashboardOpen(true)}>Analytics</Button>
                            <Button icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
                            <Button icon={<DeleteOutlined />} onClick={clearLogs} danger type="text">Clear</Button>
                        </Space>
                    </Col>

                    {/* Secondary Filter Row */}
                    <Col xs={24} md={8}>
                        <RangePicker
                            showTime
                            onChange={setDateRange}
                            style={{ 
                                width: '100%',
                                background: isDarkMode ? '#111' : '#fff',
                                borderColor: isDarkMode ? '#333' : '#eaeaea'
                            }}
                            disabledDate={dateConstraints}
                        />
                    </Col>
                    <Col xs={24} md={16} style={{ textAlign: 'right' }}>
                        <Space>
                            <Tag bordered={false} style={{ 
                                borderRadius: '12px', 
                                padding: '0 12px', 
                                background: isDarkMode ? '#111' : '#f5f5f5',
                                color: isDarkMode ? '#888' : '#666',
                                fontWeight: 500,
                                fontSize: '12px'
                            }}>
                                {logCount.toLocaleString()} results found
                            </Tag>
                        </Space>
                    </Col>
                </Row>
            </div>

            <div style={{ 
                flex: 1, 
                overflow: 'hidden', 
                borderRadius: '8px', 
                border: isDarkMode ? '1px solid #333' : '1px solid #eaeaea',
                background: isDarkMode ? '#000' : '#fff'
            }}>
                {columns.length > 0 ? (
                    <LogTable
                        ref={tableRef}
                        logsMap={logsMap}
                        itemCount={logCount}
                        loadMoreItems={({ startIndex, stopIndex }) => {
                            if (workerRef.current) {
                                workerRef.current.postMessage({
                                    type: 'GET_ROWS',
                                    payload: { startIndex, stopIndex }
                                });
                            }
                        }}
                        columns={tableColumns}
                        loading={false}
                        showColoredRows={showColoredRows}
                        showReadableTimestamp={showReadableTimestamp}
                        isDarkMode={isDarkMode}
                        highlightText={showFind ? findQuery : ''}
                        activeRowIndex={showFind ? findIndices[currentFindIndex] : -1}
                    />
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Spin tip="Preparing Log View..." />
                    </div>
                )}
            </div>

            <DashboardModal
                visible={isDashboardOpen}
                onClose={() => setIsDashboardOpen(false)}
                stats={{ ...(analyticsData || {}), ...globalStats }} // Pass pre-calculated stats + global counts
                isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default LogViewer;
