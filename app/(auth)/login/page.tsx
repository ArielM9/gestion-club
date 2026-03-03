"use client";

import { type LoginInput, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { LogIn, Mail, Lock, Shield } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const onSubmit = handleSubmit(async (data) => {
        const { data: response, error } = await authClient.signIn.email({
            email: data.email,
            password: data.password,
            callbackURL: "/",
        });

        if (error) {
            toast.error(error.message);
            return;
        }

        if (response) {
            console.log("Usuario logueado exitosamente", response);
        }
    });

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Victorianos</h1>
                    <p className="text-slate-400 font-medium mt-2">Club de Rugby</p>
                </div>

                <div className="bg-white rounded-[2rem] shadow-2xl p-8">
                    <h2 className="text-xl font-black text-slate-900 text-center mb-6">Iniciar Sesión</h2>
                    
                    <form onSubmit={onSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    {...register("email")}
                                    placeholder="usuario@email.com"
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-xs font-bold ml-2">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    {...register("password")}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs font-bold ml-2">{errors.password.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
                        >
                            {isSubmitting ? (
                                <span className="animate-spin">⏳</span>
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm font-medium">
                            ¿No tienes cuenta?{" "}
                            <Link href="/register" className="text-blue-600 font-black hover:underline">
                                Registrarse
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
