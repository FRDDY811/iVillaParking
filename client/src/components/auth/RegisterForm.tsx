import React, { useState } from 'react'
import { Form, Input, Button, Alert, Result } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, HomeOutlined } from '@ant-design/icons'
import { useAppDispatch, useAppSelector } from '../../store'
import { register, clearError } from '../../store/authSlice'
import { MAX_APARTMENT_LENGTH, MIN_PASSWORD_LENGTH } from '../../utils/constants'

/** Registration form for new residents.
 * Creates a PENDING account that requires admin approval before login is permitted.
 **/
const RegisterForm: React.FC = () => {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector(state => state.auth)
  const [registered, setRegistered] = useState(false)

  const onFinish = async (values: {
    email: string
    password: string
    firstName: string
    lastName: string
    apartment: string
  }) => {
    if (error) dispatch(clearError())
    const result = await dispatch(register(values))
    if (register.fulfilled.match(result)) {
      setRegistered(true)
    }
  }

  if (registered) {
    return (
      <Result
        status="success"
        title="Registration Successful!"
        subTitle="Please wait for admin approval before logging in."
      />
    )
  }

  return (
    <Form name="register" onFinish={onFinish} size="large" layout="vertical">
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
        name="firstName"
        label="First Name"
        rules={[{ required: true, message: 'First name is required' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="First Name" aria-label="First Name" />
      </Form.Item>
      <Form.Item
        name="lastName"
        label="Last Name"
        rules={[{ required: true, message: 'Last name is required' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Last Name" aria-label="Last Name" />
      </Form.Item>
      <Form.Item
        name="apartment"
        label="Apartment"
        rules={[
          { required: true, message: 'Apartment is required' },
          {
            max: MAX_APARTMENT_LENGTH,
            message: `Apartment must be ${MAX_APARTMENT_LENGTH} characters or less`
          }
        ]}
      >
        <Input
          prefix={<HomeOutlined />}
          placeholder="Apartment (e.g., 4B)"
          maxLength={MAX_APARTMENT_LENGTH}
          aria-label="Apartment"
        />
      </Form.Item>
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
        rules={[
          { required: true, message: 'Password is required' },
          {
            min: MIN_PASSWORD_LENGTH,
            message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
          },
          {
            pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
            message:
              'Must include uppercase, lowercase, a number, and a special character (@$!%*?&)'
          }
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder="Password" aria-label="Password" />
      </Form.Item>
      <Form.Item
        name="confirmPassword"
        label="Confirm Password"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Please confirm your password' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              return !value || getFieldValue('password') === value
                ? Promise.resolve()
                : Promise.reject(new Error('Passwords do not match'))
            }
          })
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="Confirm Password"
          aria-label="Confirm Password"
        />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Register
        </Button>
      </Form.Item>
    </Form>
  )
}

export default RegisterForm
