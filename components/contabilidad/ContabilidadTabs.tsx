"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, UsersRound, Link2, Clock } from "lucide-react";
import CardKpi from "./CardKpi";
import LibroDiario from "./LibroDiario";
import ListaDeudores from "./ListaDeudores";
import GraficaFinanciera from "./GraficaFinanciera";
import GraficaGastos from "./GraficaGastos";
import VincularComprobantes from "./VincularComprobantes";

interface Resumen {
    saldoTotal: number;
    ingresosTotales: number;
    gastosTotales: number;
}

interface Movimiento {
    id: string;
    fecha: Date;
    entidad: string;
    socioId: string | null;
    concepto: string | null;
    monto: number;
    tipo: string;
    metodo: string;
    estado: string;
    esSocio: boolean;
}

interface Deudor {
    id: string;
    nombre: string;
    dni: string;
    categoria: string;
    totalCargos: number;
    totalAbonos: number;
    deuda: number;
    detalles: {
        cargos: { id: string; monto: number; concepto: string; fecha: Date }[];
        abonos: { id: string; monto: number; fecha: Date }[];
    };
}

interface DatosGrafica {
    name: string;
    ingresos: number;
    gastos: number;
}

interface DatosCategorias {
    name: string;
    value: number;
    fill: string;
}

export default function ContabilidadTabs({
    userRole = "COLABORADOR",
    resumen,
    movimientos,
    deudores,
    totalPages,
    currentPage,
    datosGrafica,
    datosCategorias,
    movimientosTotalPages = 1,
    movimientosTotalItems = 0,
    pendientes = [],
}: {
    userRole?: string;
    resumen: Resumen | null;
    movimientos: Movimiento[];
    deudores: Deudor[];
    totalPages: number;
    currentPage: number;
    datosGrafica: DatosGrafica[];
    datosCategorias: DatosCategorias[];
    movimientosTotalPages?: number;
    movimientosTotalItems?: number;
    pendientes?: Movimiento[];
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const activeTab = searchParams.get("tab") || "dashboard";

    const setActiveTab = (tab: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="space-y-8">
            {/* NAVEGACIÓN DE PESTAÑAS */}
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit max-w-full overflow-x-auto">
                <TabButton
                    active={activeTab === "dashboard"}
                    onClick={() => setActiveTab("dashboard")}
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                />
                <TabButton
                    active={activeTab === "pendientes"}
                    onClick={() => setActiveTab("pendientes")}
                    icon={<Clock size={16} />}
                    label="Pendientes"
                    badge={pendientes.length}
                />
                <TabButton
                    active={activeTab === "deudores"}
                    onClick={() => setActiveTab("deudores")}
                    icon={<UsersRound size={16} />}
                    label="Cuentas a Cobrar"
                />
                <TabButton
                    active={activeTab === "comprobantes"}
                    onClick={() => setActiveTab("comprobantes")}
                    icon={<Link2 size={16} />}
                    label="Vincular Comprobantes"
                />
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="min-h-[600px] transition-all duration-300">
                {activeTab === "dashboard" && (
                    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                            <CardKpi title="Saldo Total" value={resumen?.saldoTotal ?? 0} type="balance" />
                            <CardKpi title="Ingresos" value={resumen?.ingresosTotales ?? 0} trend="+12%" type="income" />
                            <CardKpi title="Gastos" value={resumen?.gastosTotales ?? 0} trend="-3%" type="expense" />
                        </div>

                        <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic min-h-[300px]">
                                <GraficaFinanciera data={datosGrafica || []} />
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic min-h-[300px]">
                                <GraficaGastos data={datosCategorias || []} />
                            </div>
                        </div>

                        <LibroDiario 
                            userRole={userRole}
                            movimientos={movimientos} 
                            totalPages={movimientosTotalPages}
                            totalItems={movimientosTotalItems}
                        />
                    </div>
                )}

                {activeTab === "pendientes" && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <h2 className="text-sm font-black text-amber-800 uppercase tracking-widest">
                                Pagos pendientes de aprobación
                            </h2>
                            <p className="text-xs text-amber-700 mt-1">
                                Revisa y aprueba los abonos registrados. Solo los abonos aprobados se contabilizan en los ingresos.
                            </p>
                        </div>

                        {pendientes.length === 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center">
                                <p className="text-slate-400 font-bold">No hay pagos pendientes de aprobación.</p>
                            </div>
                        ) : (
                            <LibroDiario
                                userRole={userRole}
                                movimientos={pendientes}
                                showApprovalButtons
                                totalItems={pendientes.length}
                                totalPages={1}
                            />
                        )}
                    </div>
                )}

                {activeTab === "deudores" && (
                    <div className="animate-in fade-in duration-300">
                        <ListaDeudores
                            deudores={deudores}
                            totalPages={totalPages}
                            currentPage={currentPage}
                        />
                    </div>
                )}

                {activeTab === "comprobantes" && (
                    <div className="animate-in fade-in duration-300">
                        <VincularComprobantes />
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string; badge?: number }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${active
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
        >
            {icon}
            {label}
            {typeof badge === "number" && badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${active ? "bg-amber-100 text-amber-700" : "bg-amber-200 text-amber-800"}`}>
                    {badge}
                </span>
            )}
        </button>
    );
}