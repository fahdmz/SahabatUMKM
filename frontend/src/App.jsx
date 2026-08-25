//import './App.css'
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

const Beranda = lazy(() => import("./pages/Beranda"));
const MenuLaku = lazy(() => import("./pages/MenuLaku"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const RaporBisnis = lazy(() => import("./pages/RaporBisnis"));
const CatatBelanja = lazy(() => import("./pages/CatatBelanja"));
const Catatan = lazy(() => import("./pages/Catatan"));
const BelumAdaData = lazy(() => import("./pages/Beranda_BelumAdaData"));
const MulaiCatat = lazy(() => import("./pages/MulaiCatat"));
const GrafikBisnis = lazy(() => import("./pages/GrafikBisnis"));
const KelolaMenu = lazy(() => import("./pages/KelolaMenu"));

function RouteLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb]">
      <p className="font-bold text-gray-400">Memuat...</p>
    </div>
  );
}

function App() {

  return (
    <BrowserRouter>
      <div className="bg-[#f5f2eb]">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/Beranda" element={<Beranda />} />
            <Route path="/MenuLaku" element={<MenuLaku />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
            <Route path="/ResetPassword" element={<ResetPassword />} />
            <Route path="/RaporBisnis" element={<RaporBisnis />} />
            <Route path="/Beranda/CatatBelanja" element={<CatatBelanja />} />
            <Route path="/Beranda/Catatan" element={<Catatan />} />
            <Route path="/Beranda/BelumAdaData" element={<BelumAdaData />} />
            <Route path="/Beranda/MulaiCatat" element={<MulaiCatat />} />
            <Route path="/GrafikBisnis" element={<GrafikBisnis />} />
            <Route path="/MenuLaku/Kelola" element={<KelolaMenu />} />

            <Route
              path="*"
              element={<Navigate to="/Beranda" replace />}
            />
          </Routes>
        </Suspense>
      </div>

    </BrowserRouter>
  )
}

export default App
