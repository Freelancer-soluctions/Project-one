// import store from '../../redux/store'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
const ProtectedRoutes = ({ children, redirectTo }) => {
  // Accediendo al estado de autenticación
  const user = useSelector(state => state.auth)
  // const user = store.getState()?.auth?.user
  const navigate = useNavigate()
  // useEffect(() => {
  //   if (user !== null) {
  //     console.log(
  //       'user in sessionStorage:',
  //       sessionStorage.getItem('persist:auth')
  //     )
  //   }
  // }, [])

  useEffect(() => {
    if (user === null && !user.isAuth) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, user])

  // if (user === null) {
  //   // Mientras se está rehidratando el estado o el usuario es null, no renderizamos el contenido.
  //   return null // O un componente de carga si prefieres
  // }

  return children
}

export default ProtectedRoutes
