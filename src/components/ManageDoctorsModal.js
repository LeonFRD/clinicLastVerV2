import React, { useState } from 'react';
import { Modal, Form, Input, Button, Table, Space, message, ConfigProvider } from 'antd';
import { EditOutlined, DeleteOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const ManageDoctorsModal = ({ visible, onCancel, onAddDoctor, onUpdateDoctor, onDeleteDoctor, doctors }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();
  const [editingKey, setEditingKey] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = (record) => record.id === editingKey;

  const edit = (record) => {
    form.setFieldsValue({ name: '', speciality: '', ...record });
    setEditingKey(record.id);
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (id) => {
    try {
      const row = await form.validateFields();
      await onUpdateDoctor({ id, ...row });
      setEditingKey('');
      message.success(t('doctorUpdatedSuccess'));
    } catch (error) {
      console.error('Error saving doctor:', error);
      message.error(t('doctorUpdateFailed'));
    }
  };

  const handleDelete = async (doctorId) => {
    try {
      await onDeleteDoctor(doctorId);
      // Assuming onDeleteDoctor handles the server request and throws an error if deletion fails
    } catch (error) {
      if (error.message === 'This doctor has schedules assigned and cannot be deleted.') {
        message.warning('This doctor has schedules assigned and cannot be deleted.');
      } else {
        console.error('Error deleting doctor:', error);
        message.error('Failed to delete doctor. Please try again.');
      }
    }
  };
  

  const handleAddDoctor = async () => {
    try {
      setLoading(true);
      const values = await addForm.validateFields();
      await onAddDoctor(values);
      addForm.resetFields();
      message.success(t('doctorAddedSuccess'));
    } catch (error) {
      console.error('Error adding doctor:', error);
      message.error(t('doctorAddFailed'));
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: t('name'),
      dataIndex: 'name',
      key: 'name',
      editable: true,
    },
    {
      title: t('speciality'),
      dataIndex: 'speciality',
      key: 'speciality',
      editable: true,
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button icon={<SaveOutlined />} onClick={() => save(record.id)} style={{ marginRight: 8 }} />
            <Button icon={<CloseOutlined />} onClick={cancel} />
          </Space>
        ) : (
          <Space>
            <Button disabled={editingKey !== ''} icon={<EditOutlined />} onClick={() => edit(record)} />
            <Button disabled={editingKey !== ''} icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record) => ({
        record,
        inputType: 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
  }) => {
    return (
      <td {...restProps}>
        {editing ? (
          <Form.Item
            name={dataIndex}
            style={{ margin: 0 }}
            rules={[
              {
                required: true,
                message: t('pleaseInput', { field: title }),
              },
            ]}
          >
            <Input />
          </Form.Item>
        ) : (
          children
        )}
      </td>
    );
  };

  return (
    <ConfigProvider direction={isRTL ? 'rtl' : 'ltr'}>
      <Modal 
        title={t('manageDoctors')} 
        visible={visible} 
        onCancel={onCancel}
        footer={null}
        width={800}
      >
        <Form form={addForm} layout="inline" onFinish={handleAddDoctor} style={{ marginBottom: 16 }}>
          <Form.Item name="name" rules={[{ required: true, message: t('pleaseInputDoctorName') }]}>
            <Input placeholder={t('doctorNamePlaceholder')} />
          </Form.Item>
          <Form.Item name="speciality" rules={[{ required: true, message: t('pleaseInputDoctorSpeciality') }]}>
            <Input placeholder={t('specialityPlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('addDoctor')}
            </Button>
          </Form.Item>
        </Form>
        <Form form={form} component={false}>
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            bordered
            dataSource={doctors}
            columns={mergedColumns}
            rowClassName="editable-row"
            pagination={false}
          />
        </Form>
      </Modal>
    </ConfigProvider>
  );
};

export default ManageDoctorsModal;