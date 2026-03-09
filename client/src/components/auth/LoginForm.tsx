import React from 'react'
import { Form, Input, Button, Alert } from 'antd'
import { MailOutlined, LockOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../store'
import { login, clearError } from '../../store/authSlice'

/** Login form with email/password. On success, stores the JWT in memory and redirects to the role-appropriate dashboard.
 * @todo (scalability): i18n — extract form labels and validation messages to translation keys.
 * @todo (scalability): Add a new funtionality, so the user can change the password, or reinstated, forgot your password? as exmaple.
 */
const LoginForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector(state => state.auth)

  const onFinish = (values: { email: string; password: string }) => {
    if (error) dispatch(clearError())
    dispatch(login(values))
  }

  return (
    <Form name="login" onFinish={onFinish} size="large" layout="vertical">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => dispatch(clearError())}
          className="mb-16"
        />
      )}
      <Form.Item
        name="email"
        label="Email"
        rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" aria-label="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        label="Password"
        rules={[{ required: true, message: 'Please enter your password' }]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" aria-label="Password" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Log In
        </Button>
      </Form.Item>
    </Form>
  )
}

export default LoginForm
