import React from 'react';
import { Form, Input, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

const LoginPage = ({ onLogin }) => {
  const { t } = useTranslation();

  const onFinish = async (values) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      onLogin(values.username, values.password);
    } catch (error) {
      message.error(t('loginFailed'));
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: '100px auto' }}>
      <h2>{t('login')}</h2>
      <Form onFinish={onFinish}>
        <Form.Item
          name="username"
          rules={[{ required: true, message: t('pleaseInputUsername') }]}
        >
          <Input placeholder={t('username')} />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: t('pleaseInputPassword') }]}
        >
          <Input.Password placeholder={t('password')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            {t('login')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginPage;