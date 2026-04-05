import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('updates the dashboard when the target toggle changes', () => {
    render(<App />)

    expect(screen.getByText(/20 day target/i)).toHaveClass('active')
    fireEvent.click(screen.getByText(/24 day target/i))

    expect(screen.getByText(/24 day target/i)).toHaveClass('active')
  })

  it('logs an office day through quick add and updates the recent list', () => {
    render(<App />)

    fireEvent.click(screen.getByText(/Mark in office/i))

    expect(screen.queryByText(/No badge days logged yet./i)).not.toBeInTheDocument()
  })

  it('shows the sample data and renders week status labels', () => {
    render(<App />)

    fireEvent.click(screen.getAllByText(/Load sample pattern/i)[0])

    expect(screen.getAllByText(/no-value|locked|maintain|sprint/i).length).toBeGreaterThan(0)
  })
})
