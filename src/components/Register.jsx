// src/pages/Register.jsx
import { useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const { register, error } = useAuthContext();
  const navigate = useNavigate();

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    lastName: "",
    matricula: "",
    carrera: "",
    role: "student", // student | admin
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    const payload = {
      email: formData.email,
      password: formData.password,
      name: formData.name,
      lastName: formData.lastName,
      role: formData.role,
    };

    // Si es usuario normal → agregar datos adicionales
    if (formData.role === "student") {
      payload.matricula = formData.matricula;
      payload.carrera = formData.carrera;
    }

    const res = await register(payload);

    if (res.success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">
        Crear cuenta
      </h2>

      <form onSubmit={handleRegister} className="space-y-4">

        {/* Nombre */}
        <div>
          <label className="block font-medium">Nombre</label>
          <input
            type="text"
            name="name"
            className="w-full p-2 border rounded"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        {/* Apellido */}
        <div>
          <label className="block font-medium">Apellido</label>
          <input
            type="text"
            name="lastName"
            className="w-full p-2 border rounded"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block font-medium">Correo</label>
          <input
            type="email"
            name="email"
            className="w-full p-2 border rounded"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block font-medium">Contraseña</label>
          <input
            type="password"
            name="password"
            className="w-full p-2 border rounded"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {/* Selección de rol */}
        <div>
          <label className="block font-medium">Tipo de usuario</label>
          <select
            name="role"
            className="w-full p-2 border rounded"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="student">Usuario (Estudiante)</option>
            <option value="admin">Administrador</option>
          </select>
        </div>

        {/* Campos EXCLUSIVOS del rol = student */}
        {formData.role === "student" && (
          <>
            <div>
              <label className="block font-medium">Matrícula</label>
              <input
                type="text"
                name="matricula"
                className="w-full p-2 border rounded"
                value={formData.matricula}
                onChange={handleChange}
                required={formData.role === "student"}
              />
            </div>

            <div>
              <label className="block font-medium">Carrera</label>
              <input
                type="text"
                name="carrera"
                className="w-full p-2 border rounded"
                value={formData.carrera}
                onChange={handleChange}
                required={formData.role === "student"}
              />
            </div>
          </>
        )}

        {/* Error */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Botón */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
        >
          Registrar
        </button>
      </form>
    </div>
  );
};

export default Register;
