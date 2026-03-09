import React from 'react'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '../helpers/renderWithProviders'
import NotFoundPage from '../../src/pages/NotFoundPage'

describe('NotFoundPage', () => {
  it('should render the 404 title and message', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('The page you visited does not exist.')).toBeInTheDocument()
  })

  it('should render the Go Back button', () => {
    renderWithProviders(<NotFoundPage />)
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
  })
})
