// components/jugadores/SocioTable.tsx
import { MoreHorizontal, Phone, Mail } from "lucide-react";

export default function SocioTable({ socios }: { socios: any[] }) {
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-slate-50/50 border-b border-slate-100">
          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Socio</th>
          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">DNI</th>
          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Contacto</th>
          <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Estado</th>
          <th className="px-6 py-4 text-right"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {socios.map((socio) => (
          <tr key={socio.id} className="hover:bg-slate-50/50 transition-colors group">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200">
                  {socio.fotoUrl ? (
                    <img src={socio.fotoUrl} alt={socio.nombre} className="h-full w-full object-cover" />
                  ) : (
                    socio.nombre.charAt(0)
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">{socio.nombre} {socio.apellidos}</p>
                  <p className="text-[11px] text-slate-400 font-medium">Socio desde: {new Date().getFullYear()}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                {socio.dni}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex gap-2 text-slate-400">
                {socio.telefono && <Phone size={14} className="hover:text-blue-500 cursor-help" title={socio.telefono} />}
                {socio.email && <Mail size={14} className="hover:text-blue-500 cursor-help" title={socio.email} />}
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                socio.activo 
                  ? "bg-green-100 text-green-700" 
                  : "bg-red-100 text-red-700"
              }`}>
                {socio.activo ? "Activo" : "Baja"}
              </span>
            </td>
            <td className="px-6 py-4 text-right">
              <button className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-400 hover:text-slate-600">
                <MoreHorizontal size={18} />
              </button>
            </td>
          </tr>
        ))}
        {socios.length === 0 && (
          <tr>
            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium italic">
              No hay socios registrados todavía.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}