import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import { Layout, Menu, Button, message, Select, ConfigProvider } from 'antd';
import { useTranslation } from 'react-i18next';
import './i18n';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import ClinicScheduler from './components/ClinicScheduler';
import AddScheduleModal from './components/AddScheduleModal';
import ManageDoctorsModal from './components/ManageDoctorsModal';
import PatientView from './components/PatientView';
import RoomView from './components/RoomView';
import RoomPreviewModal from './components/RoomPreviewModal';
import LoginPage from './components/LoginPage';
import logo from './assets/logo.webp';
import io from 'socket.io-client';
import 'antd/dist/reset.css';
import './App.css';
import {LockOutlined, AppstoreOutlined, UserOutlined, HomeOutlined, PlusOutlined, ScheduleTwoTone, TeamOutlined } from '@ant-design/icons';
import ReactCountryFlag from "react-country-flag";
import heIL from 'antd/lib/locale/he_IL';
import enUS from 'antd/lib/locale/en_US';


const { Header, Content } = Layout;
const { Option } = Select;
const socket = io('http://localhost:3001');

function AppContent() {
  const { t } = useTranslation();
  const { language, changeLanguage } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isScheduleModalVisible, setIsScheduleModalVisible] = useState(false);
  const [isDoctorsModalVisible, setIsDoctorsModalVisible] = useState(false);
  const [isRoomPreviewVisible, setIsRoomPreviewVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);

  const isRTL = language === 'he';

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');
    if (storedUsername && storedPassword) {
      setIsAuthenticated(true);
      setUsername(storedUsername);
      setPassword(storedPassword);
      fetchDoctors(storedUsername, storedPassword);
      fetchSchedules(storedUsername, storedPassword);
    }

    socket.on('scheduleUpdate', () => {
      console.log('Socket: scheduleUpdate event received');
      fetchSchedules(username, password);
    });

    return () => {
      socket.off('scheduleUpdate');
    };
  }, []);

  const fetchDoctors = async (username, password) => {
    try {
      const response = await fetch('/api/doctors', {
        headers: {
          'username': username,
          'password': password,
        },
      });
      if (!response.ok) {
        throw new Error(t('failedToFetchDoctors'));
      }
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      message.error(t('failedToLoadDoctors'));
    }
  };

  const fetchSchedules = async (username, password) => {
    console.log('Fetching schedules...');
    try {
      const response = await fetch('/api/schedules', {
        headers: {
          'username': username,
          'password': password,
        },
      });
      if (!response.ok) {
        throw new Error(t('failedToFetchSchedules'));
      }
      const data = await response.json();
      console.log('Fetched schedules:', data);
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      message.error(t('failedToLoadSchedules'));
    }
  };

  const handleAddDoctor = async (newDoctor) => {
    try {
      const response = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDoctor),
      });

      if (!response.ok) {
        throw new Error(t('failedToAddDoctor'));
      }

      const addedDoctor = await response.json();
      setDoctors(prevDoctors => [...prevDoctors, addedDoctor]);
      message.success(t('doctorAddedSuccess'));
    } catch (error) {
      console.error('Error adding doctor:', error);
      message.error(t('failedToAddDoctorTryAgain'));
    }
  };

  const handleUpdateDoctor = async (updatedDoctor) => {
    try {
      const response = await fetch(`/api/doctors/${updatedDoctor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedDoctor),
      });

      if (!response.ok) {
        throw new Error(t('failedToUpdateDoctor'));
      }

      const updatedDoctorData = await response.json();
      setDoctors(prevDoctors => prevDoctors.map(doc => doc.id === updatedDoctorData.id ? updatedDoctorData : doc));
      message.success(t('doctorUpdatedSuccess'));
    } catch (error) {
      console.error('Error updating doctor:', error);
      message.error(t('failedToUpdateDoctorTryAgain'));
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'This doctor has schedules assigned and cannot be deleted.') {
          message.warning(t('doctorHasSchedulesWarning'));
        } else {
          throw new Error(errorData.error || t('failedToDeleteDoctor'));
        }
        return;
      }
  
      setDoctors(prevDoctors => prevDoctors.filter(doc => doc.id !== doctorId));
      message.success(t('doctorDeletedSuccess'));
    } catch (error) {
      console.error('Error deleting doctor:', error);
      message.error(t('failedToDeleteDoctorTryAgain'));
    }
  };

  const handleAddSchedule = async (newSchedule) => {
    console.log('handleAddSchedule called with:', newSchedule);
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'username': username,
          'password': password,
        },
        body: JSON.stringify(newSchedule),
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error response:', errorData);
        throw new Error(errorData.error || t('failedToAddSchedule'));
      }

      const addedSchedule = await response.json();
      console.log('Added schedule:', addedSchedule);
      setSchedules(prevSchedules => [...prevSchedules, addedSchedule]);
      message.success(t('scheduleAddedSuccess'));
    } catch (error) {
      console.error('Error adding schedule:', error);
      message.error(error.message || t('failedToAddScheduleTryAgain'));
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t('failedToRemoveSchedule'));
      }

      setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== scheduleId));
      message.success(t('scheduleRemovedSuccess'));
    } catch (error) {
      console.error('Error removing schedule:', error);
      message.error(t('failedToRemoveScheduleTryAgain'));
    }
  };

  const handleUpdateSchedule = async (updatedSchedule) => {
    try {
      const response = await fetch(`/api/schedules/${updatedSchedule.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedSchedule),
      });

      if (!response.ok) {
        throw new Error(t('failedToUpdateSchedule'));
      }

      const updatedScheduleData = await response.json();
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === updatedScheduleData.id ? updatedScheduleData : schedule
        )
      );
      message.success(t('scheduleUpdatedSuccess'));
    } catch (error) {
      console.error('Error updating schedule:', error);
      message.error(t('failedToUpdateScheduleTryAgain'));
    }
  };

  const handleRoomClick = (roomNumber) => {
    console.log('Room clicked:', roomNumber);
    console.log('Current schedules:', schedules);
    console.log('Current doctors:', doctors);
    setSelectedRoom(roomNumber);
    setIsRoomPreviewVisible(true);
  };

  const getCurrentDayName = () => {
    const days = [t('sunday'), t('monday'), t('tuesday'), t('wednesday'), t('thursday'), t('friday'), t('saturday')];
    const currentDay = days[new Date().getDay()];
    console.log('Current day:', currentDay);
    return currentDay;
  };

  const handleLanguageChange = (lng) => {
    changeLanguage(lng);
    const messageKey = lng === 'en' ? 'languageChangedEnglish' : 'languageChangedHebrew';
    message.success(t(messageKey));
  };

  const handleLogin = (username, password) => {
    setIsAuthenticated(true);
    setUsername(username);
    setPassword(password);
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    fetchDoctors(username, password);
    fetchSchedules(username, password);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    localStorage.removeItem('username');
    localStorage.removeItem('password');
  };

  const HeaderContent = () => (
    <Header style={{ padding: '0 20px', height: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src={logo} alt="Clinic Logo" style={{ height: '60px', marginRight: '20px' }} />
        </div>
        <Menu 
          theme="dark" 
          mode="horizontal" 
          defaultSelectedKeys={['1']} 
          style={{ flex: 1, minWidth: '300px' }}
        >
          <Menu.Item key="1" icon={<AppstoreOutlined />}>
            <Link to="/">{t('management')}</Link>
          </Menu.Item>
          <Menu.Item key="2" icon={<UserOutlined />}>
            <Link to="/patient">{t('patientView')}</Link>
          </Menu.Item>
          <Menu.SubMenu key="3" title={t('rooms')} icon={<HomeOutlined />}>
            {[...Array(17)].map((_, i) => (
              <Menu.Item key={`room-${i + 1}`} onClick={() => handleRoomClick(i + 1)} icon={<HomeOutlined />}>
                {t('room')} {i + 1}
              </Menu.Item>
            ))}
          </Menu.SubMenu>
        </Menu>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Button type="primary" onClick={() => setIsScheduleModalVisible(true)} style={{ marginRight: '10px' }}>
            {t('addSchedules')}
          </Button>
          <Button type="primary" onClick={() => setIsDoctorsModalVisible(true)} style={{ marginRight: '10px' }}>
            {t('manageDoctors')}
          </Button>
          <Button type="primary" onClick={() => handleLogout()} style={{ marginRight: '10px' }}><LockOutlined />
            {t('logout')}
          </Button> <Select 
            value={language} 
            style={{ marginRight: '10px', width: 70 }} 
            onChange={handleLanguageChange}
          >
            <Option value="en"><ReactCountryFlag svg className="emojiFlag"
                countryCode="US"
                style={{
                    fontSize: '2em',
                    lineHeight: '2em',
                }}
                aria-label="United States" />
            </Option>
            <Option value="he">
              <ReactCountryFlag svg className="emojiFlag"
                countryCode="IL"
                style={{
                    fontSize: '2em',
                    lineHeight: '2em',
                }}
                aria-label="Israel" /></Option>
          </Select>
        </div>
      </div>
    </Header>
  );

  return (
    <ConfigProvider direction={isRTL ? 'rtl' : 'ltr'} locale={isRTL ? heIL : enUS}>
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />
          } />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Layout className="layout">
                  <HeaderContent />
                  <Content style={{ padding: '0 50px' }}>
                    <ClinicScheduler 
                      schedules={schedules} 
                      doctors={doctors} 
                      onRemoveSchedule={handleRemoveSchedule}
                      onUpdateSchedule={handleUpdateSchedule}
                      onAddSchedule={handleAddSchedule}  // Make sure this line is present
                    />
                    
                  </Content>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route path="/patient" element={<PatientView />} />
          <Route path="/room/:roomNumber" element={<RoomView />} />
        </Routes>
        <AddScheduleModal
          visible={isScheduleModalVisible}
          onCancel={() => setIsScheduleModalVisible(false)}
          onAddSchedule={handleAddSchedule}
          doctors={doctors}
          existingSchedules={schedules}
        />
        <ManageDoctorsModal
          visible={isDoctorsModalVisible}
          onCancel={() => setIsDoctorsModalVisible(false)}
          onAddDoctor={handleAddDoctor}
          onUpdateDoctor={handleUpdateDoctor}
          onDeleteDoctor={handleDeleteDoctor}
          doctors={doctors}
        />
        <RoomPreviewModal
        visible={isRoomPreviewVisible}
        onCancel={() => {
          console.log('Closing RoomPreviewModal');
          setIsRoomPreviewVisible(false);
        }}
        roomNumber={selectedRoom}
        schedules={schedules}
        doctors={doctors}
        currentDay={getCurrentDayName()}
        />
        
      </Router>
      
    </ConfigProvider>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
