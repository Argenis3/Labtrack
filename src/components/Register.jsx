import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuthContext();

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    matricula: "",
    carrera: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const userData = {
      name: form.name,
      lastName: form.lastName,
      matricula: form.matricula,
      carrera: form.carrera,
    };

    const result = await register(form.email, form.password, userData);

    setLoading(false);

    if (result.success) navigate("/dashboard");
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-200">
        
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Crear cuenta
        </h1>

        <p className="text-gray-500 text-center mt-2 mb-6">
          Regístrate para usar LabTrack
        </p>

        {error && (
          <p className="text-red-500 bg-red-100 p-2 rounded text-center text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="text-gray-700 text-sm">Nombre</label>
            <input
              name="name"
              type="text"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Apellido</label>
            <input
              name="lastName"
              type="text"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.lastName}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Matrícula</label>
            <input
              name="matricula"
              type="text"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.matricula}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Carrera</label>
            <input
              name="carrera"
              type="text"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.carrera}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Correo</label>
            <input
              name="email"
              type="email"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Contraseña</label>
            <input
              name="password"
              type="password"
              className="w-full mt-1 px-4 py-3 border rounded-lg"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gray-900 text-white hover:bg-black transition font-medium"
          >
            {loading ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          ¿Ya tienes una cuenta?
          <Link className="text-gray-900 font-medium hover:underline ml-1" to="/login">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};
