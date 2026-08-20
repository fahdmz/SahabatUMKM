import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import InputTextTemplate from "../components/InputTextTemplate";
import Button from "../components/Button";
import { motion } from "motion/react";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();

        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
            return;
        }

        navigate("/Beranda");
    }

    return (
        <>
            <div className="min-h-screen flex items-center justify-center">

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: "easeOut"
                    }}
                    className="flex w-[95%] max-w-300 min-h-145 rounded-[40px] overflow-hidden shadow-2xl"
                >

                    {/* GREEN SIDE */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.2,
                            ease: "easeOut"
                        }}
                        className="flex flex-col flex-1 bg-green-700 p-12"
                    >
                        <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4, duration: 0.5 }}
                            className="text-4xl font-extrabold text-white mt-4"
                        >
                            Sahabat UMKM
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="mt-2 font-bold text-xl text-gray-300"
                        >
                            Catat jualan jadi gampang, Ibu makin tenang
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="flex flex-col gap-5 text-white font-bold mt-50 text-xl"
                        >
                            <p>Tahu untung tiap hari</p>
                            <p>Lihat menu paling laris</p>
                            <p>Rapor bisnis otomatis</p>
                        </motion.div>
                    </motion.div>


                    {/* LOGIN SIDE */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                            duration: 0.6,
                            delay: 0.3,
                            ease: "easeOut"
                        }}
                        className="flex-1 bg-white p-12 flex flex-col justify-center"
                    >

                        <motion.h2
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="text-4xl font-extrabold"
                        >
                            Selamat Datang!
                        </motion.h2>

                        <motion.h1
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="text-xl font-bold text-gray-400"
                        >
                            Login ke akun bisnis mu!
                        </motion.h1>


                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                            className="mt-10"
                        >
                            <InputTextTemplate
                                lable="EMAIL"
                                type="text"
                                placeholder="emailanda@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />

                            <InputTextTemplate
                                lable="KATA SANDI"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            {error && (
                                <p className="mt-3 text-sm font-bold text-red-500">
                                    {error}
                                </p>
                            )}
                            <div className="flex flex-col justify-center mt-10">

                                <motion.button
                                    whileHover={{
                                        scale: 1.02
                                    }}
                                    whileTap={{
                                        scale: 0.97
                                    }}
                                    transition={{
                                        duration: 0.15
                                    }}
                                    onClick={handleLogin}
                                    disabled={loading}
                                    className="flex flex-1 items-center justify-center py-4 rounded-xl font-bold bg-green-700 text-white"
                                >
                                    {loading ? "Memuat..." : "Masuk Sekarang"}
                                </motion.button>


                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1, duration: 0.5 }}
                                    className="flex flex-col items-center justify-center mt-10"
                                >
                                    <h1 className="font-bold text-xs text-gray-500 mb-4">
                                        Belum Punya Akun?
                                    </h1>

                                    <Button
                                        children="Daftar Akun Baru"
                                        bgColor="white"
                                        textColor="text-green-700"
                                        borderColor="border-green-700"
                                        font="font-bold"
                                    />
                                </motion.div>

                            </div>
                        </motion.div>

                    </motion.div>

                </motion.div>
            </div>
        </>
    );
}

export default Login;