"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SocioSchema, SocioFormValues } from "@/lib/validations/socio";
import { crearSocioAction } from "@/lib/actions/socios";
import { useRouter } from "next/navigation";
import { User, IdCard, Mail, Phone, Calendar, Loader2, Camera, CreditCard, Users2, MessageSquare, Shirt } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function FormularioSocio({ categorias }: { categorias: any[] }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SocioFormValues>({
    resolver: zodResolver(SocioSchema),
  });

  const fechaNacimiento = watch("fechaNacimiento");
 
  const esMenorDeEdad = (fecha: string) => {
    if (!fecha) return false;
    const hoy = new Date();
    const cumple = new Date(fecha);
    let edad = hoy.getFullYear() - cumple.getFullYear();
    if (hoy < new Date(cumple.setFullYear(hoy.getFullYear()))) edad--;
    return edad < 18;
  };

  const mostrarSeccionTutor = esMenorDeEdad(fechaNacimiento);

  const onSubmit = async (data: SocioFormValues) => {
    setIsPending(true);
    const res = await crearSocioAction(data);
    setIsPending(false);

    if (res.success) {
      toast.success("Socio creado con éxito");
      router.push("/jugadores");
    } else {
      toast.error(res.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      
      {/* SECCIÓN 1: DATOS PERSONALES */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2 border-b border-slate-50 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={20}/></div>
          <h2 className="font-bold text-slate-800">Información Personal</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nombre y Apellidos (como ya tenías) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre</label>
            <input {...register("nombre")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" />
            {errors.nombre && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.nombre.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Apellidos</label>
            <input {...register("apellidos")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">DNI / NIE</label>
            <input {...register("dni")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all uppercase" placeholder="12345678Z" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Fecha Nacimiento</label>
            <input {...register("fechaNacimiento")} type="date" className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" />
          </div>
        </div>

        {mostrarSeccionTutor && (
        <section className="bg-amber-50/50 rounded-[2.5rem] p-8 border border-amber-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3 mb-2 border-b border-amber-100 pb-4">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Users2 size={20}/></div>
            <div>
              <h2 className="font-bold text-amber-900">Datos del Padre, Madre o Tutor</h2>
              <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Requerido por minoría de edad</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-amber-700/60 uppercase ml-2 tracking-widest">Nombre del Tutor</label>
              <input 
                {...register("nombreTutor")} 
                className={`w-full px-5 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all ${errors.nombreTutor ? 'ring-2 ring-red-500' : ''}`} 
              />
              {errors.nombreTutor && <p className="text-[10px] text-red-500 font-bold ml-2">{errors.nombreTutor.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-amber-700/60 uppercase ml-2 tracking-widest">DNI Tutor</label>
              <input 
                {...register("dniTutor")} 
                className="w-full px-5 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all uppercase" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-amber-700/60 uppercase ml-2 tracking-widest">Teléfono Tutor</label>
              <input 
                {...register("telefonoTutor")} 
                className="w-full px-5 py-3 bg-white border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all" 
              />
            </div>
          </div>
        </section>
      )}

        {/* BOTÓN FOTO (Placeholder por ahora) */}
        <div className=" flex justify-between pt-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest block mb-2">Foto del Jugador</label>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
              <Camera size={24} />
            </div>
            <button type="button" className="text-xs font-bold bg-slate-100 text-slate-600 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors">
              Subir Imagen
            </button>
            <p className="text-[10px] text-slate-400 font-medium">Máximo 2MB. Formatos: JPG, PNG.</p>
          </div>
          </div>

        {/* RGPD */}
          <div className="flex items-center justify-center p-4">
            <div className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                {...register("rgpdFirmado")} 
                className="h-6 w-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-bold text-slate-700">
                Cesion de imágenes firmada
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: CATEGORÍA Y CONTACTO */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Categoría</label>
            <select {...register("categoriaId")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700">
              <option value="">Seleccionar...</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1"><div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Email</label>
            <input {...register("email")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" />
          </div></div>
          <div className="md:col-span-1"><div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Teléfono</label>
            <input {...register("telefono")} className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all" />
          </div></div>
        </div>
      </section>

      

      {/* SECCIÓN 4: TALLA Y DOCUMENTACIÓN */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2 border-b border-slate-50 pb-4">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Shirt size={20}/></div>
          <h2 className="font-bold text-slate-800">Talla y Documentación</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Talla de Ropa</label>
            <select 
              {...register("tallaRopa")} 
              className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700"
            >
              <option value="">Seleccionar...</option>
              <option value="6">6</option>
              <option value="8">8</option>
              <option value="10">10</option>
              <option value="12">12</option>
              <option value="14">14</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>
          
        </div>
      </section>

      {/* SECCIÓN 5: OBSERVACIONES */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2 border-b border-slate-50 pb-4">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><MessageSquare size={20}/></div>
          <h2 className="font-bold text-slate-800">Observaciones</h2>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Notas Internas</label>
          <textarea 
            {...register("observaciones")} 
            rows={3}
            className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all resize-none"
            placeholder="Alergias, notas médicas, información relevante..."
          />
        </div>
      </section>

      {/* SECCIÓN 3: PAGO (IBAN) */}
      <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
        <div className="flex items-center gap-3 mb-2 border-b border-slate-50 pb-4">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CreditCard size={20}/></div>
          <h2 className="font-bold text-slate-800">Datos de Facturación</h2>
        </div>
        <div className="max-w-md space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">IBAN (Cuenta Bancaria)</label>
          <input {...register("cuentaBancaria")} placeholder="ES00 0000..." className="w-full px-5 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-mono" />
        </div>
      </section>

      {/* BOTONES DE ACCIÓN */}
      <div className="flex items-center justify-end gap-4">
        <button type="button" onClick={() => router.back()} className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
        <button type="submit" disabled={isPending} className="flex items-center gap-3 px-12 py-4 bg-[#1e293b] text-white rounded-2xl font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all disabled:opacity-50">
          {isPending && <Loader2 className="animate-spin" size={18} />}
          Finalizar Registro
        </button>
      </div>
    </form>
  );
}