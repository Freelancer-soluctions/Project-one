// import store from '../../redux/store'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { getUserFromToken } from '../../utils/jwt-decode';
export const ProtectedRoutes = ({ children, redirectTo }) => {
  // Accediendo al estado de autenticación
  const user = useSelector(state => state.auth)
  // const user = store.getState()?.auth?.user

  //Acceder a ala informacion del token
  const userToken = getUserFromToken();
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
    if (user.user === null && !user.isAuth && (parseInt(user.user.data.user.id) !== parseInt(userToken.id))) {
      navigate(redirectTo, { replace: true })
    }
  }, [navigate, user])

  // if (user === null) {
  //   // Mientras se está rehidratando el estado o el usuario es null, no renderizamos el contenido.
  //   return null // O un componente de carga si prefieres
  // }

  return children
}


