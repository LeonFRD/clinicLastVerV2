import React from 'react';
import { Modal, Form, Select, TimePicker, message } from 'antd';
import { useTranslation } from 'react-i18next';

const { Option } = Select;

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AddScheduleModal = ({ visible, onCancel, onAddSchedule, doctors, existingSchedules }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const checkConflict = (newSchedule) => {
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = parseTime(newSchedule.startTime);
    const newEnd = parseTime(newSchedule.endTime);

    return existingSchedules.some(schedule => 
      schedule.room === newSchedule.room &&
      newSchedule.days.includes(schedule.day) &&
      !(newEnd <= parseTime(schedule.startTime) || newStart >= parseTime(schedule.endTime))
    );
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const baseSchedule = {
        doctorId: values.doctorId,
        room: values.room,
        startTime: values.timeRange[0].format('HH:mm'),
        endTime: values.timeRange[1].format('HH:mm'),
      };
  
      if (checkConflict({ ...baseSchedule, days: values.days })) {
        message.error('Time conflict detected. Please choose different times, room, or days.');
      } else {
        // Create a schedule for each selected day with a unique ID
        const newSchedules = values.days.map(day => ({
          ...baseSchedule,
          day,
          id: Date.now() + Math.floor(Math.random() * 1000), // Generate a unique ID for each day
        }));
  
        // Ensure `onAddSchedule` handles an array of schedules
        onAddSchedule(newSchedules)
          .then(() => {
            message.success(`Schedules added successfully for ${values.days.join(', ')}`);
            form.resetFields();
  
            // Assuming `onAddSchedule` triggers the socket event from the server
            // So no additional socket emission is needed here.
          })
          .catch((error) => {
            console.error('Error adding schedules:', error);
            message.error('Failed to add some schedules. Please try again.');
          });
      }
    }).catch((errorInfo) => {
      console.error('Validation Failed:', errorInfo);
      message.error('Please fill out all required fields correctly.');
    });
  };
  
  
  

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  return (
    <Modal title={t('addSchedule')} visible={visible} onOk={handleOk} onCancel={onCancel}>
      <Form form={form} layout="vertical">
        <Form.Item 
          name="doctorId" 
          label={t('doctor')} 
          rules={[{ required: true, message: t('selectDoctor') }]}
        >
          <Select
            showSearch
            placeholder={t('selectDoctor')}
            optionFilterProp="children"
            filterOption={filterOption}
          >
            {doctors.map(doctor => (
              <Option key={doctor.id} value={doctor.id} label={`${doctor.name} (${doctor.speciality})`}>
                {doctor.name} ({doctor.speciality})
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="room" label={t('room')} rules={[{ required: true }]} >
          <Select placeholder={t('selectRooms')}>
            {[...Array(17)].map((_, i) => (
              <Option key={i + 1} value={`Room ${i + 1}`}>
                {t('room')} {i + 1}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item 
          name="days" 
          label={t('days')} 
          rules={[{ required: true, message: t('selectDays') }]}
        >
          <Select mode="multiple" placeholder={t('selectDays')}>
            {daysOfWeek.map(day => (
              <Option key={day} value={day}>
                {t(day.toLowerCase())}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="timeRange" label={t('timeRange')} rules={[{ required: true, message: t('pleaseSelectTimeRange') }]}>
            <TimePicker.RangePicker 
              format="HH:mm" 
              placeholder={[t('startTime'), t('endTime')]}
            />
          </Form.Item>
        </Form>
    </Modal>
  );
};

export default AddScheduleModal;