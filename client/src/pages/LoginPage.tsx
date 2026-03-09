import React from 'react'
import { Card, Typography } from 'antd'
import { Link } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import { ROUTES } from '../utils/routes'

const { Title, Text } = Typography

const loginCardStyle = { width: 400 }

/** Login page. Centers the LoginForm in a card with a link to registration. */
const LoginPage: React.FC = () => {
  return (
    <div className="auth-page">
      <Card style={loginCardStyle}>
        <Title level={2} className="text-center">
          iVillaParking
        </Title>
        <LoginForm />
        <div className="text-center mt-16">
          <Text>
            Don&apos;t have an account? <Link to={ROUTES.REGISTER}>Register here</Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default LoginPage
