import "./App.css";
import "./index.css";

import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// COMPONENTES
import { Login } from "./components/Login";
import Register from "./components/Register";
import { ProtectedRoute } from "./components/ProtectedRoute";

// PAGES
import { Dashboard } from "./pages/Dashboard";
import { AdminPanel } from "./pages/AdminPanel";
import { AdminUsers } from "./pages/AdminUsers";
import Materials from "./pages/Materials";
import MaterialDetail from "./pages/MaterialDetail";
import NewRequest from "./pages/NewRequest";
import MyRequests from "./pages/MyRequests";
import AdminRequests from "./pages/AdminRequests";
import Inventory from "./pages/Inventory";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Redirección raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Rutas protegidas GENERALES */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* CATÁLOGO Y SOLICITUDES */}
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <Materials />
              </ProtectedRoute>
            }
          />

          <Route
            path="/materials/:id"
            element={
              <ProtectedRoute>
                <MaterialDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/request/new/:id"
            element={
              <ProtectedRoute>
                <NewRequest />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* INVENTARIO GENERAL */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Inventory />
              </ProtectedRoute>
            }
          />

          {/* ZONA ADMIN */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
