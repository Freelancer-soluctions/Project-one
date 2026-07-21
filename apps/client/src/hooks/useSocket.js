import { io } from 'socket.io-client'
import { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { refreshTokenFecth, logout } from '@/modules/auth/slice/authSlice'

let socket = null

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isError, setIsError] = useState(false)
  const socketRef = useRef(null)
  const dispatch = useDispatch()

  // Leer token desde Redux store. El token se guarda en sessionStorage
  // durante signInFetch.fulfilled (ver authSlice.js línea 104).
  // state.auth.user.data.accessToken contiene el JWT actual.
  const token = useSelector((state) => state.auth.user?.data?.accessToken)
  const userId = useSelector((state) => state.auth.user?.data?.id)

  useEffect(() => {
    // Si no hay usuario autenticado, no conectar WebSocket
    if (!token) {
      return
    }

    // Singleton: solo crear socket si no existe
    if (!socket) {
      // Para WSS (producción), socket.io-client detecta automáticamente
      // la URL wss:// y usa transporte WebSocket con TLS.
      // transports: ['websocket', 'polling'] es el default para degradación graceful.
      socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3000', {
        auth: { token },  // Token se envía en handshake.auth — lo lee el middleware io.use()
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        // En producción detrás de NGINX, el path por defecto es /socket.io/
        // No se necesita especificar explícitamente
      })
    } else if (socket.auth.token !== token) {
      // Si el token cambió (refresh), actualizar antes de reconectar
      socket.auth.token = token
    }

    socketRef.current = socket

    const onConnect = () => {
      console.log('🟢 Socket conectado — usuario:', userId)
      setIsConnected(true)
      setIsError(false)
      // Unirse a la sala personal del usuario para recibir notificaciones
      if (userId) {
        socket.emit('room:join', { userId })
      }
    }

    const onDisconnect = (reason) => {
      console.log('🔴 Socket desconectado', reason)
      setIsConnected(false)
    }

    const onConnectError = async (err) => {
      console.log('⚠️ Error de conexión WS:', err.message)
      setIsError(true)

      // Si el error es UNAUTHORIZED, intentar refresh token
      if (err.message === 'UNAUTHORIZED') {
        try {
          // dispatch(refreshTokenFecth()) dispara createAsyncThunk que
          // llama a RefreshTokenApi() y actualiza state.user.data.accessToken
          const result = await dispatch(refreshTokenFecth()).unwrap()
          const newToken = result.data.accessToken

          // En Socket.IO v4, socket.auth es mutable solo ANTES de connect()
          // No durante conexión activa. Asignar nuevo token y reconectar.
          socket.auth.token = newToken

          // socket.connect() dispara reconexión con nuevo auth.token
          // El middleware io.use() en el servidor verifica el nuevo token
          socket.connect()
        } catch {
          // Si el refresh falla, cerrar sesión
          console.log('❌ Token refresh falló, cerrando sesión')
          dispatch(logout())
        }
      }
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)

      // Si el socket ya está conectado pero el estado local no lo refleja
      if (socket.connected && !isConnected) {
        setTimeout(() => setIsConnected(true), 0)
      }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
    }
  }, [token, userId, dispatch, isConnected])

  return { socket, isConnected, isError }
}