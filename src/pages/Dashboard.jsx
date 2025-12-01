import React from "react";
import { Navbar } from "../components/Navbar";
import { useAuthContext } from "../context/AuthContext";

export const Dashboard = () => {
  const { user, userRole } = useAuthContext();
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="mb-2">Bienvenido, {user.email}!</p>
        <p className="mb-2">Tu rol es: {userRole}</p>
        <div className="mt-6 p-4 border rounded bg-white shadow">
          <h2 className="text-2xl font-semibold mb-2">Contenido del Dashboard</h2>
          <p>
            Aquí puedes ver información relevante según tu rol de usuario.
          </p>
        </div>
      </div>
    </>
  );
};