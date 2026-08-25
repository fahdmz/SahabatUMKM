import { NavLink, Link } from "react-router-dom";
import { motion } from "motion/react";
import Button from "./Button";
function NavBar({ items }) {
    return (
        <motion.nav
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.5,
                ease: "easeOut",
            }}
            className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-lg bg-white px-6 py-5 shadow-lg lg:px-12"
        >
            {/* Logo / Brand */}
            <NavLink
                to="/Beranda"
                className="text-3xl font-bold tracking-tight text-black"
            >
                Sahabat UMKM
            </NavLink>

            {/* Navigation */}
            <div className="flex items-center gap-8">
                {items.map((item) => (
                    <NavLink
                        key={item.label}
                        to={item.href}
                        className={({ isActive }) =>
                            `relative py-2 text-base font-semibold transition-colors duration-200 ${isActive
                                ? "text-green-700"
                                : "text-gray-500 hover:text-green-700"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {item.label}

                                {isActive && (
                                    <motion.div
                                        layoutId="navbar-active"
                                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-green-700"
                                        transition={{
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 30,
                                        }}
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
            <Link to="/Login">
                <Button
                    bgColor="bg-red-200 font-extrabold"
                    textColor="text-red-500"
                    border={false}
                    children="LogOut"
                />
            </Link>
        </motion.nav>
    );
}

export default NavBar;