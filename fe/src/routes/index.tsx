import { Routes, Route } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Camera from "../pages/Camera";
import Record from "../pages/Record";
import Detail from "../pages/Detail";
function AllRoutes() {
    return (
        <Routes>
            <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/camera" element={<Camera />} />
                <Route path="/record" element={<Record />} />
                <Route path="/detail" element={<Detail />} />
            </Route>
        </Routes>
    );
}

export default AllRoutes;