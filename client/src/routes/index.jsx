 import { lazy } from "react";
import PathConstants from "./pathConstants";

const Access = lazy(()=> import('@/modules/access/pages/Access'));
const Note = lazy(() => import("@/modules/note/pages/Note"));

const routes = [

  { index: true, element: <Access/>},
  { path: PathConstants.NOTE, element: <Note /> },

];

export default routes;
