import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function MaterialDetail () {
  const { id } = useParams();
  const [material, setMaterial] = useState(null);

  useEffect(() => {
    const fetchMaterial = async () => {
      const docRef = doc(db, "materials", id);
      const snap = await getDoc(docRef);

      if (snap.exists()) setMaterial(snap.data());
    };

    fetchMaterial();
  }, [id]);

  if (!material) return <p>Cargando...</p>;

  return (
    <div className="p-6">
      <img
        src={material.imageUrl}
        className="w-full h-64 object-cover rounded"
      />

      <h1 className="text-3xl font-bold mt-4">{material.name}</h1>
      <p className="text-gray-600 mt-2">{material.description}</p>

      <p className="mt-4 text-lg">
        <strong>Stock disponible:</strong> {material.stock}
      </p>

      <Link
        to={`/request/new/${id}`}
        className="bg-green-600 text-white p-3 mt-4 inline-block rounded"
      >
        Solicitar préstamo
      </Link>
    </div>
  );
};

