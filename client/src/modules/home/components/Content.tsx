import Spinner from "@/components/loader/Spinner"
import { Suspense } from "react"
import { Outlet } from "react-router-dom"

export const Content = () => {
  return (
    <main className='flex flex-col flex-1'>
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </main>
  )
}

export default Content
