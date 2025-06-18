import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";

const Home = () => {
  const roleUser = localStorage.getItem("role");
  const ws = useRef<WebSocket | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");

  if (localStorage.getItem("isHouseId") === "true") {
    return <Navigate to="/detect-face" replace />;
  }

  useEffect(() => {
    ws.current = new WebSocket(
      `${import.meta.env.VITE_APP_SOCKET_URL}/admin_user`
    );

    ws.current.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  const handleSend = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      const username = localStorage.getItem("username");
      if (username) {
        ws.current.send(username);
        setShowForm(true); // Sau khi gửi username thì hiện form nhập code
      }
    }
  };

  const handleSubmitCode = async () => {
    console.log("Code submitted:", code);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/check_house_code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: localStorage.getItem("username"),
            code: code,
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert("" + result.message);
        // localStorage.setItem("isHouseId", "true");
        window.location.href = "/detect-face";
      } else {
        alert("Lỗi: " + result.detail);
      }
    } catch (error) {
      console.error("Lỗi khi gửi mã xác thực:", error);
      alert("Lỗi khi gửi mã xác thực!");
    }
  };

  return roleUser === "new_user" ? (
    <div className="h-screen flex flex-col justify-center items-center gap-4">
      {!showForm && (
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          onClick={handleSend}
        >
          Request admin
        </button>
      )}

      {showForm && (
        <div className="flex flex-col items-center gap-2">
          <input
            type="text"
            placeholder="Enter code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border px-4 py-2 rounded"
          />
          <button
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            onClick={handleSubmitCode}
          >
            Submit Code
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-2">
      <input
        type="text"
        placeholder="Enter code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="border px-4 py-2 rounded"
      />
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        onClick={handleSubmitCode}
      >
        Submit Code
      </button>
    </div>
  );
};

export default Home;
