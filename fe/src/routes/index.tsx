import { Routes, Route } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Camera from "../pages/Camera";
import Control from "../pages/Control";
import DetectFace from "../pages/DetectFace";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ScanFace from "../pages/ScanFace";
function AllRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/camera" element={<Camera />} />
                <Route path="/control" element={<Control />} />
                <Route path="/detect-face" element={<DetectFace />} />
                <Route path="/scan-face" element={<ScanFace />} />
            </Route>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            {/* 404 Not Found */}
            <Route path="*" element={<div>404 Not Found</div>} />
        </Routes>
    );
}

export default AllRoutes;