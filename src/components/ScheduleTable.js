import React from 'react';
import { Table, Button, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ScheduleTable = ({ schedules, doctors, onRemoveSchedule }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';

  // Define days in both languages
  const daysOfWeek = [
    { en: 'sunday', he: 'יום ראשון' },
    { en: 'monday', he: 'יום שני' },
    { en: 'tuesday', he: 'יום שלישי' },
    { en: 'wednesday', he: 'יום רביעי' },
    { en: 'thursday', he: 'יום חמישי' },
    { en: 'friday', he: 'יום שישי' },
    { en: 'saturday', he: 'יום שבת' }
  ];

  const columns = [
    { 
      title: t('room'), 
      dataIndex: 'room', 
      key: 'room', 
      width: 100,
      align: isRTL ? 'right' : 'left'
    },
    ...daysOfWeek.map(day => ({
      title: t(day.en),
      dataIndex: day.en,
      key: day.en,
      align: isRTL ? 'right' : 'left',
      render: (schedules) => (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '5px',
          alignItems: isRTL ? 'flex-end' : 'flex-start'
        }}>
          {schedules && schedules.map((schedule) => {
            const doctor = doctors.find(d => d.id === schedule.doctorId);
            return (
              <div key={schedule.id} style={{ 
                backgroundColor: '#f0f0f0', 
                padding: '5px', 
                borderRadius: '4px',
                fontSize: '12px',
                textAlign: isRTL ? 'right' : 'left',
                direction: isRTL ? 'rtl' : 'ltr'
              }}>
                <div>
                  <strong>{doctor ? doctor.name : t('unknown')}</strong> 
                  ({doctor ? doctor.speciality : t('n/a')})
                </div>
                <div>{t('timeRange', { start: schedule.startTime, end: schedule.endTime })}</div>
                <Tooltip title={t('removeSchedule')}>
                  <Button 
                    type="link" 
                    icon={<DeleteOutlined />}
                    size="small" 
                    onClick={() => onRemoveSchedule(schedule.id)}
                    style={{ padding: 0, height: 'auto' }}
                  />
                </Tooltip>
              </div>
            );
          })}
        </div>
      )
    }))
  ];

  const dataSource = [...Array(17)].map((_, i) => {
    const roomNumber = i + 1;
    const roomSchedules = daysOfWeek.reduce((acc, day) => {
      acc[day.en] = schedules.filter(s => {
        const roomMatch = s.room === `Room ${roomNumber}` || s.room === `חדר ${roomNumber}`;
        const dayMatch = s.day.toLowerCase() === day.en || s.day === day.he;
        return roomMatch && dayMatch;
      });
      return acc;
    }, {});

    return {
      key: roomNumber,
      room: t('roomNumber', { number: roomNumber }),
      ...roomSchedules
    };
  });

  return (
    <Table 
      columns={columns} 
      dataSource={dataSource} 
      pagination={{ 
        pageSize: 7,
        showSizeChanger: false,
        showQuickJumper: true,
        showTotal: (total, range) => t('paginationTotal', { start: range[0], end: range[1], total }),
      }}
      scroll={{ x: true }}
      locale={{
        emptyText: t('noSchedules'),
      }}
    />
  );
};

export default ScheduleTable;