import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy
} from "firebase/firestore";

import { db } from "../config/firebase";
import { useAuthContext } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";

import {
  Package,
  Clock,
  CheckCircle,
  Users as UsersIcon,
  AlertTriangle,
  TrendingUp,
  Box,
  Layers,
} from "lucide-react";

// --- COMPONENTE PRINCIPAL ---
export const Dashboard = () => {
  const { user, userRole } = useAuthContext();
  const navigate = useNavigate();
  const isAdmin = userRole === "admin";

  const [stats, setStats] = useState({
    totalRequests: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    active: 0,
    totalMaterials: 0,
    totalUsers: 0,
    lowStockMaterials: 0,
    availableMaterials: 0
  });

  const [recentRequests, setRecentRequests] = useState([]);
  const [activeMaterials, setActiveMaterials] = useState([]);
  const [lowStockMaterials, setLowStockMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) fetchAdminData();
    else fetchStudentData();
  }, [user, isAdmin]);

  /* ===============================
      DATOS DE ALUMNO
  ================================ */
  const fetchStudentData = async () => {
    if (!user) return;

    try {
      // Obtener solicitudes del usuario - CAMPOS CORREGIDOS
      const q = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),  // ✅ CORREGIDO: era "usuarioId"
        orderBy("requestDate", "desc")     // ✅ CORREGIDO: era "fechaSolicitud"
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("📊 Solicitudes del usuario:", requests);

      // Obtener total de materiales disponibles
      const materialsSnap = await getDocs(collection(db, "materials"));
      const materials = materialsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const availableMaterials = materials.filter(m => m.status === "available" && m.quantity > 0).length;

      setActiveMaterials(
        requests.filter(r => r.status === "approved")  // ✅ CORREGIDO: era "estado === entregado"
      );

      const stats = {
        totalRequests: requests.length,
        pending: requests.filter(r => r.status === "pending").length,      // ✅ CORREGIDO
        approved: requests.filter(r => r.status === "approved").length,    // ✅ CORREGIDO
        rejected: requests.filter(r => r.status === "rejected").length,    // ✅ CORREGIDO
        active: requests.filter(r => r.status === "approved").length,      // ✅ CORREGIDO
        availableMaterials
      };

      console.log("📈 Estadísticas calculadas:", stats);

      setStats(stats);
      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
      DATOS DE ADMINISTRADOR
  ================================ */
  const fetchAdminData = async () => {
    try {
      const materialsSnap = await getDocs(collection(db, "materials"));
      const usersSnap = await getDocs(collection(db, "users"));
      const requestsSnap = await getDocs(collection(db, "requests"));

      const materials = materialsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const requests = requestsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log("📊 Solicitudes totales (admin):", requests);

      // Materiales con bajo stock
      const lowStock = materials.filter(
        m => m.quantity < 5 && m.quantity > 0
      );

      // Materiales disponibles
      const availableMaterials = materials.filter(
        m => m.status === "available" && m.quantity > 0
      ).length;

      const stats = {
        totalMaterials: materials.length,
        totalUsers: usersSnap.size,
        pending: requests.filter(r => r.status === "pending").length,      // ✅ CORREGIDO
        approved: requests.filter(r => r.status === "approved").length,    // ✅ CORREGIDO
        rejected: requests.filter(r => r.status === "rejected").length,    // ✅ CORREGIDO
        active: requests.filter(r => r.status === "approved").length,      // ✅ CORREGIDO
        lowStockMaterials: lowStock.length,
        availableMaterials
      };

      const recentPending = requests
        .filter(r => r.status === "pending")  // ✅ CORREGIDO: era "estado"
        .sort((a, b) => {
          const da = a.requestDate?.toDate?.() || new Date(a.requestDate);  // ✅ CORREGIDO
          const db = b.requestDate?.toDate?.() || new Date(b.requestDate);  // ✅ CORREGIDO
          return db - da;
        })
        .slice(0, 5);

      console.log("📈 Estadísticas admin:", stats);

      setStats(stats);
      setRecentRequests(recentPending);
      setLowStockMaterials(lowStock.slice(0, 5));
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = timestamp => {
    if (!timestamp) return "N/A";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* ============================== */}
        {/*        ENCABEZADO */}
        {/* ============================== */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin
                ? "Panel Administrativo"
                : `Bienvenido, ${user?.displayName || "Usuario"}`}
            </h1>
            <p className="text-gray-500">
              {isAdmin ? "Gestión general del sistema" : "Tu actividad reciente"}
            </p>
          </div>

          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
            onClick={() => navigate(isAdmin ? "/admin/materials" : "/materials")}
          >
            {isAdmin ? "Gestionar Materiales" : "Ver Catálogo"}
          </button>
        </div>

        {/* ============================== */}
        {/*    ESTADÍSTICAS - ADMIN */}
        {/* ============================== */}

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard 
              label="Total Materiales" 
              value={stats.totalMaterials} 
              icon={<Box />} 
              color="purple"
              onClick={() => navigate("/admin/materials")} 
            />
            <StatCard 
              label="Materiales Disponibles" 
              value={stats.availableMaterials} 
              icon={<Package />} 
              color="green"
              onClick={() => navigate("/admin/materials")} 
            />
            <StatCard 
              label="Solicitudes Pendientes" 
              value={stats.pending} 
              icon={<Clock />}
              color="yellow" 
              onClick={() => navigate("/admin/requests")} 
            />
            <StatCard 
              label="Usuarios Totales" 
              value={stats.totalUsers} 
              icon={<UsersIcon />}
              color="blue" 
              onClick={() => navigate("/admin/users")} 
            />
          </div>
        )}

        {/* ============================== */}
        {/*    ESTADÍSTICAS - USUARIO */}
        {/* ============================== */}

        {!isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            <StatCard 
              label="Catálogo Disponible" 
              value={stats.availableMaterials} 
              icon={<Layers />}
              color="purple" 
              onClick={() => navigate("/materials")} 
            />
            <StatCard 
              label="Mis Solicitudes" 
              value={stats.totalRequests} 
              icon={<TrendingUp />}
              color="blue" 
              onClick={() => navigate("/my-requests")} 
            />
            <StatCard 
              label="Pendientes" 
              value={stats.pending} 
              icon={<Clock />}
              color="yellow" 
              onClick={() => navigate("/my-requests")} 
            />
            <StatCard 
              label="Activas" 
              value={stats.active} 
              icon={<CheckCircle />}
              color="green" 
              onClick={() => navigate("/my-requests")} 
            />
          </div>
        )}

        {/* ============================== */}
        {/*    ALERTA - STOCK BAJO (ADMIN) */}
        {/* ============================== */}
        {isAdmin && stats.lowStockMaterials > 0 && (
          <div 
            onClick={() => navigate("/admin/materials")}
            className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6 cursor-pointer hover:bg-yellow-100 transition"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-yellow-600" size={24} />
              <div>
                <p className="font-semibold text-yellow-800">
                  ⚠️ {stats.lowStockMaterials} material(es) con stock bajo
                </p>
                <p className="text-sm text-yellow-700">
                  Haz clic para revisar y reabastecer el inventario
                </p>
              </div>
            </div>

            {lowStockMaterials.length > 0 && (
              <div className="mt-3 space-y-2">
                {lowStockMaterials.map(mat => (
                  <div key={mat.id} className="flex justify-between items-center text-sm bg-white p-2 rounded">
                    <span className="font-medium">{mat.name}</span>
                    <span className="text-red-600 font-bold">
                      Quedan: {mat.quantity}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================== */}
        {/*    MATERIALES ACTIVOS (USUARIO) */}
        {/* ============================== */}
        {!isAdmin && (
          <div className="bg-white rounded-lg border shadow-sm mt-8">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Mis materiales activos</h2>
            </div>

            {activeMaterials.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <p>No tienes materiales prestados actualmente.</p>
                <button
                  onClick={() => navigate("/materials")}
                  className="mt-3 text-blue-600 hover:underline"
                >
                  Explorar catálogo de materiales →
                </button>
              </div>
            ) : (
              <div className="divide-y">
                {activeMaterials.map(mat => (
                  <div key={mat.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{mat.materialName || "Material desconocido"}</p>
                      <p className="text-sm text-gray-500">Desde: {formatDate(mat.requestDate)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/my-requests`)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Ver solicitud
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================== */}
        {/*       LISTA RECIENTE */}
        {/* ============================== */}
        <div className="bg-white rounded-lg border shadow-sm mt-8">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? "Solicitudes pendientes" : "Solicitudes recientes"}
            </h2>
            <button
              onClick={() => navigate(isAdmin ? "/admin/requests" : "/my-requests")}
              className="text-blue-600 hover:underline text-sm"
            >
              Ver todas →
            </button>
          </div>

          {recentRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {isAdmin ? (
                <div>
                  <p>No hay solicitudes pendientes.</p>
                  <button
                    onClick={() => navigate("/admin/materials")}
                    className="mt-3 text-blue-600 hover:underline"
                  >
                    Gestionar materiales →
                  </button>
                </div>
              ) : (
                <div>
                  <p>No tienes solicitudes aún.</p>
                  <button
                    onClick={() => navigate("/materials")}
                    className="mt-3 text-blue-600 hover:underline"
                  >
                    Explorar catálogo →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {recentRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium">{req.materialName || "Material desconocido"}</p>
                    <p className="text-sm text-gray-500">{formatDate(req.requestDate)}</p>
                  </div>

                  <button
                    onClick={() => navigate(isAdmin ? "/admin/requests" : "/my-requests")}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Ver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

/* ===============================
    COMPONENTE DE TARJETA CLICABLE
================================ */
const StatCard = ({ label, value, icon, onClick, color = "gray" }) => {
  const colorClasses = {
    gray: "bg-gray-100 text-gray-700 hover:bg-gray-50",
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-50",
    green: "bg-green-100 text-green-700 hover:bg-green-50",
    yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-50",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-50",
    red: "bg-red-100 text-red-700 hover:bg-red-50"
  };

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer bg-white p-5 border rounded-lg shadow-sm flex items-center gap-4 
        hover:shadow-md transition active:scale-95`}
    >
      <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
};