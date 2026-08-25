import NavBar from "../components/Navbar";
import Button from "../components/Button";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

function BelumAdaData() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
        { label: "Grafik Bisnis", href: "/GrafikBisnis" },
    ];

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.15,
            },
        },
    };

    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 25,
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.6,
                ease: "easeOut",
            },
        },
    };

    return (
        <>
            {/* NAVBAR */}
            <motion.div
                initial={{
                    opacity: 0,
                    y: -20,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.5,
                    ease: "easeOut",
                }}
            >
                <NavBar items={navItems} />
            </motion.div>

            {/* CONTENT */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="flex min-h-screen flex-col items-center justify-center"
            >
                {/* TITLE */}
                <motion.h1
                    variants={itemVariants}
                    className="text-center text-6xl font-extrabold"
                >
                    Selamat Datang,
                    <br />
                    Bu Sari!
                </motion.h1>

                {/* DESCRIPTION */}
                <motion.p
                    variants={itemVariants}
                    className="mt-5 text-center text-xl font-extrabold text-gray-500"
                >
                    Aplikasi ini bakal bantu Ibu tahu mana masakan yang
                    paling
                    <br />
                    laku dan berapa untung aslinya tiap hari.
                </motion.p>

                {/* BUTTONS */}
                <motion.div
                    variants={itemVariants}
                    className="flex flex-row gap-5"
                >
                    <Link
                        className="mt-10"
                        to="/Beranda/MulaiCatat"
                    >
                        <Button
                            children="Mulai Catat"
                            bgColor="bg-green-700"
                            font="font-extrabold"
                        />
                    </Link>

                    <Link className="mt-10" to="/Beranda/CatatBelanja">
                        <Button
                            children="Catat Pengeluaran"
                            border={false}
                            textColor="text-white"
                            font="font-extrabold"
                            bgColor="bg-green-700"
                        />
                    </Link>
                </motion.div>

            </motion.div>
        </>
    );
}

export default BelumAdaData;