
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetails from "./pages/ClientDetails";
import Documents from "./pages/Documents";
import Tasks from "./pages/Tasks";
import NewTask from "./pages/NewTask";
import TeamMembers from "./pages/TeamMembers";
import ClientPortal from "./pages/ClientPortal";
import Requests from "./pages/Requests";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import ProtectedRoute from "./components/ProtectedRoute";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
  path="/portal"
  element={
    <ProtectedRoute allowedRoles={["client"]}>
      <ClientPortal />
    </ProtectedRoute>
  }
/>
        <Route
  path="/team-members"
  element={
    <ProtectedRoute>
      <TeamMembers />
    </ProtectedRoute>
  }
/>

        <Route
          path="/clients"
          element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute>
              <ClientDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Documents />
            </ProtectedRoute>
          }
        />
        <Route
  path="/tasks"
  element={
    <ProtectedRoute>
      <Tasks />
    </ProtectedRoute>
  }
/>

        <Route
  path="/tasks/new"
  element={
    <ProtectedRoute>
      <NewTask />
    </ProtectedRoute>
  }
/>
<Route
  path="/requests"
  element={
    <ProtectedRoute>
      <Requests />
    </ProtectedRoute>
  }
/>
<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <Settings />
    </ProtectedRoute>
  }
/>
<Route
  path="/subscription"
  element={
    <ProtectedRoute>
      <Subscription />
    </ProtectedRoute>
  }
/>
      </Routes>
    </BrowserRouter>
  );
}
