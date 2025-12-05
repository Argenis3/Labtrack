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

// NUEVAS PÁGINAS DE MATERIALES
import { AdminMaterials } from "./pages/AdminMaterials";
import { MaterialsPage } from "./pages/MaterialsPage";

// PÁGINAS DE SOLICITUDES
import { MyRequests } from "./pages/MyRequests";
import { AdminRequests } from "./pages/AdminRequests";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Redirección raíz */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ========================================
              RUTAS PÚBLICAS
          ======================================== */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ========================================
              DASHBOARD (PROTEGIDO)
          ======================================== */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ========================================
              CATÁLOGO DE MATERIALES (USUARIOS)
          ======================================== */}
          
          {/* Ver catálogo completo - PARA TODOS LOS USUARIOS */}
          <Route
            path="/materials"
            element={
              <ProtectedRoute>
                <MaterialsPage />
              </ProtectedRoute>
            }
          />

          {/* Detalle de material específico */}
          {/* <Route
            path="/materials/:id"
            element={
              <ProtectedRoute>
                <MaterialDetail />
              </ProtectedRoute>
            }
          /> */}

          {/* Nueva solicitud de préstamo */}
          {/* <Route
            path="/request/new/:id"
            element={
              <ProtectedRoute>
                <NewRequest />
              </ProtectedRoute>
            }
          /> */}

          {/* Mis solicitudes */}
          <Route
            path="/my-requests"
            element={
              <ProtectedRoute>
                <MyRequests />
              </ProtectedRoute>
            }
          />

          {/* ========================================
              ZONA ADMINISTRATIVA
          ======================================== */}
          
          {/* Panel principal de admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Gestión de usuarios */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          {/* GESTIÓN DE MATERIALES (ADMIN) - NUEVO */}
          <Route
            path="/admin/materials"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminMaterials />
              </ProtectedRoute>
            }
          />

          {/* Gestión de solicitudes */}
          <Route
            path="/admin/requests"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminRequests />
              </ProtectedRoute>
            }
          />

          {/* Inventario general */}
          {/* <Route
            path="/inventory"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Inventory />
              </ProtectedRoute>
            }
          /> */}

          {/* ========================================
              CATCH-ALL (404)
          ======================================== */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;