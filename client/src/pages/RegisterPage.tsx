import React from 'react'
import { Card, Typography } from 'antd'
import { Link } from 'react-router-dom'
import RegisterForm from '../components/auth/RegisterForm'
import { ROUTES } from '../utils/routes'

const { Title, Text } = Typography

const registerCardStyle = { width: 450 }

/** Registration page. Centers the RegisterForm in a card with a link back to login. */
const RegisterPage: React.FC = () => {
  return (
    <div className="auth-page">
      <Card style={registerCardStyle}>
        <Title level={2} className="text-center">
          Register
        </Title>
        <RegisterForm />
        <div className="text-center mt-16">
          <Text>
            Already have an account? <Link to={ROUTES.LOGIN}>Log in</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage
