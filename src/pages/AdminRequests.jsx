// src/pages/AdminRequests.jsx
// Panel para que admins gestionen solicitudes

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { Navbar } from "../components/Navbar";
import { Clock, CheckCircle, XCircle, Package, User, Calendar } from "lucide-react";

export const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  const statusConfig = {
    pending: { label: "Pendiente", icon: Clock, color: "yellow" },
    approved: { label: "Aprobada", icon: CheckCircle, color: "green" },
    rejected: { label: "Rechazada", icon: XCircle, color: "red" },
    returned: { label: "Devuelto", icon: Package, color: "gray" },
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "requests"));
      const requestsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // Ordenar por fecha más reciente
      requestsList.sort((a, b) => {
        const dateA = a.requestDate?.toDate?.() || new Date(a.requestDate);
        const dateB = b.requestDate?.toDate?.() || new Date(b.requestDate);
        return dateB - dateA;
      });
      setRequests(requestsList);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request) => {
    try {
      const requestRef = doc(db, "requests", request.id);
      
      // Actualizar la solicitud
      await updateDoc(requestRef, {
        status: "approved",
        approvedBy: "admin", // Aquí podrías poner el UID del admin
        approvedDate: serverTimestamp(),
        history: [
          ...(request.history || []),
          {
            action: "approved",
            date: new Date(),
            by: "admin",
            note: "Solicitud aprobada",
          },
        ],
      });

      // Actualizar cantidad del material (reducir el stock)
      const materialRef = doc(db, "materials", request.materialId);
      await updateDoc(materialRef, {
        quantity: increment(-request.quantity),
      });

      alert("Solicitud aprobada exitosamente");
      await fetchRequests();
      setActionModal(null);
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      alert("Error al aprobar la solicitud");
    }
  };

  const handleReject = async (request, reason) => {
    if (!reason.trim()) {
      alert("Debes proporcionar un motivo de rechazo");
      return;
    }

    try {
      const requestRef = doc(db, "requests", request.id);
      
      await updateDoc(requestRef, {
        status: "rejected",
        approvedBy: "admin",
        approvedDate: serverTimestamp(),
        rejectionReason: reason.trim(),
        history: [
          ...(request.history || []),
          {
            action: "rejected",
            date: new Date(),
            by: "admin",
            note: `Rechazada: ${reason}`,
          },
        ],
      });

      alert("Solicitud rechazada");
      await fetchRequests();
      setActionModal(null);
    } catch (error) {
      console.error("Error al rechazar solicitud:", error);
      alert("Error al rechazar la solicitud");
    }
  };

  const handleReturn = async (request) => {
    try {
      const requestRef = doc(db, "requests", request.id);
      
      // Actualizar la solicitud
      await updateDoc(requestRef, {
        status: "returned",
        returnDate: serverTimestamp(),
        history: [
          ...(request.history || []),
          {
            action: "returned",
            date: new Date(),
            by: "admin",
            note: "Material devuelto",
          },
        ],
      });

      // Devolver cantidad al material
      const materialRef = doc(db, "materials", request.materialId);
      await updateDoc(materialRef, {
        quantity: increment(request.quantity),
      });

      alert("Material marcado como devuelto");
      await fetchRequests();
      setActionModal(null);
    } catch (error) {
      console.error("Error al marcar como devuelto:", error);
      alert("Error al procesar la devolución");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === "all") return true;
    return req.status === filterStatus;
  });

  const getStats = () => {
    return {
      total: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center py-12">
          <div className="text-xl">Cargando solicitudes...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Solicitudes</h1>
          <p className="text-gray-600">
            Aprueba o rechaza solicitudes de préstamo de materiales
          </p>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total" value={stats.total} color="blue" />
          <StatCard label="Pendientes" value={stats.pending} color="yellow" />
          <StatCard label="Aprobadas" value={stats.approved} color="green" />
          <StatCard label="Rechazadas" value={stats.rejected} color="red" />
        </div>

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filtrar por estado
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
            <option value="returned">Devueltas</option>
          </select>
        </div>

        {/* Lista de solicitudes */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="mx-auto text-gray-400 mb-4" size={64} />
            <p className="text-gray-500 text-lg">No hay solicitudes para mostrar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = statusConfig[request.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={request.id}
                  className="bg-white rounded-lg border shadow-sm hover:shadow-md transition"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Imagen */}
                      <div className="flex-shrink-0">
                        {request.materialImage ? (
                          <img
                            src={request.materialImage}
                            alt={request.materialName}
                            className="w-20 h-20 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                            <Package className="text-gray-400" size={32} />
                          </div>
                        )}
                      </div>

                      {/* Información */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {request.materialName}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <User size={14} className="text-gray-400" />
                              <p className="text-sm text-gray-600">
                                {request.userName} {request.userLastName} - {request.userMatricula}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold 
                            ${
                              request.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : request.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            <StatusIcon size={16} />
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-500">Cantidad</p>
                            <p className="font-semibold">{request.quantity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Carrera</p>
                            <p className="font-semibold">{request.userCarrera}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Solicitado</p>
                            <p className="font-semibold">{formatDate(request.requestDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Período</p>
                            <p className="font-semibold">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded mb-3">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Propósito:</p>
                          <p className="text-sm text-gray-600">{request.purpose}</p>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm font-medium"
                          >
                            Ver Detalles
                          </button>

                          {request.status === "pending" && (
                            <>
                              <button
                                onClick={() => setActionModal({ type: "approve", request })}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => setActionModal({ type: "reject", request })}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                              >
                                Rechazar
                              </button>
                            </>
                          )}

                          {request.status === "approved" && (
                            <button
                              onClick={() => setActionModal({ type: "return", request })}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                            >
                              Marcar como Devuelto
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de acción */}
        {actionModal && (
          <ActionModal
            actionModal={actionModal}
            onClose={() => setActionModal(null)}
            onApprove={handleApprove}
            onReject={handleReject}
            onReturn={handleReturn}
          />
        )}

        {/* Modal de detalles (puedes reutilizar el de MyRequests) */}
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            formatDate={formatDate}
            isAdmin={true}
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
    yellow: "bg-yellow-100 text-yellow-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-white p-5 border rounded-lg shadow-sm">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

// Modal de acción (aprobar/rechazar/devolver)
const ActionModal = ({ actionModal, onClose, onApprove, onReject, onReturn }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const { type, request } = actionModal;

  const handleSubmit = () => {
    if (type === "approve") {
      if (window.confirm("¿Confirmas que deseas aprobar esta solicitud?")) {
        onApprove(request);
      }
    } else if (type === "reject") {
      onReject(request, rejectionReason);
    } else if (type === "return") {
      if (window.confirm("¿Confirmas que el material ha sido devuelto?")) {
        onReturn(request);
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">
          {type === "approve"
            ? "Aprobar Solicitud"
            : type === "reject"
            ? "Rechazar Solicitud"
            : "Marcar como Devuelto"}
        </h2>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Material: <span className="font-semibold">{request.materialName}</span>
          </p>
          <p className="text-gray-600">
            Usuario: <span className="font-semibold">{request.userName} {request.userLastName}</span>
          </p>
        </div>

        {type === "reject" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del rechazo *
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Explica por qué se rechaza la solicitud..."
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={type === "reject" && !rejectionReason.trim()}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition disabled:opacity-50 ${
              type === "approve"
                ? "bg-green-600 hover:bg-green-700"
                : type === "reject"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal de detalles (simplificado para admin)
const RequestDetailModal = ({ request, onClose, formatDate, isAdmin }) => {
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
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Solicitud</h2>
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
          <div>
            <h3 className="font-semibold mb-2">Material</h3>
            <p>{request.materialName} - {request.materialCategory}</p>
            <p className="text-sm text-gray-600">Cantidad: {request.quantity}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Usuario</h3>
            <p>{request.userName} {request.userLastName}</p>
            <p className="text-sm text-gray-600">Matrícula: {request.userMatricula}</p>
            <p className="text-sm text-gray-600">Carrera: {request.userCarrera}</p>
            <p className="text-sm text-gray-600">Email: {request.userEmail}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Período</h3>
            <p className="text-sm">Inicio: {formatDate(request.startDate)}</p>
            <p className="text-sm">Fin: {formatDate(request.endDate)}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Propósito</h3>
            <p className="bg-gray-50 p-3 rounded">{request.purpose}</p>
          </div>

          {request.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notas</h3>
              <p className="bg-gray-50 p-3 rounded">{request.notes}</p>
            </div>
          )}

          {request.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h3 className="font-semibold text-red-800 mb-2">Motivo de Rechazo</h3>
              <p className="text-red-700">{request.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};