import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import MaterialCard from "../components/MaterialCard";

export default function Materials() {
  const [materials, setMaterials] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchMaterials = async () => {
      const querySnapshot = await getDocs(collection(db, "materials"));
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setMaterials(items);
    };

    fetchMaterials();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">📦 Catálogo de Materiales</h1>

      <input
        type="text"
        placeholder="Buscar material..."
        className="border p-2 rounded mb-6 w-full"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials
          .filter((m) =>
            m.name.toLowerCase().includes(filter.toLowerCase())
          )
          .map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
      </div>
    </div>
  );
}
