import store from '../../redux/store'
import { useNavigate } from 'react-router-dom'
import React, { useEffect } from 'react'

interface PropsProtectedRoutes{
  children: React.ReactNode;
  redirectTo: string;
};

const ProtectedRoutes = ({ children, redirectTo }:PropsProtectedRoutes) => {
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
