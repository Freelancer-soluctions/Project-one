import { lazy } from "react";
import Layout from "./components/layout";
// import Home from "./modules/home/pages/Home";

import NotFound from "./components/404/NotFound";
import routes from "./routes";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
const App = () => {
  const router = createBrowserRouter([
 
    {
      path: "/",
      element: <Layout />,
      children: [
        {
          path: "/signIn",
          Component: lazy(() => import("@/modules/auth/pages/SignIn")),
        },
        {
          path: "/signUp",
          Component: lazy(() => import("@/modules/auth/pages/SignUp")),
        },
        {
          path: "/home",
          element: lazy(() => import("@/modules/home/pages/Home")),
          children: routes,
        },
      ],

      // errorElement:  <NotFound />, // vere diferencia con /*
    },
    {
      path: "/*",
      element: <NotFound />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
