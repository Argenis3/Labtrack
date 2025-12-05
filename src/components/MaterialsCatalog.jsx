// src/components/MaterialsCatalog.jsx
// Vista para usuarios normales (solo lectura + solicitar)

import React, { useState, useEffect } from "react";
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { RequestMaterial } from "./RequestMaterial";
import { Package } from "lucide-react";

export const MaterialsCatalog = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(null);

  const categories = [
    "Electrónica",
    "Mecánica",
    "Química",
    "Biología",
    "Física",
    "Computación",
    "Herramientas",
    "Otro",
  ];

  const statusOptions = [
    { value: "available", label: "Disponible", color: "green" },
    { value: "in-use", label: "En uso", color: "blue" },
    { value: "maintenance", label: "Mantenimiento", color: "yellow" },
    { value: "unavailable", label: "No disponible", color: "red" },
  ];

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const materialsCollection = collection(db, "materials");
      const materialsSnapshot = await getDocs(materialsCollection);
      const materialsList = materialsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMaterials(materialsList);
    } catch (error) {
      console.error("Error al cargar materiales:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSuccess = () => {
    setShowRequestModal(null);
    fetchMaterials(); // Recargar materiales
  };

  // Filtrar materiales
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || material.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" || material.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl">Cargando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catálogo de Materiales</h1>
        <p className="text-gray-600">
          Explora los materiales disponibles en el laboratorio
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumen de resultados */}
      <div className="mb-4 text-gray-600">
        Mostrando {filteredMaterials.length} de {materials.length} materiales
      </div>

      {/* Grid de materiales */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No se encontraron materiales</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {/* Imagen */}
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                {material.imageURL ? (
                  <img
                    src={material.imageURL}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={64} />
                  </div>
                )}
                {/* Badge de estado */}
                <div className="absolute top-2 right-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      material.status === "available"
                        ? "bg-green-500 text-white"
                        : material.status === "in-use"
                        ? "bg-blue-500 text-white"
                        : material.status === "maintenance"
                        ? "bg-yellow-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {statusOptions.find((s) => s.value === material.status)
                      ?.label || material.status}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {material.name}
                </h3>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {material.description}
                </p>

                <div className="space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categoría:</span>
                    <span className="font-medium">{material.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Disponibles:</span>
                    <span className={`font-bold ${material.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {material.quantity}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ubicación:</span>
                    <span className="font-medium text-sm">{material.location}</span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMaterial(material)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg transition text-sm font-medium"
                  >
                    Ver Detalles
                  </button>
                  <button
                    onClick={() => setShowRequestModal(material)}
                    disabled={material.status !== "available" || material.quantity === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Solicitar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalles */}
      {selectedMaterial && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedMaterial(null)}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Imagen grande */}
              <div className="h-64 bg-gray-200 overflow-hidden">
                {selectedMaterial.imageURL ? (
                  <img
                    src={selectedMaterial.imageURL}
                    alt={selectedMaterial.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={96} />
                  </div>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={() => setSelectedMaterial(null)}
                className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Información detallada */}
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedMaterial.name}
                </h2>
                <span
                  className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    selectedMaterial.status === "available"
                      ? "bg-green-100 text-green-800"
                      : selectedMaterial.status === "in-use"
                      ? "bg-blue-100 text-blue-800"
                      : selectedMaterial.status === "maintenance"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {statusOptions.find((s) => s.value === selectedMaterial.status)
                    ?.label || selectedMaterial.status}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Descripción
                  </h3>
                  <p className="text-gray-600">{selectedMaterial.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Categoría
                    </h3>
                    <p className="text-gray-900">{selectedMaterial.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Cantidad Disponible
                    </h3>
                    <p className="text-gray-900 text-2xl font-bold">
                      {selectedMaterial.quantity}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Ubicación
                  </h3>
                  <p className="text-gray-900">{selectedMaterial.location}</p>
                </div>

                {selectedMaterial.createdAt && (
                  <div className="text-sm text-gray-500 pt-4 border-t">
                    Registrado el{" "}
                    {new Date(
                      selectedMaterial.createdAt.seconds * 1000
                    ).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}

                {/* Botón solicitar en modal */}
                <button
                  onClick={() => {
                    setSelectedMaterial(null);
                    setShowRequestModal(selectedMaterial);
                  }}
                  disabled={selectedMaterial.status !== "available" || selectedMaterial.quantity === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedMaterial.quantity === 0 ? "Sin disponibilidad" : "Solicitar Material"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de solicitud */}
      {showRequestModal && (
        <RequestMaterial
          material={showRequestModal}
          onClose={() => setShowRequestModal(null)}
          onSuccess={handleRequestSuccess}
        />
      )}
    </div>
  );
};