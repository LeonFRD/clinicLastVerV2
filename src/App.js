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
import io from 'socket.io-client';
import 'antd/dist/reset.css';

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
        throw new Error('Failed to fetch doctors');
      }
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      message.error('Failed to load doctors. Please try again later.');
    }
  };

  const fetchSchedules = async (username, password) => {
    try {
      const response = await fetch('/api/schedules', {
        headers: {
          'username': username,
          'password': password,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch schedules');
      }
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      message.error('Failed to load schedules. Please try again later.');
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
        throw new Error('Failed to add doctor');
      }

      const addedDoctor = await response.json();
      setDoctors(prevDoctors => [...prevDoctors, addedDoctor]);
      message.success('Doctor added successfully');
    } catch (error) {
      console.error('Error adding doctor:', error);
      message.error('Failed to add doctor. Please try again.');
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
        throw new Error('Failed to update doctor');
      }

      const updatedDoctorData = await response.json();
      setDoctors(prevDoctors => prevDoctors.map(doc => doc.id === updatedDoctorData.id ? updatedDoctorData : doc));
      message.success('Doctor updated successfully');
    } catch (error) {
      console.error('Error updating doctor:', error);
      message.error('Failed to update doctor. Please try again.');
    }
  };

  const handleDeleteDoctor = async (doctorId) => {
    try {
      const response = await fetch(`/api/doctors/${doctorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete doctor');
      }

      setDoctors(prevDoctors => prevDoctors.filter(doc => doc.id !== doctorId));
      message.success('Doctor deleted successfully');
    } catch (error) {
      console.error('Error deleting doctor:', error);
      message.error('Failed to delete doctor. Please try again.');
    }
  };

  const handleAddSchedule = async (newSchedule) => {
    try {
      const response = await fetch('/api/schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchedule),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add schedule');
      }

      const addedSchedule = await response.json();
      setSchedules(prevSchedules => [...prevSchedules, addedSchedule]);
      setIsScheduleModalVisible(false);
      message.success('Schedule added successfully');
    } catch (error) {
      console.error('Error adding schedule:', error);
      message.error(error.message || 'Failed to add schedule. Please try again.');
    }
  };

  const handleRemoveSchedule = async (scheduleId) => {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove schedule');
      }

      setSchedules(prevSchedules => prevSchedules.filter(schedule => schedule.id !== scheduleId));
      message.success('Schedule removed successfully');
    } catch (error) {
      console.error('Error removing schedule:', error);
      message.error('Failed to remove schedule. Please try again.');
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
        throw new Error('Failed to update schedule');
      }

      const updatedScheduleData = await response.json();
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === updatedScheduleData.id ? updatedScheduleData : schedule
        )
      );
      message.success('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      message.error('Failed to update schedule. Please try again.');
    }
  };

  const handleRoomClick = (roomNumber) => {
    setSelectedRoom(roomNumber);
    setIsRoomPreviewVisible(true);
  };

  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // const changeLanguage = (lng) => {
  //   i18n.changeLanguage(lng);
  //   setRtl(lng === 'he');
  //   message.success(`Language changed to ${lng === 'en' ? 'English' : 'עברית'}`);
  // };

  const handleLanguageChange = (lng) => {
    changeLanguage(lng);
    message.success(`Language changed to ${lng === 'en' ? 'English' : 'עברית'}`);
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
    <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']} style={{ flex: 1 }}>
        <Menu.Item key="1"><Link to="/">{t('management')}</Link></Menu.Item>
        <Menu.Item key="2"><Link to="/patient">{t('patientView')}</Link></Menu.Item>
        <Menu.SubMenu key="3" title={t('rooms')}>
          {[...Array(17)].map((_, i) => (
            <Menu.Item key={`room-${i + 1}`} onClick={() => handleRoomClick(i + 1)}>
              {t('room')} {i + 1}
            </Menu.Item>
          ))}
        </Menu.SubMenu>
      </Menu>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button type="primary" onClick={() => setIsScheduleModalVisible(true)} style={{ marginRight: '10px' }}>
          {t('addSchedule')}
        </Button>
        <Button type="primary" onClick={() => setIsDoctorsModalVisible(true)} style={{ marginRight: '10px' }}>
          {t('manageDoctors')}
        </Button>
        <Select 
          value={language} 
          style={{ width: 120, marginRight: '10px' }} 
          onChange={handleLanguageChange}
        >
          <Option value="en">English</Option>
          <Option value="he">עברית</Option>
        </Select>
        <Button onClick={handleLogout}>{t('logout')}</Button>
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
          onCancel={() => setIsRoomPreviewVisible(false)}
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