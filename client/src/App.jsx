import Layout from "./components/layout";
import Login from "./modules/auth/pages/Login";
import NotFound from "./components/404/NotFound";
import routes from "./routes";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
const App = () => {

    const router = createBrowserRouter([

            // element: <LandingPage />, para mas adelante
        // {
        //     element: <Login />,
        //     children: routes
        // }
        
          {
            
            element: <Login />,
            children:[
                {
                

                    element: <Layout />,
                    children: routes
                }
              
            ]
           
        },
        {
            path: "/*",
            element: <NotFound />,
          },

    ])

    return <RouterProvider router={ router } />;

}

export default App;