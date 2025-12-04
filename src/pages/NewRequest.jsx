import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuthContext } from "../context/AuthContext";

export default function NewRequest () {
  const { id } = useParams();
  const { user } = useAuthContext();
  const navigate = useNavigate();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const sendRequest = async () => {
    await addDoc(collection(db, "requests"), {
      userId: user.uid,
      materialId: id,
      startDate,
      endDate,
      status: "pending",
      createdAt: Timestamp.now(),
    });

    alert("Solicitud creada");
    navigate("/my-requests");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Nueva Solicitud</h1>

      <label className="block mt-4">Inicio</label>
      <input type="date" className="border p-2" onChange={(e) => setStartDate(e.target.value)} />

      <label className="block mt-4">Fin</label>
      <input type="date" className="border p-2" onChange={(e) => setEndDate(e.target.value)} />

      <button
        onClick={sendRequest}
        className="bg-blue-600 text-white p-2 mt-4 rounded"
      >
        Enviar Solicitud
      </button>
    </div>
  );
};


