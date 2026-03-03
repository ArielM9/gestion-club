import { redirect } from "next/navigation";
import { getHistoricoTemporada } from "@/lib/actions/temporadas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, Calendar, Users, FileText, DollarSign, Trophy, AlertTriangle } from "lucide-react";

interface PageProps {
  params: Promise<{ temporada: string }>;
}

export default async function HistoricoTemporadaPage({ params }: PageProps) {
  const { temporada: temporadaId } = await params;
  
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session?.user) {
    redirect("/login");
  }

  const userRole = session?.user?.role;
  
  if (userRole !== "ADMIN" && userRole !== "DIRECTIVA" && userRole !== "CONTABILIDAD") {
    redirect("/");
  }

  const temporada = await getHistoricoTemporada(temporadaId);

  if (!temporada) {
    redirect("/historico");
  }

  // Calcular totals
  const totalIngresos = temporada.abonos
    .filter(a => a.estado === "APROBADO")
    .reduce((acc, a) => acc + a.monto, 0) + temporada.ingresos.reduce((acc, i) => acc + i.monto, 0);
  
  const totalGastos = temporada.gastos.reduce((acc, g) => acc + g.monto, 0);
  const balance = totalIngresos - totalGastos;

  // Calcular deudas por socio
  const deudasPorSocio: Record<string, { nombre: string; deuda: number }> = {};
  for (const inscripcion of temporada.inscripciones) {
    const socioId = inscripcion.socioId;
    const cargosSocio = temporada.cargos.filter(c => c.socioId === socioId);
    const abonosSocio = temporada.abonos.filter(a => a.socioId === socioId);
    
    const totalCargos = cargosSocio.reduce((acc, c) => acc + c.monto, 0);
    const totalAbonos = abonosSocio.filter(a => a.estado === "APROBADO").reduce((acc, a) => acc + a.monto, 0);
    const deuda = totalCargos - totalAbonos;
    
    if (deuda > 0) {
      deudasPorSocio[socioId] = {
        nombre: `${inscripcion.socio.nombre} ${inscripcion.socio.apellidos}`,
        deuda
      };
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <Link href="/historico" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium">
        <ArrowLeft size={18} /> Volver al histórico
      </Link>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">{temporada.nombre}</h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            {new Date(temporada.fechaInicio).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
            {" - "}
            {new Date(temporada.fechaFin).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {temporada.activa ? (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-3 py-2 rounded-full">
              ACTIVA
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-3 py-2 rounded-full flex items-center gap-1">
              <Calendar size={12} /> CERRADA
            </span>
          )}
        </div>
      </header>

      {/* Resumen económico */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-green-600" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Ingresos</p>
          </div>
          <p className="text-2xl font-black text-green-600">{totalIngresos.toFixed(2)}€</p>
        </div>
        
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-red-600" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Gastos</p>
          </div>
          <p className="text-2xl font-black text-red-600">{totalGastos.toFixed(2)}€</p>
        </div>
        
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={18} className="text-blue-600" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Balance</p>
          </div>
          <p className={`text-2xl font-black ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
            {balance.toFixed(2)}€
          </p>
        </div>
        
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <Users size={18} className="text-slate-600" />
            <p className="text-[10px] font-black text-slate-400 uppercase">Socios</p>
          </div>
          <p className="text-2xl font-black text-slate-700">{temporada.inscripciones.length}</p>
        </div>
      </div>

      {/* Deudas pendientes */}
      {Object.keys(deudasPorSocio).length > 0 && (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-amber-100">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className="text-amber-600" />
            <h2 className="text-lg font-black text-slate-900">Socios con Deuda Pendiente</h2>
          </div>
          <div className="grid gap-2">
            {Object.entries(deudasPorSocio).map(([socioId, data]) => (
              <div key={socioId} className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                <Link href={`/jugadores/${socioId}`} className="font-bold text-slate-700 hover:text-blue-600">
                  {data.nombre}
                </Link>
                <span className="font-black text-red-600">{data.deuda.toFixed(2)}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Equipos y jugadores */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <Trophy size={20} className="text-blue-600" />
          <h2 className="text-lg font-black text-slate-900">Equipos y Jugadores</h2>
        </div>
        
        {temporada.equipos.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No hay equipos registrados</p>
        ) : (
          <div className="grid gap-6">
            {temporada.equipos.map((equipo) => (
              <div key={equipo.id} className="border border-slate-100 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-slate-700">{equipo.nombre}</h3>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                    {equipo.categoria.nombre}
                  </span>
                </div>
                
                {equipo.inscripciones.length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Sin jugadores inscritos</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {equipo.inscripciones.map((insc) => (
                      <Link 
                        key={insc.id} 
                        href={`/jugadores/${insc.socio.id}`}
                        className="flex items-center justify-between p-2 bg-slate-50 rounded-xl hover:bg-slate-100"
                      >
                        <span className="text-sm font-medium text-slate-700">
                          {insc.socio.nombre} {insc.socio.apellidos}
                        </span>
                        <span className="text-xs text-slate-400">{insc.socio.dni}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentos (solo comprobantes) */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-6">
          <FileText size={20} className="text-slate-600" />
          <h2 className="text-lg font-black text-slate-900">Comprobantes de Pago</h2>
        </div>
        
        {temporada.documentos.length === 0 ? (
          <p className="text-slate-400 text-center py-4">No hay documentos registrados</p>
        ) : (
          <div className="space-y-2">
            {temporada.documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-700">{doc.tipo}</p>
                  <p className="text-xs text-slate-400">{doc.filename}</p>
                </div>
                <Link 
                  href={`/documentos/view?key=${encodeURIComponent(doc.storagePath)}`}
                  className="text-blue-600 text-sm font-bold hover:underline"
                >
                  Ver
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
