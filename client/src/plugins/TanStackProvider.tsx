import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


interface TanStackProviderProps {
  children: React.ReactNode
}
// Create a client
const queryClient = new QueryClient()

export const TanStackProvider = ({ children }:TanStackProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}

      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
