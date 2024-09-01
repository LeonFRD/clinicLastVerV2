import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Typography, List, Spin, ConfigProvider, Avatar, Tag, Empty, Tooltip, Layout, Space } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import io from 'socket.io-client';
import heIL from 'antd/lib/locale/he_IL';
import enUS from 'antd/lib/locale/en_US';
import logo from '../assets/logo.webp';

const { Title, Text } = Typography;
const { Header, Content } = Layout;

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
  const currentDate = new Date().toLocaleDateString(i18n.language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const getCurrentDaySchedules = () => {
    return schedules.filter(schedule => schedule.day.toLowerCase() === currentDay);
  };

  const currentDaySchedules = getCurrentDaySchedules();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f2f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  const getDoctorColor = (index) => {
    const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
    return colors[index % colors.length];
  };

  return (
    <ConfigProvider direction={isRTL ? 'rtl' : 'ltr'} locale={isRTL ? heIL : enUS}>
      <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        backgroundColor: '#001529', 
        padding: '0 20px', 
        height: 'auto',
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <img src={logo} alt="Clinic Logo" style={{ height: '50px', marginRight: '20px' }} />
        </div>
        <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
          <Title level={3} style={{ margin: 0, color: '#fff' }}>
            {t('patientView')}
          </Title>
        </div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <Space align="center">
            <CalendarOutlined style={{ fontSize: '24px', color: '#fff' }} />
            <Text strong style={{ fontSize: '16px', color: '#fff' }}>{currentDate}</Text>
          </Space>
        </div>
      </Header>
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '16px', 
          borderBottom: '1px solid #d9d9d9',
          textAlign: 'center'
        }}>
          <Space align="center">
            <CalendarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
            <Title level={3} style={{ margin: 0 }}>
              {t('todayDoctorSchedules', { day: t(currentDay) })}
            </Title>
          </Space>
        </div>
        <Content style={{ padding: '24px', backgroundColor: '#f0f2f5' }}>
          <Row gutter={[16, 16]}>
            {doctors.map((doctor, index) => {
              const doctorSchedules = currentDaySchedules.filter(schedule => schedule.doctorId === doctor.id);
              if (doctorSchedules.length === 0) return null;
              
              const doctorColor = getDoctorColor(index);
              
              return (
                <Col xs={24} sm={12} md={8} lg={6} key={doctor.id}>
                  <Card 
                    hoverable 
                    style={{ height: '100%', borderRadius: '10px', overflow: 'hidden' }}
                    cover={
                      <div style={{ 
                        background: doctorColor,
                        height: '80px',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 20px'
                      }}>
                        <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#fff', color: doctorColor, marginRight: '15px' }} />
                        <div>
                          <Title level={4} style={{ margin: 0, color: 'white' }}>{doctor.name}</Title>
                          <Tag color="white" style={{ color: doctorColor }}>
                            <MedicineBoxOutlined style={{ marginRight: '5px' }} />
                            {doctor.speciality}
                          </Tag>
                        </div>
                      </div>
                    }
                  >
                    <List
                      itemLayout="horizontal"
                      dataSource={doctorSchedules}
                      renderItem={schedule => (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar style={{ backgroundColor: doctorColor }}>{schedule.room.split(' ')[1]}</Avatar>}
                            title={<Text strong>{t('roomNumber', { number: schedule.room.split(' ')[1] })}</Text>}
                            description={
                              <Tooltip title={t('scheduleTime')}>
                                <Text>
                                  <ClockCircleOutlined style={{ marginRight: '8px', color: doctorColor }} />
                                  {`${schedule.startTime} - ${schedule.endTime}`}
                                </Text>
                              </Tooltip>
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
          {currentDaySchedules.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text style={{ fontSize: '16px' }}>
                  {t('noSchedulesForToday')}
                </Text>
              }
            />
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default PatientView;