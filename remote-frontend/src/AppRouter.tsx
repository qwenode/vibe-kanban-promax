import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ReviewPage from "./pages/ReviewPage";
import AccountPage from "./pages/AccountPage";
import AccountCompletePage from "./pages/AccountCompletePage";
import NotFoundPage from "./pages/NotFoundPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/review/:id",
    element: <ReviewPage />,
  },
  {
    path: "/account",
    element: <AccountPage />,
  },
  {
    path: "/account/complete",
    element: <AccountCompletePage />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
