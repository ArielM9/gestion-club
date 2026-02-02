'use client'
import { type RegisterInput, registerSchema } from '@/lib/validations/auth'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { authClient } from '@/lib/auth-client'

const RegisterPage = () => {

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput> ({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            password: "",
            username: "",
            confirmPassword: ""
        }
    })  

    const onSubmit = handleSubmit( async (data) => {
        const { data: response, error } = await authClient.signUp.email({
            email: data.email,
            password: data.password,
            name: data.username, 
            callbackURL: "/login", // Redirigimos al login, para iniciar sesion
        });

        if (error) {
            alert(error.message);
            return;
        }

        if (response) {
            console.log("Usuario registrado exitosamente", response);
        }
    })
    
  return (
    <div className="flex flex-col items-center justify-center h-screen">
        <form onSubmit={onSubmit} className='flex flex-col gap-2 p-4 rounded text-white'>
            
            <h1 className="text-2xl font-bold mb-4 text-white text-center">Registrarse</h1>

            <input 
                type="text" {...register("username")}
                placeholder="Usuario" 
                className="border rounded p-2 text-white placeholder:text-gray-400"
            />
            {errors.username && <span className="text-red-500">{errors.username.message}</span>}
            
            <input 
                type="email" {...register("email")}
                placeholder="Email" 
                className="border rounded p-2 text-white placeholder:text-gray- 400"
            />
            {errors.email && <span className="text-red-500">{errors.email.message}</span>}
            
            <input 
                type="password" {...register("password")}
                placeholder="Contraseña" 
                className="border rounded p-2 text-white placeholder:text-gray-400"
            />
            {errors.password && <span className="text-red-500">{errors.password.message}</span>}
            
            <input 
                type="password" {...register("confirmPassword" )}
                placeholder="Confirmar Contraseña" 
                className="border rounded p-2 text-white placeholder:text-gray-400"
            />
            {errors.confirmPassword && <span className="text-red-500">{errors.confirmPassword.message}</span>}

            <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-4">Registrarse</button>
        </form>
    </div>
  )
}

export default RegisterPage