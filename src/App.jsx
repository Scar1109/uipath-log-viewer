import React, { useState } from 'react';
import { Layout, Typography, ConfigProvider, theme, Space, Switch, App as AntApp } from 'antd';
import LogViewer from './components/LogViewer';
import { RobotOutlined, BulbFilled, BulbOutlined, GithubOutlined, InstagramOutlined, YoutubeOutlined, LinkedinOutlined } from '@ant-design/icons';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
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
          colorPrimary: '#000000',
          borderRadius: 6,
          fontFamily: "'Inter', -apple-system, sans-serif",
          colorBgContainer: isDarkMode ? '#000000' : '#ffffff',
          colorBgLayout: isDarkMode ? '#000000' : '#ffffff',
          colorBorderSecondary: isDarkMode ? '#333333' : '#eaeaea',
        },
        components: {
          Layout: {
            headerBg: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)',
            headerPadding: '0 24px',
            headerHeight: 64,
          },
          Button: {
            borderRadius: 6,
            controlHeight: 36,
            fontWeight: 500,
          },
          Input: {
            borderRadius: 6,
            controlHeight: 36,
          },
          Select: {
            borderRadius: 6,
            controlHeight: 36,
          }
        }
      }}
    >
      <AntApp>
        <Layout style={{ minHeight: '100vh', background: isDarkMode ? '#000000' : '#ffffff' }}>
          <Header className="app-header" style={{
            position: 'sticky',
            top: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1000,
            background: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDarkMode ? '#333' : '#eaeaea'}`,
            padding: '0 24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={handleReset}>
              <RobotOutlined style={{ fontSize: '24px', color: isDarkMode ? '#fff' : '#000' }} />
              <Title level={5} style={{
                margin: 0,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: isDarkMode ? '#fff' : '#000',
                fontFamily: "'Inter', sans-serif"
              }}>
                Log Viewer
              </Title>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Space>
                 <Switch
                  checkedChildren={<BulbFilled style={{ fontSize: '12px' }} />}
                  unCheckedChildren={<BulbOutlined style={{ fontSize: '12px' }} />}
                  checked={isDarkMode}
                  onChange={toggleTheme}
                  style={{ background: isDarkMode ? '#333' : '#eaeaea' }}
                />
              </Space>
            </div>
          </Header>

          <Content style={{
            padding: '16px 24px',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            minHeight: 'calc(100vh - 64px - 60px)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div
              style={{
                flex: 1,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <LogViewer key={resetKey} isDarkMode={isDarkMode} onThemeChange={setIsDarkMode} />
            </div>
          </Content>

          <Footer style={{
            padding: '24px 40px',
            background: isDarkMode ? '#000000' : '#ffffff',
            borderTop: `1px solid ${isDarkMode ? '#333' : '#eaeaea'}`,
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%',
              maxWidth: '1400px',
              margin: '0 auto',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Left Side: Credits */}
              <div style={{ flex: '1 1 200px', textAlign: 'left' }}>
                <Text style={{ fontSize: '12px', color: isDarkMode ? '#555' : '#999' }}>
                  Made by <Text strong style={{ color: isDarkMode ? '#ccc' : '#333' }}>Kaveen Dewapura</Text>
                </Text>
              </div>

              {/* Middle: Title & Year */}
              <div style={{ flex: '1 1 300px', textAlign: 'center' }}>
                <Text style={{ fontSize: '13px', color: isDarkMode ? '#888' : '#666', fontWeight: 500 }}>
                  UiPath Log Viewer <span style={{ opacity: 0.5 }}>/</span> 2026
                </Text>
              </div>
              
              {/* Right Side: Social Icons */}
              <div style={{ flex: '1 1 200px', textAlign: 'right' }}>
                <Space size="middle">
                  <a href="https://github.com/Scar1109" target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? '#888' : '#666' }}>
                    <GithubOutlined style={{ fontSize: '16px' }} className="footer-link" />
                  </a>
                  <a href="https://www.instagram.com/kavee_dineth/" target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? '#888' : '#666' }}>
                    <InstagramOutlined style={{ fontSize: '16px' }} className="footer-link" />
                  </a>
                  <a href="https://www.linkedin.com/in/kaveendinethma/" target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? '#888' : '#666' }}>
                    <LinkedinOutlined style={{ fontSize: '16px' }} className="footer-link" />
                  </a>
                  <a href="https://www.youtube.com/@kaveendinethma1109" target="_blank" rel="noopener noreferrer" style={{ color: isDarkMode ? '#888' : '#666' }}>
                    <YoutubeOutlined style={{ fontSize: '16px' }} className="footer-link" />
                  </a>
                </Space>
              </div>
            </div>
          </Footer>
        </Layout>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
