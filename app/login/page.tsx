"use client";

import { type LoginInput, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {

    const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const onSubmit = handleSubmit( async (data) => {
        const { data: response, error } = await authClient.signIn.email({
            email: data.email,
            password: data.password,
            callbackURL: "/",
        });

        if (error) {
            alert(error.message);
            return;
        }

        if (response) {
            console.log("Usuario logueado exitosamente", response);
        }
    })  

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <form onSubmit={onSubmit} className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold mb-4 text-white text-center">Iniciar Sesión</h1>
                
                <input
                    type="text" {...register("email")} 
                    placeholder="usuario@email.com" 
                    className="border rounded p-2 text-white placeholder:text-gray-400"
                />
                {errors.email && <span className="text-red-500">{errors.email.message}</span>}

                <input 
                    type="password" {...register("password")} 
                    placeholder="********" 
                    className="border rounded p-2 text-white placeholder:text-gray-400"/>
                {errors.password && <span className="text-red-500">{errors.password.message}</span>}
                
                <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-4">Iniciar Sesión</button>
            </form>
        </div> 
    )
}