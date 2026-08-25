import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { supabase } from "../lib/supabase";
import InputTextTemplate from "../components/InputTextTemplate";
import Button from "../components/Button";

function ResetPassword() {
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function handleResetPassword() {
        setError("");

        if (password.length < 6) {
            setError("Kata sandi minimal 6 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Kata sandi tidak sama.");
            return;
        }

        setLoading(true);

        const { error: updateError } = await supabase.auth.updateUser({
            password,
        });

        setLoading(false);

        if (updateError) {
            setError(updateError.message);
            return;
        }

        setDone(true);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#f5f2eb] px-6 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md rounded-[40px] bg-white p-10 shadow-2xl md:p-12"
            >
                {done ? (
                    <>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Kata Sandi Diubah!
                        </h1>

                        <p className="mt-3 font-bold text-gray-400">
                            Kata sandi kamu sudah berhasil diganti. Silakan login lagi.
                        </p>

                        <div className="mt-8">
                            <Button
                                children="Ke Halaman Login"
                                bgColor="bg-green-700"
                                textColor="text-white"
                                border={false}
                                font="font-extrabold w-full"
                                onClick={() => navigate("/Login")}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Buat Kata Sandi Baru
                        </h1>

                        <p className="mt-2 font-bold text-gray-400">
                            Isi kata sandi baru untuk akun kamu.
                        </p>

                        <div className="mt-8">
                            <InputTextTemplate
                                lable="KATA SANDI BARU"
                                type="password"
                                placeholder="Minimal 6 karakter"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <div className="mt-6">
                            <InputTextTemplate
                                lable="ULANGI KATA SANDI"
                                type="password"
                                placeholder="Ketik ulang kata sandi baru"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>

                        {error && (
                            <p className="mt-3 text-sm font-bold text-red-500">
                                {error}
                            </p>
                        )}

                        <div className="mt-8">
                            <Button
                                children={loading ? "Menyimpan..." : "Simpan Kata Sandi"}
                                bgColor="bg-green-700"
                                textColor="text-white"
                                border={false}
                                font="font-extrabold w-full"
                                onClick={handleResetPassword}
                            />
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}

export default ResetPassword;
