import React, { useState } from 'react';
import { Upload, Button, message, Typography, Alert, Space } from 'antd';
import { UploadOutlined, FileTextOutlined, InboxOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Dragger } = Upload;
const { Title, Text } = Typography;

const LogUploader = ({ onFileUpload, isDarkMode }) => {
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        // Pass the file object directly to the parent (LogViewer)
        // The Worker will handle reading it to avoid main thread blocking.
        onFileUpload(file);
        message.success(`${file.name} prepared for processing`);
    };

    const dropzoneStyle = {
        width: '100%',
        height: '300px',
        border: isDarkMode ? '2px dashed #434343' : '2px dashed #d9d9d9',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDarkMode ? '#141414' : '#fafafa',
        color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'inherit',
        transition: 'border .3s, background .3s',
        cursor: 'pointer'
    };

    return (
        <div style={{ padding: '24px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', width: '70%', minWidth: '800px', margin: '0 auto' }}>
            <div style={{ flex: 1 }}>
                <Title level={2} style={{ color: isDarkMode ? 'white' : 'inherit' }}>Upload Log File</Title>

                <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : undefined, display: 'block', marginBottom: '24px' }}>
                    Drag and drop your UiPath execution.log file here
                </Text>
                <div
                    style={{ marginTop: '32px', ...dropzoneStyle }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <InboxOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                    <Title level={4} style={{ color: isDarkMode ? 'white' : 'inherit' }}>Click or Drag file to this area to upload</Title>
                    <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : undefined }}>
                        Support for standard UiPath execution logs.<br />
                    </Text>
                    <div style={{ marginTop: '24px' }}>
                        <Button type="primary" size="large" icon={<UploadOutlined />} style={{ height: '48px', padding: '0 32px', fontSize: '16px' }}>
                            browse files
                        </Button>
                        <input
                            id="fileInput"
                            type="file"
                            onChange={(e) => processFile(e.target.files[0])}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '48px', opacity: 0.8 }}>
                <Space align="center" style={{ color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)' }}>
                    <SafetyCertificateOutlined style={{ fontSize: '18px', color: '#52c41a' }} />
                    <Text type="secondary" style={{ fontSize: '15px', color: 'inherit' }}>
                        Your data stays local. We do not upload or store your logs on any server.
                    </Text>
                </Space>
            </div>
        </div>
    );
};


export default LogUploader;
