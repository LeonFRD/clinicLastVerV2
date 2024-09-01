import React, { useEffect, useState } from 'react';
import { Modal, Form, TimePicker, Button, message, Timeline } from 'antd';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

const EditScheduleModal = ({ visible, onCancel, onEditSchedule, schedule, existingSchedules }) => {
  const [form] = Form.useForm();
  const { t } = useTranslation();
  const [disabledTimes, setDisabledTimes] = useState([]);

  useEffect(() => {
    if (schedule) {
      form.setFieldsValue({
        timeRange: [
          dayjs(schedule.startTime, 'HH:mm'),
          dayjs(schedule.endTime, 'HH:mm')
        ]
      });
      updateDisabledTimes();
    }
  }, [schedule, form, existingSchedules]);

  const updateDisabledTimes = () => {
    const conflictingTimes = existingSchedules
      .filter(existingSchedule => 
        existingSchedule.id !== schedule.id && 
        existingSchedule.day === schedule.day && 
        existingSchedule.room === schedule.room
      )
      .map(conflictingSchedule => ({
        start: dayjs(conflictingSchedule.startTime, 'HH:mm'),
        end: dayjs(conflictingSchedule.endTime, 'HH:mm')
      }));

    setDisabledTimes(conflictingTimes);
  };

  const disabledTime = (current, type) => {
    return {
      disabledHours: () => [],
      disabledMinutes: (selectedHour) => {
        const minutes = [];
        disabledTimes.forEach(({ start, end }) => {
          if (type === 'start') {
            if (selectedHour === start.hour() && selectedHour === end.hour()) {
              for (let i = start.minute(); i < end.minute(); i++) {
                minutes.push(i);
              }
            } else if (selectedHour === start.hour()) {
              for (let i = start.minute(); i < 60; i++) {
                minutes.push(i);
              }
            } else if (selectedHour > start.hour() && selectedHour < end.hour()) {
              for (let i = 0; i < 60; i++) {
                minutes.push(i);
              }
            }
          } else if (type === 'end') {
            if (selectedHour === start.hour() && selectedHour === end.hour()) {
              for (let i = start.minute() + 1; i <= end.minute(); i++) {
                minutes.push(i);
              }
            } else if (selectedHour === end.hour()) {
              for (let i = 0; i <= end.minute(); i++) {
                minutes.push(i);
              }
            } else if (selectedHour > start.hour() && selectedHour < end.hour()) {
              for (let i = 0; i < 60; i++) {
                minutes.push(i);
              }
            }
          }
        });
        return minutes;
      },
    };
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newStartTime = values.timeRange[0].format('HH:mm');
      const newEndTime = values.timeRange[1].format('HH:mm');

      // Check for conflicts
      const hasConflict = disabledTimes.some(({ start, end }) => {
        const newStart = dayjs(newStartTime, 'HH:mm');
        const newEnd = dayjs(newEndTime, 'HH:mm');
        return (newStart.isBefore(end) && newEnd.isAfter(start) && !newEnd.isSame(start) && !newStart.isSame(end));
      });

      if (hasConflict) {
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
          <TimePicker.RangePicker 
            format="HH:mm"
            disabledTime={disabledTime}
            minuteStep={5}
            hideDisabledOptions={true}
            allowClear={false}
          />
        </Form.Item>
      </Form>
      <div style={{ marginTop: '20px' }}>
        <h4>{t('scheduledTimes')}:</h4>
        <Timeline>
          {disabledTimes.map((time, index) => (
            <Timeline.Item key={index} color="red">
              {time.start.format('HH:mm')} - {time.end.format('HH:mm')}
            </Timeline.Item>
          ))}
        </Timeline>
      </div>
    </Modal>
  );
};

export default EditScheduleModal;