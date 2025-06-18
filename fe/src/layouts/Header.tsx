import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

function Header() {
  const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username"); // Xóa username khỏi localStorage
    localStorage.removeItem("isHouseId");
    localStorage.removeItem("role");
    setUserMenuOpen(false); // Đóng menu
    navigate("/login"); // Chuyển hướng đến trang đăng nhập
  };

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-2 px-24">
        <div className="flex items-center justify-around p-2">
          {/* <Link to="/" className="flex shrink-0 items-center mr-2">
            <img
              className="h-8 w-auto"
              src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
              alt="Your Company"
            />
          </Link> */}
          <Link
            to="/camera"
            className="flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center"
          >
            Camera
          </Link>
          <Link
            to="/control"
            className="flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center"
          >
            Control
          </Link>
          <Link
            to="/detect-face"
            className="flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center"
          >
            Detect Face
          </Link>

          <div className="relative ml-3">
            <button
              type="button"
              className="relative flex rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
              id="user-menu-button"
              aria-expanded="false"
              aria-haspopup="true"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <img
                className="size-8 rounded-full"
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                alt=""
              />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <Link
                  to="/video"
                  className="block px-4 py-2 text-sm text-gray-700"
                  role="menuitem"
                  tabIndex={-1}
                  id="user-menu-item-0"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Video storage
                </Link>
                <Link
                  to="/scan-face"
                  className="block px-4 py-2 text-sm text-gray-700"
                  role="menuitem"
                  tabIndex={-1}
                  id="user-menu-item-0"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Scan face
                </Link>
                {localStorage.getItem("role") === "new_user" && (
                  <Link
                    to="/datetime"
                    className="block px-4 py-2 text-sm text-gray-700"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-0"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Set time
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 cursor-pointer"
                  role="menuitem"
                  tabIndex={-1}
                  id="user-menu-item-2"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
