import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export const Navbar = () => {
    const { user, logout, userRole } = useAuthContext();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

  return (
    <>
    <nav className="bg-gray-800 p-4 text-white flex justify-between items-center">
        <div>
            <Link to="/dashboard" className="text-white font-bold text-lg">Dashboard</Link>
        </div>
        {userRole === "admin" && (
            <div>
                <Link to="/admin" className="text-white font-bold text-lg">Admin Panel</Link>
            </div>
        )}
        <div>
            <span className="mr-4">Rol: {userRole}</span>
            <span className="mr-4">Hola, {user.displayName}</span>
            <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                Logout
            </button>
        </div>
    </nav>
    </>
  )
}