import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Result } from 'antd'

/** 404 page with navigation link back to home. */
const NotFoundPage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Result
      status="404"
      title="404"
      subTitle="The page you visited does not exist."
      extra={
        <Button type="primary" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      }
    />
  )
}

export default NotFoundPage
