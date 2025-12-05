// src/pages/AdminUsers.jsx
import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { db } from "../config/firebase";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { Users as UsersIcon, Ban, CheckCircle, AlertTriangle } from "lucide-react";

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockModal, setBlockModal] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
      setError(null);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setError("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      await fetchUsers();
      alert("Rol actualizado exitosamente");
    } catch (err) {
      console.error("Error al actualizar rol:", err);
      alert("Error al actualizar el rol del usuario");
    }
  };

  const handleBlockUser = async (userId, reason) => {
    if (!reason.trim()) {
      alert("Debes proporcionar un motivo de bloqueo");
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        blocked: true,
        blockReason: reason.trim(),
        blockedAt: new Date(),
      });
      await fetchUsers();
      setBlockModal(null);
      alert("Usuario bloqueado exitosamente");
    } catch (err) {
      console.error("Error al bloquear usuario:", err);
      alert("Error al bloquear el usuario");
    }
  };

  const handleUnblockUser = async (userId) => {
    if (!window.confirm("¿Estás seguro de desbloquear este usuario?")) {
      return;
    }

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        blocked: false,
        blockReason: null,
        blockedAt: null,
        unblockedAt: new Date(),
      });
      await fetchUsers();
      alert("Usuario desbloqueado exitosamente");
    } catch (err) {
      console.error("Error al desbloquear usuario:", err);
      alert("Error al desbloquear el usuario");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.matricula?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && !user.blocked) ||
      (filterStatus === "blocked" && user.blocked);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => !u.blocked).length,
    blocked: users.filter((u) => u.blocked).length,
    admins: users.filter((u) => u.role === "admin").length,
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="text-xl">Cargando usuarios...</div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Usuarios" value={stats.total} color="blue" />
          <StatCard label="Activos" value={stats.active} color="green" />
          <StatCard label="Bloqueados" value={stats.blocked} color="red" />
          <StatCard label="Administradores" value={stats.admins} color="purple" />
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Buscar por nombre, email o matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="blocked">Bloqueados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <p className="text-gray-600">
              Mostrando {filteredUsers.length} de {users.length} usuarios
            </p>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No se encontraron usuarios.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matrícula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carrera
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <UsersIcon className="text-blue-600" size={20} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userData.name || "N/A"} {userData.lastName || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.matricula || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {userData.carrera || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.email || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={userData.role || "student"}
                          onChange={(e) => handleRoleChange(userData.id, e.target.value)}
                          disabled={userData.blocked}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="student">Estudiante</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userData.blocked ? (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <Ban size={14} />
                            Bloqueado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle size={14} />
                            Activo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedUser(userData)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Ver
                          </button>
                          {userData.blocked ? (
                            <button
                              onClick={() => handleUnblockUser(userData.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Desbloquear
                            </button>
                          ) : (
                            <button
                              onClick={() => setBlockModal(userData)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Bloquear
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de detalles de usuario */}
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}

        {/* Modal de bloqueo */}
        {blockModal && (
          <BlockUserModal
            user={blockModal}
            onClose={() => setBlockModal(null)}
            onBlock={handleBlockUser}
          />
        )}
      </div>
    </>
  );
};

// Componente de estadísticas
const StatCard = ({ label, value, color }) => {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="bg-white p-5 border rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

// Modal de detalles del usuario
const UserDetailModal = ({ user, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {user.blocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
              <div>
                <p className="font-semibold text-red-800 mb-1">Usuario Bloqueado</p>
                <p className="text-sm text-red-700">
                  <strong>Motivo:</strong> {user.blockReason || "No especificado"}
                </p>
                {user.blockedAt && (
                  <p className="text-sm text-red-600 mt-1">
                    Bloqueado el: {new Date(user.blockedAt).toLocaleDateString("es-ES")}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Información Personal</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {user.name || "N/A"}</p>
              <p><strong>Apellido:</strong> {user.lastName || "N/A"}</p>
              <p><strong>Email:</strong> {user.email || "N/A"}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Información Académica</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Matrícula:</strong> {user.matricula || "N/A"}</p>
              <p><strong>Carrera:</strong> {user.carrera || "N/A"}</p>
              <p><strong>Rol:</strong> {user.role === "admin" ? "Administrador" : "Estudiante"}</p>
            </div>
          </div>

          {user.createdAt && (
            <div className="pt-4 border-t text-sm text-gray-500">
              Registrado el {new Date(user.createdAt.seconds * 1000).toLocaleDateString("es-ES")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Modal de bloqueo de usuario
const BlockUserModal = ({ user, onClose, onBlock }) => {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-red-100 p-3 rounded-full">
            <Ban className="text-red-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Bloquear Usuario</h2>
            <p className="text-sm text-gray-600">
              {user.name} {user.lastName}
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Advertencia:</strong> El usuario bloqueado no podrá iniciar sesión ni realizar solicitudes hasta que sea desbloqueado.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo del bloqueo *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            placeholder="Ej: Devolución tardía repetida, daño a material, etc."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={() => onBlock(user.id, reason)}
            disabled={!reason.trim()}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Bloquear Usuario
          </button>
        </div>
      </div>
    </div>
  );
};