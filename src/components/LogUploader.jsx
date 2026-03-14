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
        height: '320px',
        border: isDarkMode ? '1px solid #333' : '1px solid #eaeaea',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDarkMode ? '#000000' : '#ffffff',
        color: isDarkMode ? '#888' : '#666',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div className="uploader-container" style={{
            padding: '32px 24px',
            textAlign: 'center',
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '32px'
        }}>
            <div style={{ maxWidth: '640px' }}>
                <Title style={{
                    fontSize: '48px',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    lineHeight: 1.1,
                    marginBottom: '16px',
                    color: isDarkMode ? '#fff' : '#000'
                }}>
                    Analyze your logs <br />
                    <span style={{ color: isDarkMode ? '#888' : '#666' }}>at the speed of thought.</span>
                </Title>

                <Text style={{
                    fontSize: '18px',
                    color: isDarkMode ? '#888' : '#666',
                    display: 'block',
                    marginBottom: '32px',
                    fontWeight: 400
                }}>
                    A high-performance, local-first log viewer for UiPath execution logs.
                    Upload a file to get started.
                </Text>

                <div
                    className="dropzone"
                    style={dropzoneStyle}
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = isDarkMode ? '#fff' : '#000';
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#111' : '#fafafa';
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = isDarkMode ? '#333' : '#eaeaea';
                        e.currentTarget.style.backgroundColor = isDarkMode ? '#000' : '#fff';
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        handleDrop(e);
                    }}
                    onClick={() => document.getElementById('fileInput').click()}
                >
                    <div style={{
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: isDarkMode ? '#111' : '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '8px',
                            border: `1px solid ${isDarkMode ? '#333' : '#eee'}`
                        }}>
                            <InboxOutlined style={{ fontSize: '24px', color: isDarkMode ? '#fff' : '#000' }} />
                        </div>
                        <div>
                            <Title level={4} style={{ margin: 0, fontWeight: 600, color: isDarkMode ? '#fff' : '#000' }}>
                                Drop your JSON log file here
                            </Title>
                            <Text style={{ color: isDarkMode ? '#888' : '#666', fontSize: '14px' }}>
                                or click to browse from your computer
                            </Text>
                        </div>
                        <Button
                            className="upload-btn"
                            type="primary"
                            size="large"
                            style={{
                                marginTop: '12px',
                                background: isDarkMode ? '#fff' : '#000',
                                border: 'none',
                                color: isDarkMode ? '#000' : '#fff',
                                height: '40px',
                                padding: '0 24px',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            Select File
                        </Button>
                    </div>
                    <input
                        id="fileInput"
                        type="file"
                        onChange={(e) => processFile(e.target.files[0])}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: isDarkMode ? '#111' : '#fafafa',
                    border: `1px solid ${isDarkMode ? '#333' : '#eaeaea'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <SafetyCertificateOutlined style={{ fontSize: '14px', color: '#10b981' }} />
                    <Text style={{ fontSize: '12px', color: isDarkMode ? '#888' : '#666', fontWeight: 500 }}>
                        Privacy focused: All processing happens in your browser.
                    </Text>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .dropzone:hover {
                    border-color: ${isDarkMode ? '#fff' : '#000'} !important;
                    background-color: ${isDarkMode ? '#0a0a0a' : '#fafafa'} !important;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                }
                .upload-btn:hover {
                    opacity: 0.9;
                    transform: translateY(-1px);
                }
            ` }} />
        </div>
    );
};


export default LogUploader;
