import NavBar from "../components/Navbar";
import { motion } from "motion/react";
import GradeCards from "../components/gradeCards";

function RaporBisnis() {
    const navItems = [
        { label: "Beranda", href: "/Beranda" },
        { label: "Menu Laku", href: "/MenuLaku" },
        { label: "Rapor", href: "/RaporBisnis" },
    ];
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.5,
                    ease: "easeOut",
                }}
            >
                <NavBar items={navItems} />
            </motion.div>

            <main className="mx-auto max-w-7xl px-6 pb-20 lg:px-12">
                <div className="flex flex-col mt-20">
                    <h1 className="text-4xl font-extrabold">Rapor Juli</h1>
                    <p className=" text-gray-400 font-bold">Rabu, 19 Agustus</p>

                    <div className="flex justify-between mx-20 my-20">
                        <div>
                            <h2 className="text-4xl font-extrabold">Rapor Bisnis Juli</h2>
                            <h1 className="text-xl font-bold mt-2 text-gray-400">Ibarat raport sekolah, ini raport warung ibu</h1>
                        </div>
                        <div className="flex justify-center items-center px-5 py-4 bg-black rounded-4xl">
                            <h1 className="text-green-700 text-6xl font-extrabold">B</h1>
                        </div>
                    </div>

                    <div className="p-20 bg-black rounded-4xl">

                        <div className="p-3 bg-gray-700 rounded-4xl">
                            <h1 className="text-gray-400 font-extrabold">KABAR BULAN INI</h1>
                        </div>

                        <p className="text-white text-4xl font-bold mt-10">
                            Bulan Juli kemarin warung Ibu makin rapi catatannya. Untungnya naik, tapi ada satu hal kecil buat dicek lagi.
                        </p>
                    </div>
                    <div className="flex jusitfy-center items-center mt-10"><GradeCards /></div>

                </div>

            </main >
        </>
    )

}


export default RaporBisnis;