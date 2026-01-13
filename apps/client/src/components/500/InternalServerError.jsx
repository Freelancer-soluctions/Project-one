import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router';
import { TbLoader2 } from 'react-icons/tb';
import { AiOutlineHome } from 'react-icons/ai';
const InternalServerError = ({ error, resetErrorBoundary }) => {
  // const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-3xl">
        <div className="p-8 bg-white rounded-lg shadow-lg">
          {/* Sección Superior - Ilustración y Título */}
          <div className="mb-8 text-center">
            <div className="relative w-48 h-48 mx-auto mb-4">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-pulse" />
              <img
                src="/placeholder.svg?height=200&width=200"
                alt="Error Illustration"
                className="relative z-10"
              />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">
              ¡Ups! Algo salió mal
            </h1>
            <p className="max-w-xl mx-auto text-lg text-muted-foreground">
              {error.message ||
                'Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado y estamos trabajando en solucionarlo.'}
            </p>
          </div>

          {/* Sección de Detalles del Error */}
          <div className="p-4 mb-8 rounded-lg bg-gray-50">
            <h2 className="mb-2 text-sm font-semibold text-gray-700">
              Detalles técnicos:
            </h2>
            <code className="block p-3 overflow-auto font-mono text-sm text-gray-700 bg-gray-100 rounded">
              {error?.stack || 'No hay detalles adicionales disponibles'}
            </code>
          </div>

          {/* Sección de Acciones */}
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              onClick={resetErrorBoundary}
              className="flex items-center gap-2"
            >
              <AiOutlineHome className="w-4 h-4" />
              Volver al inicio
            </Button>
            {/* <Link to='/home'> */}
            {/* <Button
              className='flex items-center w-full gap-2 sm:w-auto'
              onClick={() => navigate('/home')}
              variant='outline'>
              <AiOutlineHome className='w-4 h-4' />
              Volver al inicio
            </Button> */}
            {/* </Link> */}
          </div>
        </div>

        {/* Footer con Información Adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Si el problema persiste, por favor contacta con nuestro equipo de
            soporte
            {/* <Link href='/soporte' className='text-primary hover:underline'>
              equipo de soporte
            </Link> */}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternalServerError;
