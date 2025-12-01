import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const { register } = useAuthContext();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(email, password);
        if (!result.success) setError(result.error);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-purple-100 to-blue-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md animate-fadeIn">
                <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Crear Cuenta</h2>

                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-400 transition"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-2">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-purple-400 transition"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
                    >
                        Registrarme
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-600">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-purple-600 font-bold hover:underline">
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};
