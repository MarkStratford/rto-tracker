import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('renders the compact tracker header and progress view', () => {
    render(<App />)

    expect(screen.getByText(/RTO Tracker/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Forecast/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Weekly breakdown/i)).toBeInTheDocument()
  })

  it('updates the target pill selection', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /0\/20 days/i }))

    expect(screen.getByRole('button', { name: /0\/20 days/i })).toHaveClass('active')
  })

  it('toggles a day directly from the month calendar', () => {
    render(<App />)

    fireEvent.click(screen.getAllByRole('button', { pressed: false })[0])

    expect(screen.getAllByRole('button', { pressed: true }).length).toBeGreaterThan(0)
  })

  it('loads demo data into the compact tracker', () => {
    render(<App />)

    fireEvent.click(screen.getByText(/Load demo/i))

    expect(screen.getByText(/26\/24 days/i)).toBeInTheDocument()
  })
})
