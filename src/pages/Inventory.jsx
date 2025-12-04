import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export default function Inventory () {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, "materials"));
      setMaterials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetch();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Inventario</h1>

      {materials.map((m) => (
        <div key={m.id} className="border rounded p-3 my-2">
          <p><strong>{m.name}</strong></p>
          <p>Stock: {m.stock}</p>
        </div>
      ))}
    </div>
  );
};

