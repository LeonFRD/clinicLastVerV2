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
    if (type === 'start') {
      return {
        disabledHours: () => getDisabledHours(current, 'start'),
        disabledMinutes: (selectedHour) => getDisabledMinutes(current, selectedHour, 'start'),
      };
    }
    return {
      disabledHours: () => getDisabledHours(current, 'end'),
      disabledMinutes: (selectedHour) => getDisabledMinutes(current, selectedHour, 'end'),
    };
  };

  const getDisabledHours = (current, type) => {
    const hours = [];
    disabledTimes.forEach(({ start, end }) => {
      if (type === 'start') {
        for (let i = start.hour(); i <= end.hour(); i++) {
          if (!hours.includes(i)) hours.push(i);
        }
      } else {
        for (let i = start.hour(); i < end.hour(); i++) {
          if (!hours.includes(i)) hours.push(i);
        }
      }
    });
    return hours;
  };

  const getDisabledMinutes = (current, selectedHour, type) => {
    const minutes = [];
    disabledTimes.forEach(({ start, end }) => {
      if (start.hour() === selectedHour) {
        for (let i = start.minute(); i < 60; i++) {
          if (!minutes.includes(i)) minutes.push(i);
        }
      } else if (end.hour() === selectedHour) {
        for (let i = 0; i < end.minute(); i++) {
          if (!minutes.includes(i)) minutes.push(i);
        }
      } else if (start.hour() < selectedHour && end.hour() > selectedHour) {
        for (let i = 0; i < 60; i++) {
          if (!minutes.includes(i)) minutes.push(i);
        }
      }
    });
    return minutes;
  };

  const handleOk = () => {
    form.validateFields().then((values) => {
      const newStartTime = values.timeRange[0].format('HH:mm');
      const newEndTime = values.timeRange[1].format('HH:mm');

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