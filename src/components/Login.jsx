import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useAuthContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) navigate("/dashboard");
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-sm border border-gray-200">

        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          Inicia sesión
        </h1>

        <p className="text-gray-500 text-center mt-2 mb-6">
          Accede a tu cuenta para continuar
        </p>

        {error && (
          <p className="text-red-500 bg-red-100 p-2 mb-4 rounded text-center text-sm">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-gray-700 text-sm">Correo</label>
            <input
              type="email"
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-400 transition text-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-gray-700 text-sm">Contraseña</label>
            <input
              type="password"
              className="w-full mt-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-0 focus:border-gray-400 transition text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gray-900 text-white hover:bg-black transition font-medium"
          >
            {loading ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6 text-sm">
          ¿No tienes una cuenta?
          <Link className="text-gray-900 font-medium hover:underline ml-1" to="/register">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
};
