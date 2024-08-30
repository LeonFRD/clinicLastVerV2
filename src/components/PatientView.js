import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, List, Spin, Divider, ConfigProvider } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';

// Import Ant Design locales
import heIL from 'antd/lib/locale/he_IL';
import enUS from 'antd/lib/locale/en_US';

const { Title, Text } = Typography;

const PatientView = () => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [schedules, setSchedules] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      const response = await fetch('/api/schedules');
      if (!response.ok) throw new Error('Failed to fetch schedules');
      const data = await response.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  }, []);

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
      <div style={{ padding: '20px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '30px' }}>
          {t('todayDoctorSchedules', { day: t(currentDay) })}
        </Title>
        <Row gutter={[16, 16]}>
          {doctors.map(doctor => {
            const doctorSchedules = currentDaySchedules.filter(schedule => schedule.doctorId === doctor.id);
            if (doctorSchedules.length === 0) return null;
            
            return (
              <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                <Card hoverable style={{ height: '100%' }}>
                  <Title level={4}>{doctor.name}</Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                    <MedicineBoxOutlined style={{ marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0' }} />
                    {doctor.speciality}
                  </Text>
                  <Divider />
                  <List
                    itemLayout="horizontal"
                    dataSource={doctorSchedules}
                    renderItem={schedule => (
                      <List.Item>
                        <List.Item.Meta
                          title={t('roomNumber', { number: schedule.room.split(' ')[1] })}
                          description={
                            <Text>
                              <ClockCircleOutlined style={{ marginRight: isRTL ? '0' : '8px', marginLeft: isRTL ? '8px' : '0' }} />
                              {`${schedule.startTime} - ${schedule.endTime}`}
                            </Text>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </ConfigProvider>
  );
};

export default PatientView;