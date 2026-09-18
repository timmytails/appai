import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { rememberReturnTo } from '../../utils/authRouting'

export default function BookButton({ children = 'Online booking', serviceId, className = '', onBeforeNavigate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const book = () => {
    onBeforeNavigate?.()
    const returnTo = serviceId ? `/booking?service=${encodeURIComponent(serviceId)}` : '/booking'
    if (user?.profileCompleted) return navigate(returnTo)
    rememberReturnTo(returnTo)
    if (user) return navigate('/complete-profile')
    navigate('/login', { state: { returnTo, reason: 'booking-required' } })
  }
  return <button type='button' className={`editorial-button ${className}`} onClick={book}>{children}</button>
}
