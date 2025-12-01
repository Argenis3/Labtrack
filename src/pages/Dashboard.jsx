import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  collection, // lo que hace es importar la colección de Firestore
  query, 
  where, 
  getDocs,
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuthContext } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { 
  Package, // lo que hace es importar el icono Package de la librería lucide-react
  Clock,  // lo que hace es importar el icono Clock de la librería lucide-react
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Users as UsersIcon,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Archive
} from 'lucide-react';

export const Dashboard = () => {
  const { user, userRole } = useAuthContext();
  const navigate = useNavigate();
  const isAdmin = userRole === 'admin';
  
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
  const [lowStockMaterials, setLowStockMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    } else {
      fetchStudentData();
    }
  }, [user, isAdmin]);

  // Datos para estudiantes
  const fetchStudentData = async () => {
    if (!user) return;

    try {
      const requestsQuery = query(
        collection(db, 'requests'),
        where('usuarioId', '==', user.uid),
        orderBy('fechaSolicitud', 'desc')
      );

      const querySnapshot = await getDocs(requestsQuery);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const stats = {
        totalRequests: requests.length,
        pending: requests.filter(r => r.estado === 'pendiente').length,
        approved: requests.filter(r => r.estado === 'aprobado').length,
        rejected: requests.filter(r => r.estado === 'rechazado').length,
        active: requests.filter(r => r.estado === 'entregado').length
      };

      setStats(stats);
      setRecentRequests(requests.slice(0, 5));
    } catch (error) {
      console.error('Error al cargar datos del estudiante:', error);
    } finally {
      setLoading(false);
    }
  };

  // Datos para administrador
  const fetchAdminData = async () => {
    try {
      // Obtener materiales
      const materialsSnapshot = await getDocs(collection(db, 'materials'));
      const materials = materialsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Obtener usuarios
      const usersSnapshot = await getDocs(collection(db, 'users'));
      
      // Obtener solicitudes
      const requestsSnapshot = await getDocs(collection(db, 'requests'));
      const requests = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Materiales con stock bajo
      const lowStock = materials.filter(m => 
        m.cantidadDisponible < 3 && m.cantidadDisponible > 0
      );

      const stats = {
        totalMaterials: materials.length,
        totalUsers: usersSnapshot.size,
        pending: requests.filter(r => r.estado === 'pendiente').length,
        approved: requests.filter(r => r.estado === 'aprobado').length,
        rejected: requests.filter(r => r.estado === 'rechazado').length,
        active: requests.filter(r => r.estado === 'entregado').length,
        lowStockMaterials: lowStock.length
      };

      setStats(stats);
      
      // Solicitudes pendientes recientes
      const pending = requests
        .filter(r => r.estado === 'pendiente')
        .sort((a, b) => {
          const dateA = a.fechaSolicitud?.toDate?.() || new Date(a.fechaSolicitud);
          const dateB = b.fechaSolicitud?.toDate?.() || new Date(b.fechaSolicitud);
          return dateB - dateA;
        })
        .slice(0, 5);
      
      setRecentRequests(pending);
      setLowStockMaterials(lowStock.slice(0, 5));
    } catch (error) {
      console.error('Error al cargar datos del admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'aprobado': return 'bg-blue-100 text-blue-800';
      case 'rechazado': return 'bg-red-100 text-red-800';
      case 'entregado': return 'bg-green-100 text-green-800';
      case 'devuelto': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estado) => {
    switch (estado) {
      case 'pendiente': return <Clock className="w-4 h-4" />;
      case 'aprobado': return <CheckCircle className="w-4 h-4" />;
      case 'rechazado': return <XCircle className="w-4 h-4" />;
      case 'entregado': return <Package className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isAdmin ? 'Panel de Administración 🔧' : `¡Bienvenido, ${user?.displayName || "Usuario"}! 👋`}
            </h1>
            <p className="text-gray-600 mt-2">
              {isAdmin 
                ? 'Gestiona materiales, solicitudes y usuarios del sistema'
                : 'Este es tu panel de control de LabTrack'
              }
            </p>
          </div>

          {/* Estadísticas - Vista Estudiante */}
          {!isAdmin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Solicitudes</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRequests}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Todas tus solicitudes</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pendientes</p>
                      <p className="text-3xl font-bold text-yellow-600 mt-2">{stats.pending}</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-full">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">En espera de aprobación</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aprobadas</p>
                      <p className="text-3xl font-bold text-blue-600 mt-2">{stats.approved}</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                      <CheckCircle className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Listas para recoger</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Activas</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">En tu poder</p>
                </div>
              </div>

              {/* Acciones Rápidas - Estudiante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <button
                  onClick={() => navigate('/catalog')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <Package className="w-8 h-8 mb-3" />
                  <h3 className="text-lg font-semibold">Ver Catálogo</h3>
                  <p className="text-sm text-blue-100 mt-2">Explora materiales disponibles</p>
                </button>

                <button
                  onClick={() => navigate('/new-request')}
                  className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <Calendar className="w-8 h-8 mb-3" />
                  <h3 className="text-lg font-semibold">Nueva Solicitud</h3>
                  <p className="text-sm text-green-100 mt-2">Solicita un material</p>
                </button>

                <button
                  onClick={() => navigate('/my-requests')}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <Clock className="w-8 h-8 mb-3" />
                  <h3 className="text-lg font-semibold">Mis Solicitudes</h3>
                  <p className="text-sm text-purple-100 mt-2">Revisa tu historial</p>
                </button>
              </div>
            </>
          )}

          {/* Estadísticas - Vista Admin */}
          {isAdmin && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-100">Total Materiales</p>
                      <p className="text-4xl font-bold mt-2">{stats.totalMaterials}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <Package className="w-8 h-8" />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/inventory')}
                    className="mt-4 text-sm text-blue-100 hover:text-white font-medium"
                  >
                    Ver inventario →
                  </button>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-md p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-100">Pendientes</p>
                      <p className="text-4xl font-bold mt-2">{stats.pending}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <Clock className="w-8 h-8" />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/requests')}
                    className="mt-4 text-sm text-yellow-100 hover:text-white font-medium"
                  >
                    Revisar solicitudes →
                  </button>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-100">Activas</p>
                      <p className="text-4xl font-bold mt-2">{stats.active}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <CheckCircle className="w-8 h-8" />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/requests')}
                    className="mt-4 text-sm text-green-100 hover:text-white font-medium"
                  >
                    Ver todas →
                  </button>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white hover:shadow-xl transition transform hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-100">Usuarios</p>
                      <p className="text-4xl font-bold mt-2">{stats.totalUsers}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 p-3 rounded-full">
                      <UsersIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/admin-users')}
                    className="mt-4 text-sm text-purple-100 hover:text-white font-medium"
                  >
                    Gestionar usuarios →
                  </button>
                </div>
              </div>

              {/* Alerta de Stock Bajo */}
              {stats.lowStockMaterials > 0 && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-6 mb-8 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-6 h-6 text-orange-500 mr-3" />
                    <div>
                      <h3 className="text-orange-900 font-semibold">
                        ⚠️ {stats.lowStockMaterials} materiales con stock bajo
                      </h3>
                      <p className="text-orange-700 text-sm mt-1">
                        Algunos materiales tienen menos de 3 unidades disponibles
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="ml-auto bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
                    >
                      Ver inventario
                    </button>
                  </div>
                </div>
              )}

              {/* Grid de contenido Admin */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Solicitudes Pendientes */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Solicitudes Pendientes</h2>
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>

                  {recentRequests.length === 0 ? (
                    <div className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">¡No hay solicitudes pendientes!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {recentRequests.map((request) => (
                        <div key={request.id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {request.materialNombre || 'Material'}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                Solicitado por: {request.usuarioNombre || 'Usuario'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(request.fechaSolicitud)}
                              </p>
                            </div>
                            <button
                              onClick={() => navigate(`/request/${request.id}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Revisar →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => navigate('/requests')}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Ver todas las solicitudes →
                    </button>
                  </div>
                </div>

                {/* Materiales con Stock Bajo */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Stock Bajo</h2>
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                  </div>

                  {lowStockMaterials.length === 0 ? (
                    <div className="p-8 text-center">
                      <Archive className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600">Todos los materiales tienen stock suficiente</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {lowStockMaterials.map((material) => (
                        <div key={material.id} className="p-4 hover:bg-gray-50 transition">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{material.nombre}</p>
                              <p className="text-sm text-gray-600 mt-1">Código: {material.codigo}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-orange-600">
                                {material.cantidadDisponible}
                              </p>
                              <p className="text-xs text-gray-500">de {material.cantidadTotal}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <button
                      onClick={() => navigate('/inventory')}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Ver inventario completo →
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Tabla de Solicitudes Recientes - Estudiante */}
          {!isAdmin && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Solicitudes Recientes</h2>
              </div>

              {recentRequests.length === 0 ? (
                <div className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes solicitudes aún
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Comienza explorando el catálogo de materiales
                  </p>
                  <button
                    onClick={() => navigate('/catalog')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                  >
                    Ir al Catálogo
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Solicitud</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {request.materialNombre || 'Material'}
                            </div>
                            <div className="text-sm text-gray-500">Cantidad: {request.cantidad || 1}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(request.fechaSolicitud)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {formatDate(request.fechaInicioPrestamo)} - {formatDate(request.fechaFinPrestamo)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.estado)}`}>
                              {getStatusIcon(request.estado)}
                              {request.estado.charAt(0).toUpperCase() + request.estado.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => navigate(`/request/${request.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Ver detalles →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {recentRequests.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => navigate('/my-requests')}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Ver todas las solicitudes →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};