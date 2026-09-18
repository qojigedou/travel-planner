import { createBrowserRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { AppShell } from "./components/layout/AppShell";
import { useTheme } from "./lib/hooks";
import { NotFoundPage } from "./pages/NotFoundPage";
import { PlacesPage } from "./pages/PlacesPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import { TripsPage } from "./pages/TripsPage";
import { ActivatePage } from "./pages/auth/ActivatePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { index: true, element: <TripsPage /> },
      { path: "trips/:id", element: <TripDetailPage /> },
      { path: "places", element: <PlacesPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
  { path: "login", element: <LoginPage /> },
  { path: "register", element: <RegisterPage /> },
  { path: "activate", element: <ActivatePage /> },
]);

export function App() {
  const { theme } = useTheme();
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "var(--typeface-sans)",
            background: "var(--surface-raised)",
            color: "var(--fg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--round-lg)",
            boxShadow: "var(--shadow-md)",
          },
        }}
      />
    </>
  );
}
