import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import AngketWizard from "./pages/AngketWizard";
import TerimaKasih from "./pages/TerimaKasih";
import Login from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Periode from "./pages/admin/Periode";
import Respons from "./pages/admin/Respons";
import Rekap from "./pages/admin/Rekap";
import Temuan from "./pages/admin/Temuan";
import Pengguna from "./pages/admin/Pengguna";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/angket/:kode" element={<AngketWizard />} />
        <Route path="/angket/:kode/terima-kasih" element={<TerimaKasih />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="periode" element={<Periode />} />
          <Route path="respons" element={<Respons />} />
          <Route path="rekap" element={<Rekap />} />
          <Route path="temuan" element={<Temuan />} />
          <Route path="pengguna" element={<Pengguna />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
