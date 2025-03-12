import { Link } from "react-router-dom";
function Header() {
    return (
        <>
            <nav className="bg-gray-800">
                <div className="mx-auto max-w-7xl px-2 px-24">
                    <div className="flex items-center justify-around p-2">
                        <Link to="/" className="flex shrink-0 items-center mr-2">
                            <img className="h-8 w-auto" src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500" alt="Your Company" />
                        </Link>
                        <Link to="/camera" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Camera</Link>
                        <Link to="/record" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Record</Link>
                        <Link to="/detail" className=" flex-1 rounded-md px-3 py-2 text-lg font-medium text-gray-300 hover:bg-gray-700 hover:text-white text-center">Detail</Link>
                    </div>
                </div>
            </nav>
        </>
    );
}
export default Header;  