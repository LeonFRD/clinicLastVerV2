import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Typography, List, Spin, Avatar, Tag, ConfigProvider } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';
import io from 'socket.io-client';
import logo2 from '../assets/logoDark.webp';

// Import Ant Design locales
import heIL from 'antd/lib/locale/he_IL';
import enUS from 'antd/lib/locale/en_US';

const { Title, Text } = Typography;

const RoomView = () => {
  const { roomNumber } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'he';
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data.filter(schedule => schedule.room === `Room ${roomNumber}` || schedule.room === `חדר ${roomNumber}`));
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, [roomNumber]);

  const fetchDoctors = useCallback(async () => {
    try {
      const response = await fetch('/api/doctors');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSchedules(), fetchDoctors()]);
    setLoading(false);
  }, [fetchSchedules, fetchDoctors]);

  useEffect(() => {
    fetchData();

    const socket = io('http://localhost:3001');
    socket.on('scheduleUpdate', fetchData);
    socket.on('doctorUpdate', fetchData);

    return () => socket.disconnect();
  }, [fetchData]);

  const getCurrentDayName = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDayName();

  const getCurrentDaySchedules = () => {
    return schedules.filter(schedule => schedule.day.toLowerCase() === currentDay);
  };

  const currentDaySchedules = getCurrentDaySchedules();

  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <ConfigProvider direction={isRTL ? 'rtl' : 'ltr'} locale={isRTL ? heIL : enUS}>
      <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card 
          style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
          cover={
            <div style={{ 
              height: 150, 
              background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Avatar 
                size={80} 
                src={logo2}
                style={{
                  background: '#ffffff',
                  padding: '2px',  // Add a small padding to create a border effect
                }}
              />
            </div>
          }
        >
          <Title level={2} style={{ textAlign: 'center', marginBottom: '20px' }}>
            {t('roomNumber', { number: roomNumber })}
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '20px' }}>
            {t('scheduleForDay', { day: t(currentDay) })}
          </Text>
          <List
            itemLayout="horizontal"
            dataSource={currentDaySchedules}
            renderItem={schedule => {
              const doctor = doctors.find(d => d.id === schedule.doctorId);
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div>
                        <Text strong>{doctor ? doctor.name : t('unknownDoctor')}</Text>
                        <Tag color="blue" style={{ marginLeft: isRTL ? '0' : '8px', marginRight: isRTL ? '8px' : '0' }}>
                          <MedicineBoxOutlined style={{ marginRight: '4px' }} />
                          {doctor ? doctor.speciality : t('notAvailable')}
                        </Tag>
                      </div>
                    }
                    description={
                      <Text>
                        <ClockCircleOutlined style={{ marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0' }} />
                        {`${schedule.startTime} - ${schedule.endTime}`}
                      </Text>
                    }
                  />
                </List.Item>
              );
            }}
          />
          {currentDaySchedules.length === 0 && (
            <Text style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>
              {t('noSchedulesForRoom')}
            </Text>
          )}
        </Card>
      </div>
    </ConfigProvider>
  );
};

export default RoomView;