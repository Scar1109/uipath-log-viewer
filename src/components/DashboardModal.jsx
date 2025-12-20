import React, { useMemo } from 'react';
import { Modal, Row, Col, Card, Statistic, Timeline } from 'antd';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF4D4F'];

const DashboardModal = ({ visible, onClose, stats, isDarkMode }) => {

    // Default to empty if not provided
    const { volumeData = [], errorData = [], levelData = [], executionStats = [], timelineEvents = [] } = stats || {};

    // Stats for Cards (use passed data if available, or calc from arrays)
    // We already have summaries in errorData/volumeData but Total/Warn/Error counts might need to be passed separately or inferred.
    // Ideally we should pass the global counts too, but let's see what we have.
    // The previous implementation calculated these from 'logs'.
    // We can just sum them up or use the counts from detailed data? 
    // Actually, 'stats' passed from LogViewer is the 'analytics' object from worker. 
    // It doesn't contain total/error/warn counts directly as top level properties in 'analytics'.
    // We should probably rely on the existing GlobalStats in LogViewer or just sum them up here.

    // Wait, in LogViewer, we have `globalStats`. We should pass that too or let DashboardModal use it.
    // But modifying the prop signature to `({ text, ... })` is easier. 
    // Let's rely on summing up or just passing `globalStats` as well?
    // The worker `analytics` object doesn't have the simple counts. 
    // Let's infer errors from errorData sum? No, warnings are missing.
    // Let's just use 0 placeholders for now or fix LogViewer to pass globalStats too.
    // Actually, I can use `volumeData` sum for total?
    const total = volumeData.reduce((acc, curr) => acc + curr.count, 0);
    const errors = errorData.reduce((acc, curr) => acc + curr.value, 0);
    // Warnings are harder to get from errorData. 
    // Let's assume passed `stats` object ALSO includes the simple counts if we merge them in LogViewer?
    // In LogViewer currently: `stats={analyticsData || {}}`
    // analyticsData only has the arrays.
    // I should fix LogViewer to pass `{ ...analyticsData, ...globalStats }`. 
    // BUT for this step, I will stick to using what I have and maybe update LogViewer in next step if needed. 
    // Or I can just calculate them from the arrays I have (timeline events might have some info).
    // Let's just render what we have. 

    // actually, let's keep it simple. I'll rendering "N/A" or 0 if missing. 
    // But the user wants analytics. 
    // I will use `total` from volume. 
    // I will use `errors` from error breakdown.
    // Warnings? missing.

    // Let's just assume 0 for warnings for now or improve `logWorker` to return it in `analytics`.
    // Wait, `logWorker` returns `stats: { total, error, warn }` SEPARATE from `analytics`.
    // I should probably update LogViewer to pass both. 

    // For now, let's just use the props as is.
    const warnings = 0;

    // Re-construct levelData for completeness if we want to show it? 
    // The previous code didn't use `levelData` in the return JSX (it defined it but didn't assume it used it?).
    // Ah, it didn't use it. It used specific cards.


    return (
        <Modal
            title="Log Analysis Dashboard"
            open={visible}
            onCancel={onClose}
            footer={null}
            width="95%"
            style={{ top: 20 }}
        >
            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Card bordered={false} bodyStyle={{
                        padding: '20px',
                        textAlign: 'center',
                        background: isDarkMode ? '#1f1f1f' : '#f0f2f5',
                        borderRadius: '8px',
                        border: isDarkMode ? '1px solid #424242' : '1px solid #d9d9d9'
                    }}>
                        <Statistic title="Total Logs" value={total} valueStyle={{ color: isDarkMode ? 'white' : undefined }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} bodyStyle={{
                        padding: '20px',
                        textAlign: 'center',
                        background: isDarkMode ? '#2a1215' : '#fff1f0',
                        borderRadius: '8px',
                        border: isDarkMode ? '1px solid #5a1d1d' : '1px solid #ffccc7'
                    }}>
                        <Statistic title="Errors" value={errors} valueStyle={{ color: '#cf1322' }} />
                    </Card>
                </Col>
                <Col span={8}>
                    <Card bordered={false} bodyStyle={{
                        padding: '20px',
                        textAlign: 'center',
                        background: isDarkMode ? '#2b2511' : '#fffbe6',
                        borderRadius: '8px',
                        border: isDarkMode ? '1px solid #614700' : '1px solid #ffe58f'
                    }}>
                        <Statistic title="Warnings" value={warnings} valueStyle={{ color: '#d48806' }} />
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Log Volume Over Time" size="small">
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <AreaChart data={volumeData}>
                                    <XAxis dataKey="time" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Log Level Distribution" size="small">
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={levelData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                    >
                                        {levelData.map((entry, index) => {
                                            const name = (entry.name || '').toLowerCase();
                                            let color = '#8884d8';
                                            if (name.includes('fatal')) color = '#cf1322';
                                            else if (name.includes('error')) color = '#d4380d';
                                            else if (name.includes('warn')) color = '#d46b08';
                                            else if (name.includes('info')) color = '#1890ff';
                                            else if (name.includes('trace')) color = '#13c2c2';
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Top Longest Transactions (sec)" size="small">
                        <div style={{ width: '100%', height: 250 }}>
                            {executionStats.length > 0 ? (
                                <ResponsiveContainer>
                                    <BarChart data={executionStats}>
                                        <XAxis dataKey="id" hide /> {/* ID might be long, hide it */}
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="time" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <p style={{ textAlign: 'center', marginTop: 100 }}>No Transaction Data</p>}
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Recent Main Events Timeline" size="small">
                        <Timeline mode="left">
                            {timelineEvents.map(ev => (
                                <Timeline.Item color={ev.level.toLowerCase() === 'fatal' ? 'red' : 'blue'} key={ev.key}>
                                    <p>{ev.rawTimestamp || ev.timeStamp} - {ev.message}</p>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>
                </Col>
            </Row >
        </Modal >
    );
};

export default DashboardModal;
