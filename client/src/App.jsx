import Layout from "./components/layout";
import routes from "./routes";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
const App = () => {

    const router = createBrowserRouter([

        {
            element: <Layout />,
            children: routes
        }

    ])

    return <RouterProvider router={ router } />;

}

export default App;