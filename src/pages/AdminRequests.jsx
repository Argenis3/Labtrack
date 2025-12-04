import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "../config/firebase";

export default function AdminRequests ()  {
  const [requests, setRequests] = useState([]);

  const fetchReq = async () => {
    const snap = await getDocs(collection(db, "requests"));
    setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  const updateStatus = async (id, status) => {
    await updateDoc(doc(db, "requests", id), { status });
    fetchReq();
  };

  useEffect(() => {
    fetchReq();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Solicitudes Pendientes</h1>

      {requests
        .filter((r) => r.status === "pending")
        .map((r) => (
          <div key={r.id} className="border p-4 my-2 rounded">
            <p><strong>Usuario:</strong> {r.userId}</p>
            <p><strong>Material:</strong> {r.materialId}</p>

            <button onClick={() => updateStatus(r.id, "approved")} className="bg-green-500 text-white px-4 py-1 rounded mr-2">
              Aprobar
            </button>

            <button onClick={() => updateStatus(r.id, "rejected")} className="bg-red-500 text-white px-4 py-1 rounded">
              Rechazar
            </button>
          </div>
        ))}
    </div>
  );
};

