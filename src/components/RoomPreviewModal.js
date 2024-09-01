import React, { useMemo, useEffect } from 'react';
import { Modal, Card, Typography, List, Avatar, Tag, Button, ConfigProvider } from 'antd';
import { ClockCircleOutlined, MedicineBoxOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../contexts/LanguageContext';

import heIL from 'antd/lib/locale/he_IL';
import enUS from 'antd/lib/locale/en_US';

const { Title, Text } = Typography;

const RoomPreviewModal = ({ visible, onCancel, roomNumber, schedules = [], doctors = [], currentDay = '' }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'he';

  const translateDay = (day) => {
    if (!day) return '';
    const translations = {
      'sunday': 'יום ראשון',
      'monday': 'יום שני',
      'tuesday': 'יום שלישי',
      'wednesday': 'יום רביעי',
      'thursday': 'יום חמישי',
      'friday': 'יום שישי',
      'saturday': 'יום שבת',
    };
    return translations[day.toLowerCase()] || day;
  };

  useEffect(() => {
    console.log('RoomPreviewModal props:', { visible, roomNumber, currentDay });
    console.log('Schedules received:', schedules);
    console.log('Doctors received:', doctors);
  }, [visible, roomNumber, currentDay, schedules, doctors]);

  const filteredSchedules = useMemo(() => {
    console.log('Filtering schedules for room', roomNumber, 'and day', currentDay);
    return schedules.filter(schedule => {
      if (!schedule || typeof schedule !== 'object') {
        console.log('Invalid schedule:', schedule);
        return false;
      }
      console.log('Checking schedule:', schedule);
      const roomMatch = (schedule.room || '').includes(`${roomNumber}`);
      const scheduleDay = (schedule.day || '').toLowerCase();
      const currentDayLower = (currentDay || '').toLowerCase();
      const dayMatch = 
        scheduleDay === currentDayLower ||
        translateDay(scheduleDay) === currentDayLower ||
        scheduleDay === translateDay(currentDayLower);
      console.log('Room match:', roomMatch, 'Day match:', dayMatch);
      return roomMatch && dayMatch;
    });
  }, [schedules, roomNumber, currentDay]);

  useEffect(() => {
    console.log('Filtered schedules:', filteredSchedules);
  }, [filteredSchedules]);

  const handleEnterRoom = () => {
    navigate(`/room/${roomNumber}`);
    onCancel();
  };

  return (
    <ConfigProvider direction={isRTL ? 'rtl' : 'ltr'} locale={isRTL ? heIL : enUS}>
      <Modal
        visible={visible}
        onCancel={onCancel}
        footer={null}
        width={450}
        bodyStyle={{ padding: 0 }}
      >
        <Card 
          style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
          cover={
            <div style={{ 
              height: 100, 
              background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Avatar size={60} style={{ backgroundColor: '#ffffff', color: '#1890ff' }}>
                {isRTL ? 'ח' : 'R'}{roomNumber}
              </Avatar>
            </div>
          }
        >
          <Title level={3} style={{ textAlign: 'center', marginBottom: '10px' }}>
            {t('roomNumber', { number: roomNumber })}
          </Title>
          <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: '10px' }}>
            {t('previewForDay', { day: currentDay })}
          </Text>
          <List
            itemLayout="horizontal"
            dataSource={filteredSchedules}
            renderItem={schedule => {
              console.log('Rendering schedule:', schedule);
              const doctor = doctors.find(d => d.id === schedule.doctorId);
              console.log('Doctor found:', doctor);
              return (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} size="small" />}
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
                        {schedule.startTime && schedule.endTime 
                          ? `${schedule.startTime} - ${schedule.endTime}`
                          : t('timeNotAvailable')}
                      </Text>
                    }
                  />
                </List.Item>
              );
            }}
          />
          {filteredSchedules.length === 0 && (
            <Text style={{ display: 'block', textAlign: 'center', margin: '10px 0' }}>
              {t('noSchedulesForRoom')}
            </Text>
          )}
          <Button type="primary" block onClick={handleEnterRoom} style={{ marginTop: '15px' }}>
            {t('enterRoomPage')}
          </Button>
        </Card>
      </Modal>
    </ConfigProvider>
  );
};

export default RoomPreviewModal;