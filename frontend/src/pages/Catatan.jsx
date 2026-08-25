
import { motion } from "motion/react";

import NavBar from "../components/Navbar";
import RiwayatCatatanCards from "../components/RiwayatCatatanCards";
import Button from "../components/Button";
import { Link } from "react-router-dom";

function Catatan() {
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
                staggerChildren: 0.12,
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
                duration: 0.5,
                ease: "easeOut",
            },
        },
    };

    return (
        <div className="min-h-screen bg-[#f5f2eb]">
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

            <main className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="pt-32"
                >
                    {/* PAGE HEADER */}
                    <motion.section variants={itemVariants}>
                        <h1 className="text-5xl font-extrabold tracking-tight text-[#171512]">
                            Riwayat Catatan
                        </h1>

                        <p className="mt-2 text-xl font-bold text-gray-500">
                            Semua yang Ibu catat ada di sini.
                        </p>
                    </motion.section>

                    {/* HISTORY */}
                    <motion.section
                        variants={itemVariants}
                        className="mt-12"
                    >
                        <RiwayatCatatanCards />
                    </motion.section>

                    {/* REPORT CTA */}
                    <motion.section
                        variants={itemVariants}
                        className="mt-20"
                    >
                        <motion.div
                            whileHover={{
                                y: -4,
                                scale: 1.005,
                            }}
                            transition={{
                                type: "spring",
                                stiffness: 250,
                                damping: 20,
                            }}
                            className="flex flex-col gap-8 rounded-3xl bg-[#171512] p-10 shadow-xl md:flex-row md:items-center md:justify-between md:p-12"
                        >
                            {/* TEXT */}
                            <div>
                                <h1 className="text-3xl font-extrabold text-white">
                                    Butuh Rapor Lengkap?
                                </h1>

                                <p className="mt-2 font-bold text-gray-400">
                                    Lihat rangkuman untung rugi Ibu di halaman
                                    Rapor.
                                </p>
                            </div>

                            {/* BUTTON */}
                            <motion.div
                                whileHover={{
                                    scale: 1.04,
                                }}
                                whileTap={{
                                    scale: 0.96,
                                }}
                            >
                                <Link to="/RaporBisnis">
                                    <Button
                                        bgColor="bg-orange-800 text-2xl"
                                        children="Buka Rapor Bisnis"
                                        border={false}
                                        font="font-bold"
                                    />
                                </Link>

                            </motion.div>
                        </motion.div>
                    </motion.section>
                </motion.div>
            </main>
        </div>
    );
}

export default Catatan;

