import React, { useState } from 'react';
import { Card, Typography, message, Tooltip, Modal, Form, Input, TimePicker, Select } from 'antd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { DeleteOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import EditScheduleModal from './EditScheduleModal';
import './ClinicScheduler.css';

const { Text } = Typography;
const { Option } = Select;

const ClinicScheduler = ({ schedules, doctors, onRemoveSchedule, onUpdateSchedule, onAddSchedule }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [form] = Form.useForm();

  const daysOfWeek = [
    { en: 'Sunday', he: 'יום ראשון' },
    { en: 'Monday', he: 'יום שני' },
    { en: 'Tuesday', he: 'יום שלישי' },
    { en: 'Wednesday', he: 'יום רביעי' },
    { en: 'Thursday', he: 'יום חמישי' },
    { en: 'Friday', he: 'יום שישי' },
    { en: 'Saturday', he: 'יום שבת' }
  ];

  const orderedDays = isRTL ? daysOfWeek : [...daysOfWeek].reverse();

  const checkConflict = (newSchedule, existingSchedules) => {
  const parseTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const newStart = parseTime(newSchedule.startTime);
  const newEnd = parseTime(newSchedule.endTime);

  return existingSchedules.some(schedule => {
    // Ensure the comparison only happens on the same day
    if (schedule.day !== newSchedule.day || schedule.id === newSchedule.id) return false;
    
    const existingStart = parseTime(schedule.startTime);
    const existingEnd = parseTime(schedule.endTime);
    
    // Check for overlapping time ranges
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

  const handleCellClick = (day, roomNumber) => {
    console.log('Cell clicked:', day, roomNumber);
    setSelectedCell({ day, roomNumber });
    setAddModalVisible(true);
    form.setFieldsValue({
      day: day.en,
      room: `Room ${roomNumber}`,
    });
  };

  const handleAddSchedule = (values) => {
    console.log('Form values:', values);
    console.log('Selected cell:', selectedCell);

    if (!values.timeRange || values.timeRange.length !== 2) {
      console.error('Invalid time range:', values.timeRange);
      message.error(t('invalidTimeRange'));
      return;
    }

    const [startTime, endTime] = values.timeRange;
    const newSchedule = {
      doctorId: values.doctorId,
      startTime: startTime.format('HH:mm'),
      endTime: endTime.format('HH:mm'),
      day: selectedCell.day.en,
      room: `Room ${selectedCell.roomNumber}`,
    };

    console.log('New schedule object:', newSchedule);

    if (checkConflict(newSchedule, schedules)) {
      console.log('Schedule conflict detected');
      message.error(t('scheduleConflictError'));
      return;
    }

    console.log('Calling onAddSchedule with:', newSchedule);
    onAddSchedule(newSchedule);
    setAddModalVisible(false);
    form.resetFields();
  };

  const renderCell = (day, roomNumber) => {
    const cellSchedules = schedules.filter(s => 
        (s.day === day.en || s.day === day.he) && 
        (s.room === `Room ${roomNumber}` || s.room === `חדר ${roomNumber}`)
    );
    
    const isEmpty = cellSchedules.length === 0;

    return (
        <Droppable droppableId={`${day.en}-${roomNumber}`} key={`${day.en}-${roomNumber}`}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                        backgroundColor: snapshot.isDraggingOver ? '#e6f7ff' : 'transparent',
                        minHeight: '165px',
                        padding: '4px',
                        border: '1px solid #f0f0f0',
                        borderRadius: '10px',
                        direction: isRTL ? 'rtl' : 'ltr',
                        textAlign: isRTL ? 'right' : 'left',
                        position: 'relative',
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
                                            title={
                                                <div>
                                                    <Text strong>{doctor ? doctor.name : t('unknown')}</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: '0.85em' }}>
                                                        {doctor ? doctor.speciality : t('notAvailable')}
                                                    </Text>
                                                </div>
                                            }
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
                    <Tooltip title={t('addSchedule')}>
                        <div 
                            className={`add-schedule-button ${isEmpty ? 'empty' : 'below'}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCellClick(day, roomNumber);
                            }}
                        >
                            <PlusCircleOutlined />
                        </div>
                    </Tooltip>
                </div>
            )}
        </Droppable>
    );
};


  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        style={{
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          overflowX: 'hidden',
          backgroundColor: '#ffffff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          padding: '16px',
          direction: isRTL ? 'rtl' : 'ltr',
        }}
        className="custom-scrollbar"
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: '#fafafa',
            fontWeight: 'bold',
            padding: '12px 0',
            borderBottom: '2px solid #1890ff',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ width: '100px', padding: '0 8px', textAlign: isRTL ? 'right' : 'left' }}>
            {t('room')}
          </div>
          {orderedDays.map(day => (
            <div key={day.en} style={{ width: '200px', padding: '0 8px', textAlign: isRTL ? 'right' : 'left' }}>
              {t(day.en.toLowerCase())}
            </div>
          ))}
        </div>
        {[...Array(17)].map((_, i) => {
          const roomNumber = i + 1;
          return (
            <div
              key={roomNumber}
              style={{
                display: 'flex',
                borderBottom: '1px solid #f0f0f0', 
              }}
            >
              <div
                style={{
                  width: '100px',
                  padding: '12px 8px',
                  fontWeight: 'bold',
                  backgroundColor: '#fafafa',
                  borderRight: isRTL ? 'none' : '1px solid #f0f0f0',
                  borderLeft: isRTL ? '1px solid #f0f0f0' : 'none',
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
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
      <Modal
        visible={addModalVisible}
        title={t('addSchedule')}
        onCancel={() => setAddModalVisible(false)}
        onOk={() => {
          console.log('Modal OK clicked');
          form.submit();
        }}
      >
        <Form 
          form={form} 
          onFinish={(values) => {
            console.log('Form submitted with values:', values);
            handleAddSchedule(values);
          }} 
          layout="vertical"
        >
          <Form.Item name="doctorId" label={t('selectDoctor')} rules={[{ required: true }]}>
          <Select
            showSearch
            filterOption={(input, option) => 
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
              {doctors.map(doctor => (
                <Option key={doctor.id} value={doctor.id}>
                {`${doctor.name} - ${doctor.speciality}`}
              </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="timeRange" label={t('timeRange')} rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" placeholder={[t('startTime'), t('endTime')]}/>
          </Form.Item>
          <Form.Item name="day" label={t('day')} hidden>
            <Input />
          </Form.Item>
          <Form.Item name="room" label={t('room')} hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </DragDropContext>
  );
};

export default ClinicScheduler;