// src/hooks/useAuth.js
import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

/**
 * Hook personalizado para manejar la autenticación con Firebase
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);   // ⬅ Nuevo
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Escuchar cambios en el estado de autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserName(data.name || null); // ⬅ Nuevo
        }

        setUser(currentUser);
      } else {
        setUser(null);
        setUserRole(null);
        setUserName(null); // ⬅ Nuevo
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Registrar un nuevo usuario
  const register = async (email, password, role = "user", name = "") => {
    try {
      setError(null);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Guardar el rol + nombre del usuario en Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        role,
        email,
        name,              // ⬅ Guardado de nombre
        createdAt: new Date(),
      });

      setUserRole(role);
      setUserName(name);   // ⬅ Guardar nombre en estado

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error al registrar usuario:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      setError(null);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role);
        setUserName(data.name || null); // ⬅ Recuperar nombre
      }

      return { success: true, user: userCredential.user };
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUserRole(null);
      setUserName(null);
      return { success: true };
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setError(error.message);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    userRole,
    userName,     // ⬅ Exportar nombre
    loading,
    error,
    register,
    login,
    logout,
  };
};
