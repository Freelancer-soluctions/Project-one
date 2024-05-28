import { lazy } from "react";
import PathConstants from "./pathConstants";

const Home = lazy(()=> import('@/modules/home/pages/Home'));
const Auth = lazy(()=> import('@/modules/auth/pages/Login'));
const Note = lazy(()=> import('@/modules/note/pages/Note'));


const routes = [
    { index: true, element: <Home/> },
    { path: PathConstants.AUTH, element: <Auth /> },
    { path: PathConstants.NOTE, element: <Note/> }
//     lazy(() => import("./Admin/Users/EditUser")
    ]


export default routes