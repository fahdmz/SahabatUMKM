//import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Beranda from './pages/Beranda'
import MenuLaku from "./pages/MenuLaku";
import Login from "./pages/Login";
import RaporBisnis from "./pages/RaporBisnis";
import CatatBelanja from "./pages/CatatBelanja";
function App() {

  return (
    <BrowserRouter>
      <div className="bg-amber-50">
        <Routes>
          <Route path="/Beranda" element={<Beranda />} />
          <Route path="/MenuLaku" element={<MenuLaku />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/RaporBisnis" element={<RaporBisnis />} />
          <Route path="/Beranda/CatatBelanja" element={<CatatBelanja />} />

          <Route
            path="*"
            element={<Navigate to="/Beranda" replace />}
          />
        </Routes>
      </div>

    </BrowserRouter>
  )
}

export default App
