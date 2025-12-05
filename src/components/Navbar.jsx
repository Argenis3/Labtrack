import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center justify-between">

      <Link to="/" className="text-xl font-semibold text-gray-900 tracking-tight">
        LabTrack
      </Link>

      <div className="flex items-center gap-6">
        <Link className="text-gray-700 hover:text-black transition" to="/dashboard">
          Dashboard
        </Link>



        <Link
          to="/login"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          Cerrar sesión
        </Link>
      </div>
    </nav>
  );
};
