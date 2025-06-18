import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

const PrivateRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<
    boolean | string | null
  >(null);
  const location = useLocation();

  useEffect(() => {
    const username = localStorage.getItem("username");

    if (!username) {
      setIsAuthenticated(false);
    } else {
      const getuser = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/getuser?username=${username}
            `,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          const data = await res.json();
          console.log("data", data);
          if (res.ok) {
            setIsAuthenticated(data.role);
            localStorage.setItem("isHouseId", data.isHouseId);
            localStorage.setItem("role", data.role);
          } else {
            setIsAuthenticated(false);
            localStorage.removeItem("isHouseId");
            localStorage.removeItem("role");
            localStorage.removeItem("username");
          }
        } catch (err) {
          console.error("Error logging in:", err);
          setIsAuthenticated(false);
        }
      };

      getuser();
    }
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }
  // alert("chưa có isHouse");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isAuthenticated === "admin") {
    if (location.pathname === "/") {
      return <Navigate to="/manage" replace />;
    }
    if (location.pathname !== "/manage" && location.pathname !== "/manage-user") {
      return <div>404 Not Found</div>;
    }
    return <Outlet />;
  }

  // Ngược lại: user không phải admin
  if (location.pathname === "/manage" || location.pathname === "/manage-user" ) {
    return <div>404 Not Found</div>;
  }
  if (localStorage.getItem("isHouseId") === "false") {
    if (location.pathname !== "/") {
      return <Navigate to="/" replace />;
    }
    <Outlet />;
  }

  return <Outlet />;
};

export default PrivateRoute;
