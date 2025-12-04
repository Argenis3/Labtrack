import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "../config/firebase";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AddMaterial() {
  const { userRole } = useAuthContext();
  const navigate = useNavigate();

  if (userRole !== "admin") {
    return <p className="text-center mt-8 text-red-500">Acceso denegado.</p>;
  }

  const [form, setForm] = useState({
    name: "",
    descripcion: "",
    cantidadDisponible: 0
  });

  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = "";

    if (file) {
      const storage = getStorage();
      const storageRef = ref(storage, `materials/${file.name}`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "materials"), {
      ...form,
      cantidadDisponible: Number(form.cantidadDisponible),
      imageUrl
    });

    alert("Material agregado correctamente");
    navigate("/inventory");
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4">Agregar nuevo material</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="Nombre"
          className="w-full border p-2 mb-3"
          onChange={handleChange}
        />

        <textarea
          name="descripcion"
          placeholder="Descripción"
          className="w-full border p-2 mb-3"
          onChange={handleChange}
        />

        <input
          name="cantidadDisponible"
          type="number"
          placeholder="Cantidad disponible"
          className="w-full border p-2 mb-3"
          onChange={handleChange}
        />

        <input
          type="file"
          className="mb-3"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button className="bg-blue-600 text-white p-2 w-full rounded">
          Guardar Material
        </button>
      </form>
    </div>
  );
}
