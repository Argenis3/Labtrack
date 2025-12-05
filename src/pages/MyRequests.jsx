// src/pages/MyRequests.jsx
// Vista para que usuarios vean sus solicitudes

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useAuthContext } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { Clock, CheckCircle, XCircle, Package, Calendar, FileText, RotateCcw } from "lucide-react";

export const MyRequests = () => {
  const { user } = useAuthContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [returningRequest, setReturningRequest] = useState(null);

  const statusConfig = {
    pending: {
      label: "Pendiente",
      icon: Clock,
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-800",
      iconColor: "text-yellow-600",
    },
    approved: {
      label: "Aprobada",
      icon: CheckCircle,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-800",
      iconColor: "text-green-600",
    },
    rejected: {
      label: "Rechazada",
      icon: XCircle,
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-800",
      iconColor: "text-red-600",
    },
    returned: {
      label: "Devuelto",
      icon: Package,
      color: "gray",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      textColor: "text-gray-800",
      iconColor: "text-gray-600",
    },
  };

  useEffect(() => {
    fetchMyRequests();
  }, [user]);

  const fetchMyRequests = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "requests"),
        where("userId", "==", user.uid),
        orderBy("requestDate", "desc")
      );

      const snapshot = await getDocs(q);
      const requestsList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRequests(requestsList);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
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

  const handleReturnRequest = async (request) => {
    try {
      const requestRef = doc(db, "requests", request.id);
      
      await updateDoc(requestRef, {
        status: "returned",
        returnDate: serverTimestamp(),
        returnedByUser: true,
        history: [
          ...(request.history || []),
          {
            action: "returned",
            date: new Date(),
            by: user.uid,
            note: "Material devuelto por el usuario",
          },
        ],
      });

      alert("✅ Devolución registrada. Un administrador confirmará la recepción del material.");
      setReturningRequest(null);
      await fetchMyRequests();
    } catch (error) {
      console.error("Error al registrar devolución:", error);
      alert("Error al registrar la devolución");
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Mis Solicitudes</h1>
          <p className="text-gray-600">
            Revisa el estado de tus solicitudes de materiales
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
            <p className="text-gray-500 text-lg">
              {filterStatus === "all"
                ? "No tienes solicitudes aún"
                : "No hay solicitudes con este estado"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusInfo = statusConfig[request.status] || statusConfig.pending;
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={request.id}
                  className={`bg-white rounded-lg border shadow-sm hover:shadow-md transition cursor-pointer ${statusInfo.borderColor}`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Imagen del material */}
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
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {request.materialName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {request.materialCategory}
                            </p>
                          </div>
                          <span
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.bgColor} ${statusInfo.textColor}`}
                          >
                            <StatusIcon size={16} />
                            {statusInfo.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Cantidad</p>
                            <p className="font-semibold">{request.quantity} unidad(es)</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Fecha de solicitud</p>
                            <p className="font-semibold">{formatDate(request.requestDate)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Período</p>
                            <p className="font-semibold">
                              {formatDate(request.startDate)} - {formatDate(request.endDate)}
                            </p>
                          </div>
                        </div>

                        {request.status === "rejected" && request.rejectionReason && (
                          <div className={`mt-3 p-3 rounded ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
                            <p className="text-sm font-semibold text-red-800 mb-1">
                              Motivo del rechazo:
                            </p>
                            <p className="text-sm text-red-700">{request.rejectionReason}</p>
                          </div>
                        )}

                        {/* Botón de devolución */}
                        {request.status === "approved" && (
                          <div className="mt-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReturningRequest(request);
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition font-medium flex items-center justify-center gap-2"
                            >
                              <RotateCcw size={18} />
                              Registrar Devolución
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de detalles */}
        {selectedRequest && (
          <RequestDetailModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            statusConfig={statusConfig}
            formatDate={formatDate}
          />
        )}

        {/* Modal de confirmación de devolución */}
        {returningRequest && (
          <ReturnConfirmationModal
            request={returningRequest}
            onClose={() => setReturningRequest(null)}
            onConfirm={handleReturnRequest}
          />
        )}
      </div>
    </>
  );
};

// Componente de tarjeta de estadística
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

// Modal de detalles de solicitud
const RequestDetailModal = ({ request, onClose, statusConfig, formatDate }) => {
  const statusInfo = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = statusInfo.icon;

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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className={`p-4 rounded-lg ${statusInfo.bgColor} ${statusInfo.borderColor} border`}>
            <div className="flex items-center gap-3">
              <StatusIcon className={statusInfo.iconColor} size={24} />
              <div>
                <p className="font-semibold text-lg">{statusInfo.label}</p>
                <p className="text-sm text-gray-600">Estado actual de tu solicitud</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Material Solicitado</h3>
            <div className="flex gap-4">
              {request.materialImage && (
                <img src={request.materialImage} alt={request.materialName} className="w-24 h-24 object-cover rounded" />
              )}
              <div>
                <p className="font-bold text-lg">{request.materialName}</p>
                <p className="text-gray-600">{request.materialCategory}</p>
                <p className="text-gray-600 mt-1">Cantidad: <span className="font-semibold">{request.quantity}</span></p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3">Período de Préstamo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Inicio</p>
                  <p className="font-semibold">{formatDate(request.startDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="text-gray-400" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Fin</p>
                  <p className="font-semibold">{formatDate(request.endDate)}</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <FileText size={20} />
              Propósito
            </h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.purpose}</p>
          </div>

          {request.notes && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Notas Adicionales</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{request.notes}</p>
            </div>
          )}

          {request.status === "rejected" && request.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Motivo del Rechazo</h3>
              <p className="text-red-700">{request.rejectionReason}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Solicitud creada el {formatDate(request.requestDate)}
            </p>
            {request.approvedDate && (
              <p className="text-sm text-gray-500">
                {request.status === "approved" ? "Aprobada" : "Procesada"} el {formatDate(request.approvedDate)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal de confirmación de devolución
const ReturnConfirmationModal = ({ request, onClose, onConfirm }) => {
  const [notes, setNotes] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <RotateCcw className="text-blue-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Registrar Devolución</h2>
            <p className="text-sm text-gray-600">{request.materialName}</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Al registrar la devolución, el material debe ser entregado físicamente en el laboratorio. Un administrador confirmará la recepción.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas sobre el estado del material (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows="3"
            placeholder="Ej: Material en buenas condiciones, sin daños..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Cantidad a devolver:</strong> {request.quantity} unidad(es)
          </p>
          <p className="text-sm text-gray-600">
            <strong>Fecha límite:</strong> {new Date(request.endDate.toDate ? request.endDate.toDate() : request.endDate).toLocaleDateString("es-ES")}
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition">
            Cancelar
          </button>
          <button onClick={() => onConfirm(request)} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold">
            Confirmar Devolución
          </button>
        </div>
      </div>
    </div>
  );
};