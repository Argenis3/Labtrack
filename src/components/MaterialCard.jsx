import { useNavigate } from "react-router-dom";

export default function MaterialCard({ material }) {
  const navigate = useNavigate();

  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-md transition bg-white">
      <img
        src={material.image || "/placeholder.png"}
        alt={material.name}
        className="w-full h-40 object-cover rounded"
      />

      <h2 className="text-xl font-semibold mt-3">{material.name}</h2>
      <p className="text-gray-600">Disponibles: {material.cantidadDisponible}</p>

      {/* Botón para ver información */}
      <button
        className="mt-3 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300"
        onClick={() => navigate(`/materials/${material.id}`)}
      >
        Ver Detalles
      </button>

      {/* BOTÓN PARA SOLICITAR */}
      <button
        className="mt-2 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        onClick={() => navigate(`/request/new/${material.id}`)}
      >
        Solicitar Material
      </button>
    </div>
  );
}
