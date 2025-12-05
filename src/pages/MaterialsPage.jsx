// src/pages/MaterialsPage.jsx
import React from "react";
import { Navbar } from "../components/Navbar";
import { MaterialsCatalog } from "../components/MaterialsCatalog";

export const MaterialsPage = () => {
  return (
    <>
      <Navbar />
      <MaterialsCatalog />
    </>
  );
};