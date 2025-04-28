import { Routes, Route } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Camera from "../pages/Camera";
import Detail from "../pages/Detail";
import DetectFace from "../pages/DetectFace";
function AllRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/camera" element={<Camera />} />
                <Route path="/detail" element={<Detail />} />
                <Route path="/detect-face" element={<DetectFace />} />
            </Route>
        </Routes>
    );
}

export default AllRoutes;