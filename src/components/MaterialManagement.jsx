// src/components/MaterialManagement.jsx
import React, { useState, useEffect } from "react";
import { db, storage } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

export const MaterialManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [uploading, setUploading] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    quantity: 0,
    location: "",
    status: "available", // available, in-use, maintenance, unavailable
    imageFile: null,
  });

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
      alert("Error al cargar los materiales");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La imagen no debe superar los 5MB");
        return;
      }
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona una imagen válida");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));
    }
  };

  const uploadImage = async (file, materialId) => {
    const storageRef = ref(storage, `materials/${materialId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const materialData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        quantity: parseInt(formData.quantity),
        location: formData.location,
        status: formData.status,
        updatedAt: serverTimestamp(),
      };

      if (editingMaterial) {
        // Actualizar material existente
        const materialRef = doc(db, "materials", editingMaterial.id);

        // Si hay nueva imagen, subirla
        if (formData.imageFile) {
          // Eliminar imagen anterior si existe
          if (editingMaterial.imageURL) {
            try {
              const oldImageRef = ref(storage, editingMaterial.imagePath);
              await deleteObject(oldImageRef);
            } catch (error) {
              console.log("Error al eliminar imagen anterior:", error);
            }
          }

          const imageURL = await uploadImage(
            formData.imageFile,
            editingMaterial.id
          );
          materialData.imageURL = imageURL;
          materialData.imagePath = `materials/${editingMaterial.id}/${formData.imageFile.name}`;
        }

        await updateDoc(materialRef, materialData);
        alert("Material actualizado exitosamente");
      } else {
        // Crear nuevo material
        materialData.createdAt = serverTimestamp();

        const docRef = await addDoc(collection(db, "materials"), materialData);

        // Si hay imagen, subirla
        if (formData.imageFile) {
          const imageURL = await uploadImage(formData.imageFile, docRef.id);
          await updateDoc(doc(db, "materials", docRef.id), {
            imageURL,
            imagePath: `materials/${docRef.id}/${formData.imageFile.name}`,
          });
        }

        alert("Material agregado exitosamente");
      }

      // Limpiar formulario y cerrar modal
      resetForm();
      setShowModal(false);
      await fetchMaterials();
    } catch (error) {
      console.error("Error al guardar material:", error);
      alert("Error al guardar el material: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      description: material.description,
      category: material.category,
      quantity: material.quantity,
      location: material.location,
      status: material.status,
      imageFile: null,
    });
    setShowModal(true);
  };

  const handleDelete = async (material) => {
    if (
      !window.confirm(
        `¿Estás seguro de eliminar el material "${material.name}"?`
      )
    ) {
      return;
    }

    try {
      // Eliminar imagen si existe
      if (material.imagePath) {
        try {
          const imageRef = ref(storage, material.imagePath);
          await deleteObject(imageRef);
        } catch (error) {
          console.log("Error al eliminar imagen:", error);
        }
      }

      // Eliminar documento
      await deleteDoc(doc(db, "materials", material.id));
      alert("Material eliminado exitosamente");
      await fetchMaterials();
    } catch (error) {
      console.error("Error al eliminar material:", error);
      alert("Error al eliminar el material");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      quantity: 0,
      location: "",
      status: "available",
      imageFile: null,
    });
    setEditingMaterial(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  // Filtrar materiales
  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || material.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-xl">Cargando materiales...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Materiales</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition"
        >
          + Agregar Material
        </button>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por categoría
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid de materiales */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500 text-lg">No se encontraron materiales</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
            >
              {/* Imagen */}
              <div className="h-48 bg-gray-200 overflow-hidden">
                {material.imageURL ? (
                  <img
                    src={material.imageURL}
                    alt={material.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-20 h-20"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Contenido */}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {material.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      material.status === "available"
                        ? "bg-green-100 text-green-800"
                        : material.status === "in-use"
                        ? "bg-blue-100 text-blue-800"
                        : material.status === "maintenance"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {statusOptions.find((s) => s.value === material.status)
                      ?.label || material.status}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {material.description}
                </p>

                <div className="space-y-1 text-sm text-gray-600 mb-4">
                  <p>
                    <span className="font-medium">Categoría:</span>{" "}
                    {material.category}
                  </p>
                  <p>
                    <span className="font-medium">Cantidad:</span>{" "}
                    {material.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Ubicación:</span>{" "}
                    {material.location}
                  </p>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(material)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(material)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal para agregar/editar material */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingMaterial ? "Editar Material" : "Agregar Nuevo Material"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Material *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Categoría y Cantidad */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Ubicación y Estado */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      placeholder="Ej: Laboratorio A, Estante 3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Imagen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Material
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.imageFile && (
                    <p className="text-sm text-green-600 mt-1">
                      Archivo seleccionado: {formData.imageFile.name}
                    </p>
                  )}
                  {editingMaterial?.imageURL && !formData.imageFile && (
                    <div className="mt-2">
                      <img
                        src={editingMaterial.imageURL}
                        alt="Imagen actual"
                        className="w-32 h-32 object-cover rounded"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Imagen actual
                      </p>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    disabled={uploading}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {uploading
                      ? "Guardando..."
                      : editingMaterial
                      ? "Actualizar"
                      : "Agregar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};