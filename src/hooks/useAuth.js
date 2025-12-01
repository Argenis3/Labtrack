import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userName, setUserName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✔ Mantener sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role);
          setUserName(data.name);
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setUserRole(null);
        setUserName(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⭐ REGISTRO FINAL, LIMPIO Y FUNCIONAL ⭐
  const register = async (payload) => {
    try {
      setError(null);

      const {
        email,
        password,
        role,
        name,
        lastName,
        matricula,
        carrera,
      } = payload;

      // 1) Crear usuario en Auth
      const res = await createUserWithEmailAndPassword(auth, email, password);
      const uid = res.user.uid;

      // 2) Construir objeto FINAL asegurando que no haya undefined
      const userData = {
        uid,
        email,
        role,
        name,
        lastName,
        createdAt: Date.now(),
        matricula: role === "student" ? matricula : "",
        carrera: role === "student" ? carrera : "",
      };

      // 3) Guardar en Firestore
      await setDoc(doc(db, "users", uid), userData);

      setUserRole(role);
      setUserName(name);

      return { success: true };
    } catch (err) {
      console.error("Error al registrar usuario:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ✔ LOGIN
  const login = async (email, password) => {
    try {
      setError(null);

      const res = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, "users", res.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserRole(data.role);
        setUserName(data.name);
      }

      return { success: true, user: res.user };
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  // ✔ LOGOUT
  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
      setUserRole(null);
      setUserName(null);
      return { success: true };
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  return {
    user,
    userRole,
    userName,
    loading,
    error,
    register,
    login,
    logout,
  };
};
