import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './AuthForm.css'
import { User } from '../types'

function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (!token || !userData) {
      navigate('/login')
      return
    }

    try {
      setUser(JSON.parse(userData) as User)
    } catch (err) {
      console.error('Error parsing user data:', err)
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Dashboard</h1>
        <p className="auth-subtitle">Welcome, {user.name}!</p>

        <div style={{ marginTop: '2rem' }}>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>

        <button 
          onClick={handleLogout} 
          className="auth-button"
          style={{ marginTop: '2rem', backgroundColor: '#dc3545' }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default Dashboard

