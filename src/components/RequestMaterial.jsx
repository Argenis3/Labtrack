// src/components/RequestMaterial.jsx
// Componente para que usuarios soliciten materiales

import React, { useState } from "react";
import { db } from "../config/firebase";
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuthContext } from "../context/AuthContext";
import { X, Calendar, FileText, AlertCircle } from "lucide-react";

export const RequestMaterial = ({ material, onClose, onSuccess }) => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    startDate: "",
    endDate: "",
    purpose: "",
    notes: "",
  });
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    // Validar cantidad
    if (formData.quantity < 1) {
      setError("La cantidad debe ser al menos 1");
      return false;
    }

    if (formData.quantity > material.quantity) {
      setError(`Solo hay ${material.quantity} unidades disponibles`);
      return false;
    }

    // Validar fechas
    if (!formData.startDate || !formData.endDate) {
      setError("Debes seleccionar fechas de inicio y fin");
      return false;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      setError("La fecha de inicio no puede ser anterior a hoy");
      return false;
    }

    if (end <= start) {
      setError("La fecha de fin debe ser posterior a la fecha de inicio");
      return false;
    }

    // Validar propósito
    if (!formData.purpose.trim()) {
      setError("Debes especificar el propósito de la solicitud");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // DIAGNÓSTICO: Verificar que tenemos el usuario
      console.log("🔍 Usuario actual:", {
        uid: user?.uid,
        email: user?.email
      });

      // Obtener datos del usuario y verificar si está bloqueado
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      console.log("👤 Datos del usuario obtenidos:", userData);

      // Verificar si el usuario está bloqueado
      if (userData?.blocked) {
        setError(`❌ No puedes hacer solicitudes. Tu cuenta ha sido bloqueada. Motivo: ${userData.blockReason || "No especificado"}`);
        setLoading(false);
        return;
      }

      // Crear la solicitud
      const requestData = {
        // Información del material
        materialId: material.id,
        materialName: material.name,
        materialCategory: material.category,
        materialImage: material.imageURL || null,

        // Información del usuario - IMPORTANTE: Usar user.uid
        userId: user.uid,
        userEmail: user.email || userData?.email || "sin-email",
        userName: userData?.name || "Sin nombre",
        userLastName: userData?.lastName || "",
        userMatricula: userData?.matricula || "N/A",
        userCarrera: userData?.carrera || "N/A",

        // Detalles de la solicitud
        quantity: parseInt(formData.quantity),
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        purpose: formData.purpose.trim(),
        notes: formData.notes.trim(),

        // Estado y fechas
        status: "pending", // pending, approved, rejected, returned
        requestDate: serverTimestamp(),
        approvedBy: null,
        approvedDate: null,
        rejectionReason: null,
        returnDate: null,

        // Historial
        history: [
          {
            action: "created",
            date: new Date(),
            by: user.uid,
            note: "Solicitud creada",
          },
        ],
      };

      console.log("📝 Datos de la solicitud a guardar:", requestData);

      // Guardar la solicitud
      const docRef = await addDoc(collection(db, "requests"), requestData);

      console.log("✅ Solicitud guardada con ID:", docRef.id);

      // Mostrar éxito
      if (onSuccess) {
        onSuccess();
      }

      alert("¡Solicitud enviada exitosamente! Recibirás una notificación cuando sea revisada.");
      onClose();
    } catch (error) {
      console.error("❌ Error al crear solicitud:", error);
      console.error("Detalles del error:", {
        code: error.code,
        message: error.message
      });
      setError(`Error al enviar la solicitud: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calcular días de préstamo
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    }
    return 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Solicitar Material</h2>
            <p className="text-gray-600 mt-1">{material.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Material Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex gap-4">
            {material.imageURL && (
              <img
                src={material.imageURL}
                alt={material.name}
                className="w-20 h-20 object-cover rounded"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{material.name}</h3>
              <p className="text-sm text-gray-600">{material.description}</p>
              <div className="mt-2 flex gap-4 text-sm">
                <span className="text-gray-600">
                  Categoría: <span className="font-medium">{material.category}</span>
                </span>
                <span className="text-green-600 font-medium">
                  Disponibles: {material.quantity}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad a solicitar *
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              min="1"
              max={material.quantity}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Máximo disponible: {material.quantity}
            </p>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio *
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de devolución *
              </label>
              <div className="relative">
                <Calendar
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={18}
                />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split("T")[0]}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Días de préstamo */}
          {calculateDays() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Duración del préstamo: <span className="font-bold">{calculateDays()} días</span>
              </p>
            </div>
          )}

          {/* Propósito */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Propósito del préstamo *
            </label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-3 text-gray-400"
                size={18}
              />
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                required
                rows="3"
                placeholder="Ej: Práctica de laboratorio de Electrónica, Proyecto final, etc."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas adicionales (opcional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              placeholder="Cualquier información adicional..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Términos */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">Términos y condiciones:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Debes devolver el material en la fecha indicada</li>
              <li>• Eres responsable del material mientras esté en tu posesión</li>
              <li>• Cualquier daño o pérdida será reportado</li>
              <li>• La solicitud debe ser aprobada por un administrador</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? "Enviando..." : "Enviar Solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};