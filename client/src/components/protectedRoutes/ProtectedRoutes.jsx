import store from '../../redux/store'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
const ProtectedRoutes = ({ children, redirectTo }) => {
  const user = store.getState()?.auth?.user
  const navigate = useNavigate()

  useEffect(() => {
    if (user === null) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, user])

  return children
}

export default ProtectedRoutes
