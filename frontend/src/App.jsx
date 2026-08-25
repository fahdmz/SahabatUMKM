//import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Beranda from './pages/Beranda'
import MenuLaku from "./pages/MenuLaku";
import Login from "./pages/Login";
import RaporBisnis from "./pages/RaporBisnis";
import CatatBelanja from "./pages/CatatBelanja";
import Catatan from "./pages/Catatan";
import BelumAdaData from "./pages/Beranda_BelumAdaData";
import MulaiCatat from "./pages/MulaiCatat";
import NotificationCard from "./components/NotificationCard";
import GrafikBisnis from "./pages/GrafikBisnis";
function App() {

  return (
    <BrowserRouter>
      <div className="bg-[#f5f2eb]">
        <Routes>
          <Route path="/Beranda" element={<Beranda />} />
          <Route path="/MenuLaku" element={<MenuLaku />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/RaporBisnis" element={<RaporBisnis />} />
          <Route path="/Beranda/CatatBelanja" element={<CatatBelanja />} />
          <Route path="/Beranda/Catatan" element={<Catatan />} />
          <Route path="/Beranda/BelumAdaData" element={<BelumAdaData />} />
          <Route path="/Beranda/MulaiCatat" element={<MulaiCatat />} />
          <Route path="/GrafikBisnis" element={<GrafikBisnis />} />
          {/* <Route path="/NotificationCardTest" element={<NotificationCard />} /> */}


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
