import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export const Navbar = () => {
    const { user, logout } = useAuthContext();

    return (
        <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-600">LabTrack</h1>

            <div className="flex gap-4 items-center">
                <Link to="/dashboard" className="hover:text-blue-500">Dashboard</Link>
                <Link to="/tasks" className="hover:text-blue-500">Tareas</Link>
                {user ? (
                    <button
                        onClick={logout}
                        className="bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition"
                    >
                        Cerrar sesión
                    </button>
                ) : (
                    <Link to="/login" className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition">
                        Iniciar sesión
                    </Link>
                )}
            </div>
        </nav>
    );
};
