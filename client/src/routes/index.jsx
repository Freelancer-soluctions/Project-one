import { lazy } from "react";
import PathConstants from "./pathConstants";

const Home = lazy(()=> import('@/modules/home/pages/Home'));
const Auth = lazy(()=> import('@/modules/auth/pages/Login'));
const Note = lazy(()=> import('@/modules/note/pages/Note'));


const routes = [
    { path: PathConstants.HOME, element: <Home/> },
    { path: PathConstants.AUTH, element: <Auth /> },
    { path: PathConstants.NOTE, element: <Note/> }

]


export default routes