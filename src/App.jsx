import React, { useState } from 'react';
import { Layout, Typography, ConfigProvider, theme, Space, Switch, App as AntApp } from 'antd';
import LogViewer from './components/LogViewer';
import { RobotOutlined, BulbFilled, BulbOutlined } from '@ant-design/icons';
import logo from './assets/logo.webp';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const toggleTheme = (checked) => setIsDarkMode(checked);

  // Reset function to go back to landing page
  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#0070c0', // UiPath Blue-ish
          borderRadius: 6,
          fontFamily: "'Inter', sans-serif",
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? '#1f1f1f' : '#002846', // Darker blue header
          }
        }
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#141414' : '#f0f2f5' }}>
          {/* Header, Content, Footer content remains same, just wrapped */}
          <Header style={{
            position: 'relative', // Enable absolute positioning for children
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            zIndex: 10,
            justifyContent: 'space-between'
          }}>
            {/* Left-aligned Logo */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <img src={logo} alt="UiPath Logo" style={{ height: '48px' }} />
            </div>

            {/* Absolute Centered Title */}
            <div style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              cursor: 'pointer'
            }} onClick={handleReset}>
              <Title level={4} style={{
                color: 'white',
                margin: 0,
                fontWeight: 600,
                fontFamily: "'Product Sans', 'Inter', sans-serif"
              }}>
                UiPath Log Viewer
              </Title>
            </div>

            {/* Right-aligned Switch */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Switch
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
                checked={isDarkMode}
                onChange={toggleTheme}
              />
            </div>
          </Header>

          <Content style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 64px - 40px)', // adjust for footer
            width: '100%', // Ensure full width
            maxWidth: '100%',
            overflow: 'hidden'
          }}>
            <div
              style={{
                flex: 1,
                width: '100%',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                background: isDarkMode ? '#1f1f1f' : '#fff',
                borderRadius: '8px',
                boxShadow: isDarkMode ? '0 1px 2px rgba(255,255,255,0.05)' : '0 1px 2px rgba(0,0,0,0.05)',
                padding: '16px'
              }}
            >
              <LogViewer key={resetKey} isDarkMode={isDarkMode} onThemeChange={setIsDarkMode} />
            </div>
          </Content>

          <Footer style={{
            textAlign: 'center',
            padding: '10px 50px',
            background: 'transparent',
            color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)'
          }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>UiPath Log Viewer ©2025</Text>
          </Footer>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
