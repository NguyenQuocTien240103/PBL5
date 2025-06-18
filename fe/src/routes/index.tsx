import { Routes, Route } from "react-router";
import MainLayout from "../layouts/MainLayout";
import Home from "../pages/Home";
import Camera from "../pages/Camera";
import Control from "../pages/Control";
import DetectFace from "../pages/DetectFace";
import DashboardLayout from "../layouts/DashboardLayout";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ScanFace from "../pages/ScanFace";
import Manage from "../pages/Manage";
import ManageUser from "../pages/ManageUser";
import DateTime from "../pages/DateTime";
import Video from "../pages/Video";
import PrivateRoute from "./PrivateRoute";

function AllRoutes() {
  return (
    <Routes>
      <Route element={<PrivateRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/control" element={<Control />} />
          <Route path="/detect-face" element={<DetectFace />} />
          <Route path="/scan-face" element={<ScanFace />} />
          <Route path="/datetime" element={<DateTime />} />
          <Route path="/video" element={<Video />} />
        </Route>
        <Route element={<DashboardLayout />}>
          <Route path="/manage" element={<Manage />} />
          <Route path="/manage-user" element={<ManageUser />} />
        </Route>
      </Route>

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* 404 Not Found */}
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

export default AllRoutes;
