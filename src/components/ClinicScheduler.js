import React, { useState } from 'react';
import { Card, Typography, message, Tooltip } from 'antd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EditScheduleModal from './EditScheduleModal'; // We'll create this component next

const { Text } = Typography;

const ClinicScheduler = ({ schedules, doctors, onRemoveSchedule, onUpdateSchedule }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const daysOfWeek = [
    { en: 'Sunday', he: 'יום ראשון' },
    { en: 'Monday', he: 'יום שני' },
    { en: 'Tuesday', he: 'יום שלישי' },
    { en: 'Wednesday', he: 'יום רביעי' },
    { en: 'Thursday', he: 'יום חמישי' },
    { en: 'Friday', he: 'יום שישי' },
    { en: 'Saturday', he: 'יום שבת' }
  ];

  // For RTL, we keep the same order but render it from right to left
  const orderedDays = isRTL ? daysOfWeek : [...daysOfWeek].reverse();

  const checkConflict = (newSchedule, existingSchedules) => {
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = parseTime(newSchedule.startTime);
    const newEnd = parseTime(newSchedule.endTime);

    return existingSchedules.some(schedule => {
      if (schedule.id === newSchedule.id) return false; // Skip the schedule being moved
      const existingStart = parseTime(schedule.startTime);
      const existingEnd = parseTime(schedule.endTime);
      return !(newEnd <= existingStart || newStart >= existingEnd);
    });
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    const schedule = schedules.find(s => s.id.toString() === draggableId);
    const [newDay, newRoom] = destination.droppableId.split('-');
    const [oldDay, oldRoom] = source.droppableId.split('-');

    // If no change in day or room, no need to update
    if (newDay === oldDay && newRoom === oldRoom) {
      return;
    }

    const updatedSchedule = {
      ...schedule,
      day: newDay,
      room: `Room ${newRoom}`,
    };

    const existingSchedulesInDestination = schedules.filter(
      s => s.day === newDay && s.room === `Room ${newRoom}` && s.id !== schedule.id
    );

    if (checkConflict(updatedSchedule, existingSchedulesInDestination)) {
      message.error(t('scheduleConflictError'));
      return;
    }

    onUpdateSchedule(updatedSchedule);
  };

  const handleEditClick = (schedule) => {
    setEditingSchedule(schedule);
    setEditModalVisible(true);
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setEditingSchedule(null);
  };

  const handleEditSchedule = (updatedSchedule) => {
    onUpdateSchedule(updatedSchedule);
    setEditModalVisible(false);
    setEditingSchedule(null);
  };

  const renderCell = (day, roomNumber) => {
    const cellSchedules = schedules.filter(s => 
      (s.day === day.en || s.day === day.he) && 
      (s.room === `Room ${roomNumber}` || s.room === `חדר ${roomNumber}`)
    );
    
    return (
      <Droppable droppableId={`${day.en}-${roomNumber}`} key={`${day.en}-${roomNumber}`}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            style={{
              backgroundColor: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
              minHeight: '80px',
              padding: '4px',
              border: '1px solid #f0f0f0',
              borderRadius: '4px',
              direction: isRTL ? 'rtl' : 'ltr',
              textAlign: isRTL ? 'right' : 'left'
            }}
          >
            {cellSchedules.map((schedule, index) => {
              const doctor = doctors.find(d => d.id === schedule.doctorId);
              return (
                <Draggable key={schedule.id} draggableId={schedule.id.toString()} index={index}>
                  {(provided, snapshot) => (
                    <Card
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      size="small"
                      style={{
                        marginBottom: '8px',
                        backgroundColor: snapshot.isDragging ? '#fafafa' : 'white',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        ...provided.draggableProps.style,
                      }}
                      actions={[
                        <Tooltip title={t('editSchedule')}>
                          <EditOutlined
                            key="edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(schedule);
                            }}
                          />
                        </Tooltip>,
                        <Tooltip title={t('deleteSchedule')}>
                          <DeleteOutlined
                            key="delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveSchedule(schedule.id);
                            }}
                            style={{ color: '#ff4d4f' }}
                          />
                        </Tooltip>
                      ]}
                    >
                      <Card.Meta
                        title={<Text strong>{doctor ? doctor.name : t('unknown')}</Text>}
                        description={
                          <Text type="secondary">
                            {schedule.startTime} - {schedule.endTime}
                          </Text>
                        }
                      />
                    </Card>
                  )}
                </Draggable>
              );
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ 
        overflowX: 'auto', 
        backgroundColor: '#ffffff', 
        border: '1px solid #f0f0f0', 
        borderRadius: '8px', 
        padding: '16px',
        direction: isRTL ? 'rtl' : 'ltr'
      }}>
        <div style={{ 
          display: 'flex', 
          backgroundColor: '#fafafa', 
          fontWeight: 'bold', 
          padding: '12px 0', 
          borderBottom: '2px solid #1890ff',
        }}>
          <div style={{ width: '100px', padding: '0 8px', textAlign: isRTL ? 'right' : 'left' }}>{t('room')}</div>
          {orderedDays.map(day => (
            <div key={day.en} style={{ width: '200px', padding: '0 8px', textAlign: isRTL ? 'right' : 'left' }}>
              {t(day.en.toLowerCase())}
            </div>
          ))}
        </div>
        {[...Array(17)].map((_, i) => {
          const roomNumber = i + 1;
          return (
            <div key={roomNumber} style={{ 
              display: 'flex', 
              borderBottom: '1px solid #f0f0f0',
            }}>
              <div style={{ 
                width: '100px', 
                padding: '12px 8px', 
                fontWeight: 'bold', 
                backgroundColor: '#fafafa', 
                borderRight: isRTL ? 'none' : '1px solid #f0f0f0',
                borderLeft: isRTL ? '1px solid #f0f0f0' : 'none',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t('roomNumber', { number: roomNumber })}
              </div>
              {orderedDays.map(day => (
                <div key={day.en} style={{ width: '200px', padding: '8px' }}>
                  {renderCell(day, roomNumber)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <EditScheduleModal
        visible={editModalVisible}
        onCancel={handleEditModalClose}
        onEditSchedule={handleEditSchedule}
        schedule={editingSchedule}
        existingSchedules={schedules}
      />
    </DragDropContext>
  );
};

export default ClinicScheduler;