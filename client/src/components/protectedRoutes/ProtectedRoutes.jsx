import store from '../../redux/store'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
const ProtectedRoutes = ({ children }) => {
  const user = store.getState()?.auth?.user
  const navigate = useNavigate()
  console.log('route state', user)
  debugger
  useEffect(() => {
    if (user === null) {
      navigate('/signIn', { replace: true })
    }
  }, [navigate, user])

  return children
}

export default ProtectedRoutes
