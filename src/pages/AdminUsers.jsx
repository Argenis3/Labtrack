import React from "react";
import { Navbar } from "../components/Navbar";
import { Users } from "../components/Users";

export const AdminUsers = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Lista de Usuarios Registrados
        </h1>
        <Users />
      </div>
    </>
  );
};
