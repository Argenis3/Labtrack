import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuthContext } from "../context/AuthContext";

export default function MyRequests () {
  const { user } = useAuthContext();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const fetchReq = async () => {
      const q = query(
        collection(db, "requests"),
        where("userId", "==", user.uid)
      );

      const snap = await getDocs(q);
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    };

    fetchReq();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">Mis Solicitudes</h1>

      {requests.map((r) => (
        <div key={r.id} className="border p-4 rounded my-2">
          <p><strong>Material:</strong> {r.materialId}</p>
          <p><strong>Estado:</strong> {r.status}</p>
          <p>{r.startDate} → {r.endDate}</p>
        </div>
      ))}
    </div>
  );
};


