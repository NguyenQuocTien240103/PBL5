import { useEffect, useRef, useState } from "react";

const ManageUser = () => {
  const [userList, setUserList] = useState<any[]>([]); // bạn có thể tạo type riêng nếu cần

  useEffect(() => {
    const getOwner = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/get-owner`
        );

        if (!response.ok) {
          throw new Error("Fetch failed with status " + response.status);
        }

        const data = await response.json();
        console.log("Dữ liệu từ server:", data);
        if (Array.isArray(data.data)) {
          setUserList(data.data);
        } else if (typeof data.data === "object" && data.data !== null) {
          setUserList([data.data]);
        } else {
          setUserList([]);
        }
      } catch (error) {
        console.error("Lỗi khi fetch dữ liệu:", error);
        setUserList([]);
      }
    }
    getOwner();
  },[])
  console.log("userList", userList);
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <h1 className="text-3xl font-extrabold text-center text-blue-700 mb-8 tracking-tight drop-shadow">List Owner</h1>
      <ul>
        {userList.map((user, index) => (
          <li
            key={index}
            className="bg-gradient-to-r from-blue-100 to-blue-50 rounded-lg p-5 mb-5 shadow hover:shadow-lg transition-shadow border border-blue-200 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-lg font-bold text-blue-900">Username:</span>
              <span className="font-medium text-blue-700">{user.username}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
              <span className="text-lg font-bold text-blue-900">Email:</span>
              <span className="font-medium text-blue-700">{user.email}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
    )
};

export default ManageUser;
