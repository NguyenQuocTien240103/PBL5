import { useEffect, useRef, useState } from "react";

const Manage = () => {
  const ws = useRef<WebSocket | null>(null);
  const [userList, setUserList] = useState<any[]>([]); // bạn có thể tạo type riêng nếu cần

  const getAllUserVerifyCode = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/all_user_verify_code`
      );

      if (!response.ok) {
        throw new Error("Fetch failed with status " + response.status);
      }

      const data = await response.json();
      console.log("Dữ liệu từ server:", data);
      setUserList(data.data); // lưu danh sách vào state
    } catch (error) {
      console.error("Lỗi khi fetch dữ liệu:", error);
      setUserList([]);
    }
  };

  useEffect(() => {
    getAllUserVerifyCode();

    ws.current = new WebSocket(
      `${import.meta.env.VITE_APP_SOCKET_URL}/admin_user`
    );

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      const username = localStorage.getItem("username");
      if (username) {
        ws.current?.send(username);
      }
    };

    ws.current.onmessage = async (event) => {
      console.log("Message from server:", event.data);
      const username = event.data;

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/user_verify_code?username=${username}`
        );

        if (!response.ok) {
          throw new Error("Lỗi khi gọi API: " + response.status);
        }

        const result = await response.json();
        console.log("Kết quả từ API:", result);

        // Cập nhật lại danh sách nếu có user mới hoặc update
        setUserList((prevList) => {
          const updated = prevList.filter((user) => user.username !== username);
          return [...updated, result.data];
        });
      } catch (error) {
        console.error("Lỗi khi fetch user:", error);
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.current?.close();
    };
  }, []);
  const handleOk = async (user: any) => {
    console.log(user);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/admin_send_code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message); // Ví dụ: Send code successful
        getAllUserVerifyCode();
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi khi gửi mã xác thực:", error);
      alert("Lỗi khi gửi mã xác thực!");
    }
  };

  const handleCancel = async (user: any) => {
    console.log(user);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/del_user_verify_code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: user.email }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        alert(result.message); // Ví dụ: Send code successful
        getAllUserVerifyCode();
      } else {
        alert("Lỗi: " + result.message);
      }
    } catch (error) {
      console.error("Lỗi khi gửi mã xác thực:", error);
      alert("Lỗi khi gửi mã xác thực!");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">
        List User Verify Code
      </h1>

      <ul>
        {userList.map((user, index) => (
          <li
            key={index}
            className="bg-gray-100 rounded-md p-4 mb-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-lg font-semibold text-gray-800">
              Username:
              <span className="font-normal text-gray-600">{user.username}</span>
            </p>
            <p className="text-lg font-semibold text-gray-800">
              Email:
              <span className="font-normal text-gray-600">{user.email}</span>
            </p>
            <div className="mt-4 flex gap-2">
              <button
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                onClick={() => handleOk(user)}
              >
                OK
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                onClick={() => handleCancel(user)}
              >
                Cancel
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Manage;
