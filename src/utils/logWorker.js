/* eslint-disable no-restricted-globals */

let allLogs = [];
let filteredLogs = [];

self.onmessage = (e) => {
    const { type, payload } = e.data;

    switch (type) {
        case 'PARSE':
            handleParse(payload);
            break;
        case 'FILTER':
            handleFilter(payload);
            break;
        case 'GET_ROWS':
            handleGetRows(payload);
            break;
        case 'FIND':
            handleFind(payload);
            break;
        case 'EXPORT':
            handleExportData();
            break;
        default:
            break;
    }
};

const handleExportData = () => {
    // Return up to 100 rows
    const rows = filteredLogs.slice(0, 100);
    self.postMessage({ type: 'EXPORT_COMPLETE', payload: { rows } });
};

const readFileAsync = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
};

const handleParse = async (file) => {
    try {
        const content = await readFileAsync(file);
        const lines = content.split(/\r?\n/);
        const parsedLogs = [];
        // Regex for UiPath logs: Timestamp Level JSON
        // Example: 19:22:50.1234 Info {"message":"..."}
        // Fallback or variation handling
        const logRegex = /^(\d{2}:\d{2}:\d{2}\.\d{4})\s+(\w+)\s+(.+)$/;
        // Alternative regex for some files that might have Space or Tab

        lines.forEach((line, index) => {
            if (!line.trim()) return;

            // Try Standard Parsing
            const match = line.match(logRegex);
            if (match) {
                const [_, rawTimestamp, level, jsonPart] = match;
                try {
                    const json = JSON.parse(jsonPart);
                    // Flatten key properties for sorting/filtering
                    parsedLogs.push({
                        key: index,
                        rawTimestamp,
                        level: json.level || level,
                        message: json.message || jsonPart,
                        ...json
                    });
                } catch (error) {
                    parsedLogs.push({ key: index, rawTimestamp, level, message: jsonPart, isRaw: true });
                }
            } else {
                // Heuristic for older formats or plain lines
                // Just put the whole line in message
                parsedLogs.push({ key: index, message: line, level: 'Unknown', rawTimestamp: '', isRaw: true });
            }
        });

        allLogs = parsedLogs;

        // Initial setup: filtered is same as all
        filteredLogs = [...allLogs];

        const meta = calculateStatsAndDate(parsedLogs);

        self.postMessage({
            type: 'PARSE_COMPLETE',
            payload: {
                totalCount: parsedLogs.length,
                previewLogs: parsedLogs.slice(0, 100),
                ...meta
            }
        });

    } catch (err) {
        self.postMessage({
            type: 'ERROR',
            payload: 'Failed to read or parse file: ' + err.message
        });
    }
};

const calculateStatsAndDate = (logs) => {
    let minT = Infinity;
    let maxT = -Infinity;
    let errors = 0;
    let warns = 0;

    const today = new Date().toISOString().split('T')[0];

    // Analytics containers
    const timeMap = {};
    const errorTypeMap = {};
    const levelMap = {};
    const executionStats = [];
    const timelineEvents = [];

    logs.forEach((log, index) => {
        // Stats
        const l = (log.level || '').toLowerCase();
        if (l.includes('error') || l.includes('fatal')) {
            errors++;

            // Error Breakdown
            const key = log.processName || log.logType || 'Generic Error';
            errorTypeMap[key] = (errorTypeMap[key] || 0) + 1;
        }
        else if (l.includes('warn')) warns++;

        // Dates & Time Volume
        let t = NaN;
        let timeStr = '';

        if (log.timeStamp) {
            const date = new Date(log.timeStamp);
            if (!isNaN(date)) {
                t = date.getTime();
                timeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
            }
        } else if (log.rawTimestamp) {
            // timestamp usually is time only for some logs "HH:mm:ss.SSSS" or "HH:mm:ss"
            if (log.rawTimestamp.includes('T')) {
                const date = new Date(log.rawTimestamp);
                t = date.getTime();
                if (!isNaN(date)) {
                    timeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0');
                }
            } else {
                t = new Date(today + 'T' + log.rawTimestamp).getTime();
                const parts = log.rawTimestamp.split(':');
                if (parts.length >= 2) timeStr = parts[0] + ':' + parts[1];
            }
        }

        if (!isNaN(t)) {
            if (t < minT) minT = t;
            if (t > maxT) maxT = t;
        }

        if (timeStr) {
            timeMap[timeStr] = (timeMap[timeStr] || 0) + 1;
        }

        // Level Stats for Pie Chart
        // Normalized level key (Folder/Group by)
        // Adjust these keys as per preference: Info, Warn, Error, Fatal, Trace
        let levelKey = 'Unknown';
        if (l.includes('fatal')) levelKey = 'Fatal';
        else if (l.includes('error')) levelKey = 'Error';
        else if (l.includes('warn')) levelKey = 'Warn';
        else if (l.includes('trace')) levelKey = 'Trace';
        else if (l.includes('info') || l.includes('information')) levelKey = 'Info';

        levelMap[levelKey] = (levelMap[levelKey] || 0) + 1;

        // Execution Stats
        if (log.transactionExecutionTime) {
            executionStats.push({
                id: log.transactionId || log.key || index,
                time: parseFloat(log.transactionExecutionTime)
            });
        }

        // Timeline Events
        if (log.message && (String(log.message).includes('Start') || String(log.message).includes('End') || l === 'fatal')) {
            if (timelineEvents.length < 20) { // Limit to first 20 for now to keep payload light
                timelineEvents.push({
                    key: log.key || index,
                    rawTimestamp: log.rawTimestamp,
                    timeStamp: log.timeStamp,
                    message: log.message,
                    level: log.level
                });
            }
        }
    });

    // Formatting Analytics Data
    const volumeData = Object.keys(timeMap).sort().map(time => ({
        time,
        count: timeMap[time]
    }));

    const errorData = Object.keys(errorTypeMap).map(name => ({ name, value: errorTypeMap[name] }));
    const levelData = Object.keys(levelMap).map(name => ({ name, value: levelMap[name] }));

    // Top 20 longest transactions
    const topExecutionStats = executionStats.sort((a, b) => b.time - a.time).slice(0, 20);

    return {
        stats: {
            total: logs.length,
            error: errors,
            warn: warns
        },
        dateRange: (minT !== Infinity && maxT !== -Infinity) ? { min: minT, max: maxT } : null,
        analytics: {
            volumeData,
            errorData,
            levelData,
            executionStats: topExecutionStats,
            timelineEvents
        }
    };
};

const handleFilter = ({ levelFilter, searchText, dateRange }) => {
    if (!allLogs || allLogs.length === 0) {
        self.postMessage({ type: 'FILTER_COMPLETE', payload: { count: 0, stats: { total: 0, error: 0, warn: 0 } } });
        return;
    }

    let filtered = allLogs;

    // Level Filter
    if (levelFilter !== 'ALL') {
        const filterLower = levelFilter.toLowerCase();
        filtered = filtered.filter(log => {
            const l = (log.level || '').toLowerCase().trim();
            let check = l;
            if (l === 'information') check = 'info';
            if (l === 'warning') check = 'warn';
            return check === filterLower;
        });
    }

    // Search Text
    if (searchText) {
        const lowerSearch = searchText.toLowerCase();
        filtered = filtered.filter(log =>
            // Search in values (shallow)
            Object.values(log).some(val =>
                val !== null && val !== undefined && String(val).toLowerCase().includes(lowerSearch)
            )
        );
    }

    // Date Range
    if (dateRange) {
        const start = new Date(dateRange.start).getTime();
        const end = new Date(dateRange.end).getTime();
        const today = new Date().toISOString().split('T')[0];

        filtered = filtered.filter(log => {
            let t = NaN;
            if (log.rawTimestamp && log.rawTimestamp.includes('T')) {
                t = new Date(log.rawTimestamp).getTime();
            } else if (log.rawTimestamp) {
                t = new Date(today + 'T' + log.rawTimestamp).getTime();
            }
            return !isNaN(t) && t >= start && t <= end;
        });
    }

    filteredLogs = filtered;

    // We send back the count so the UI knows how many rows to reserve
    self.postMessage({
        type: 'FILTER_COMPLETE',
        payload: {
            count: filteredLogs.length
        }
    });
};

const handleFind = ({ query }) => {
    const indices = [];
    if (query && query.length > 0) {
        const lowerQuery = query.toLowerCase();
        // Search in currently filtered logs
        filteredLogs.forEach((log, index) => {
            // Search primarily in message
            if (log.message && String(log.message).toLowerCase().includes(lowerQuery)) {
                indices.push(index);
            }
        });
    }
    self.postMessage({ type: 'FIND_COMPLETE', payload: { indices, query } });
};

const handleGetRows = ({ startIndex, stopIndex, sortKey, sortDir }) => {
    if (!filteredLogs) return;

    const rows = filteredLogs.slice(startIndex, stopIndex + 1);

    self.postMessage({
        type: 'ROWS_DATA',
        payload: {
            startIndex,
            rows
        }
    });
};
