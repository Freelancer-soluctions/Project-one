// import store from '../../redux/store'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
const ProtectedRoutes = ({ children, redirectTo }) => {
  // Accediendo al estado de autenticación
  const user = useSelector(state => state.auth.user)
  // const user = store.getState()?.auth?.user
  const navigate = useNavigate()

  useEffect(() => {
    if (user === null) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, user])

  return children
}

export default ProtectedRoutes
