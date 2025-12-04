// --- IMPORTS ---
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
    lowStockMaterials: 0
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
      const q = query(
        collection(db, "requests"),
        where("usuarioId", "==", user.uid),
        orderBy("fechaSolicitud", "desc")
      );

      const snapshot = await getDocs(q);
      const requests = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setActiveMaterials(
        requests.filter(r => r.estado === "entregado")
      );

      const stats = {
        totalRequests: requests.length,
        pending: requests.filter(r => r.estado === "pendiente").length,
        approved: requests.filter(r => r.estado === "aprobado").length,
        rejected: requests.filter(r => r.estado === "rechazado").length,
        active: requests.filter(r => r.estado === "entregado").length
      };

      setStats(stats);
      setRecentRequests(requests.slice(0, 5));
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

      const lowStock = materials.filter(
        m => m.cantidadDisponible < 3 && m.cantidadDisponible > 0
      );

      const stats = {
        totalMaterials: materials.length,
        totalUsers: usersSnap.size,
        pending: requests.filter(r => r.estado === "pendiente").length,
        approved: requests.filter(r => r.estado === "aprobado").length,
        rejected: requests.filter(r => r.estado === "rechazado").length,
        active: requests.filter(r => r.estado === "entregado").length,
        lowStockMaterials: lowStock.length
      };

      const recentPending = requests
        .filter(r => r.estado === "pendiente")
        .sort((a, b) => {
          const da = a.fechaSolicitud?.toDate?.() || new Date(a.fechaSolicitud);
          const db = b.fechaSolicitud?.toDate?.() || new Date(b.fechaSolicitud);
          return db - da;
        })
        .slice(0, 5);

      setStats(stats);
      setRecentRequests(recentPending);
      setLowStockMaterials(lowStock.slice(0, 5));
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
            onClick={() => navigate("/materials")}
          >
            Ver Catálogo de Materiales
          </button>
        </div>

        {/* ============================== */}
        {/*         ESTADÍSTICAS */}
        {/* ============================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {isAdmin ? (
            <>
              <StatCard label="Materiales" value={stats.totalMaterials} icon={<Package />} onClick={() => navigate("/inventory")} />
              <StatCard label="Pendientes" value={stats.pending} icon={<Clock />} onClick={() => navigate("/admin/requests")} />
              <StatCard label="Activas" value={stats.active} icon={<CheckCircle />} onClick={() => navigate("/admin/requests")} />
              <StatCard label="Usuarios" value={stats.totalUsers} icon={<UsersIcon />} onClick={() => navigate("/admin/users")} />
            </>
          ) : (
            <>
              <StatCard label="Solicitudes" value={stats.totalRequests} icon={<TrendingUp />} onClick={() => navigate("/my-requests")} />
              <StatCard label="Pendientes" value={stats.pending} icon={<Clock />} onClick={() => navigate("/my-requests")} />
              <StatCard label="Aprobadas" value={stats.approved} icon={<CheckCircle />} onClick={() => navigate("/my-requests")} />
              <StatCard label="Activas" value={stats.active} icon={<Package />} onClick={() => navigate("/my-requests")} />
            </>
          )}
        </div>

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
                No tienes materiales prestados actualmente.
              </div>
            ) : (
              <div className="divide-y">
                {activeMaterials.map(mat => (
                  <div key={mat.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium">{req.materialNombre?.name || req.materialNombre || "Material desconocido"}</p>
                      <p className="text-sm text-gray-500">Desde: {formatDate(mat.fechaSolicitud)}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/request/${mat.id}`)}
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
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              {isAdmin ? "Solicitudes pendientes" : "Solicitudes recientes"}
            </h2>
          </div>

          {recentRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay información disponible.
            </div>
          ) : (
            <div className="divide-y">
              {recentRequests.map(req => (
                <div
                  key={req.id}
                  className="p-4 flex justify-between items-center hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-medium">{req.materialNombre?.name || req.materialNombre || "Material desconocido"}</p>
                    <p className="text-sm text-gray-500">{formatDate(req.fechaSolicitud)}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/request/${req.id}`)}
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
const StatCard = ({ label, value, icon, onClick }) => (
  <div
    onClick={onClick}
    className="cursor-pointer bg-white p-5 border rounded-lg shadow-sm flex items-center gap-4 
      hover:shadow-md hover:bg-gray-50 transition active:scale-95"
  >
    <div className="p-3 bg-gray-100 rounded-lg text-gray-700">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);
