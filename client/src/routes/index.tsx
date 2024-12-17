/* eslint-disable react-refresh/only-export-components */
import { lazy } from 'react'
import PathConstants from './pathConstants'

const Access = lazy(() => import('@/modules/access/pages/Access'))
const Note = lazy(() => import('@/modules/note/pages/Note'))
const News = lazy(() => import('@/modules/news/pages/News'))

const homeChildrenRoutes = [
  { index: true, element: <Access /> },
  { path: PathConstants.NOTE, element: <Note /> },
  { path: PathConstants.NEWS, element: <News /> }
]

export default homeChildrenRoutes
