// ...existing code...
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import DB from "./pages/dashBoard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashBoard" element={<DB />} />
        {/* Add additional routes here */}
      </Routes>
    </Router>
  );
}
// ...existing code...