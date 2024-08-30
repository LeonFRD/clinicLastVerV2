import React from 'react';
import { Modal, Form, TimePicker, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const EditScheduleModal = ({ visible, onCancel, onEditSchedule, schedule, existingSchedules }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();

  const checkConflict = (newStart, newEnd) => {
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStartMinutes = parseTime(newStart);
    const newEndMinutes = parseTime(newEnd);

    return existingSchedules.some(existingSchedule => {
      if (existingSchedule.id === schedule.id) return false; // Skip the current schedule being edited
      if (existingSchedule.day !== schedule.day || existingSchedule.room !== schedule.room) return false;

      const existingStartMinutes = parseTime(existingSchedule.startTime);
      const existingEndMinutes = parseTime(existingSchedule.endTime);

      return (newStartMinutes < existingEndMinutes && newEndMinutes > existingStartMinutes);
    });
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newStartTime = values.timeRange[0].format('HH:mm');
      const newEndTime = values.timeRange[1].format('HH:mm');

      if (checkConflict(newStartTime, newEndTime)) {
        message.error(t('timeConflictError'));
        return;
      }

      const updatedSchedule = {
        ...schedule,
        startTime: newStartTime,
        endTime: newEndTime,
      };
      onEditSchedule(updatedSchedule);
      form.resetFields();
    }).catch((info) => {
      console.log('Validate Failed:', info);
    });
  };

  React.useEffect(() => {
    if (schedule) {
      form.setFieldsValue({
        timeRange: [
          dayjs(schedule.startTime, 'HH:mm'),
          dayjs(schedule.endTime, 'HH:mm')
        ]
      });
    }
  }, [schedule, form]);

  return (
    <Modal
      visible={visible}
      title={t('editSchedule')}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          {t('cancel')}
        </Button>,
        <Button key="submit" type="primary" onClick={handleOk}>
          {t('save')}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="timeRange"
          label={t('timeRange')}
          rules={[{ required: true, message: t('pleaseSelectTimeRange') }]}
        >
          <TimePicker.RangePicker format="HH:mm" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditScheduleModal;