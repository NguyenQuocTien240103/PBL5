import { Link } from "react-router-dom";
import { useState } from "react";
function Header() {
    const [userMenuOpen, setUserMenuOpen] = useState<boolean>(false);
    return (
        <>
            <nav className="bg-gray-800">
                <div className="mx-auto max-w-7xl px-2 px-24">
                    <div className="flex items-center justify-around p-2">
                        <Link to="/" className="flex shrink-0 items-center mr-2">
                            <img className="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
                        </Link>
                        <Link to="/camera" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Camera</Link>
                        <Link to="/control" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Control</Link>
                        <Link to="/detect-face" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Detect Face</Link>

                        <div className="relative ml-3">
                                <div>
                                    <button
                                        type="button"
                                        className="relative flex rounded-full bg-gray-800 text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none"
                                        id="user-menu-button"
                                        aria-expanded="false"
                                        aria-haspopup="true"
                                        onClick={() => {
                                            setUserMenuOpen(!userMenuOpen);
                                        }}
                                    >
                                        <span className="absolute -inset-1.5"></span>
                                        <span className="sr-only">Open user menu</span>
                                        <img
                                            className="size-8 rounded-full"
                                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                                            alt=""
                                        />
                                    </button>
                                </div>

                                {/* Dropdown menu */}
                            
                             {userMenuOpen &&
                                    <div
                                    className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
                                    role="menu"
                                    aria-orientation="vertical"
                                    aria-labelledby="user-menu-button"
                                    tabIndex={-1}
                                    onClick={() => {
                                        setUserMenuOpen(false);
                                    }}
                                >
                                    <Link
                                        to="scan-face"
                                        className="block px-4 py-2 text-sm text-gray-700"
                                        role="menuitem"
                                        tabIndex={-1}
                                        id="user-menu-item-0"
                                    >
                                        Scan face
                                    </Link>
                                    <Link
                                        to="/login"
                                        className="block px-4 py-2 text-sm text-gray-700"
                                        role="menuitem"
                                        tabIndex={-1}
                                        id="user-menu-item-2"
                                    >
                                        Log out
                                    </Link>
                                </div>
                             }
                        </div>
                    </div>
                </div>
            </nav>
        </>
    );
}
export default Header;