import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/login";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/*Landing page shows Login */}
        <Route path="/" element={<Login />} />

        {/* Other routes can go here later */}
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="*" element={<h1>404 Not Found</h1>} /> */}
      </Routes>
    </BrowserRouter>
  );
}
