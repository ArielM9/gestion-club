"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, UsersRound, Settings2 } from "lucide-react";
import CardKpi from "./CardKpi";
import LibroDiario from "./LibroDiario";
import ListaDeudores from "./ListaDeudores";
import GraficaFinanciera from "./GraficaFinanciera";
import GraficaGastos from "./GraficaGastos";

export default function ContabilidadTabs({
    resumen,
    movimientos,
    deudores,
    totalPages,
    currentPage,
    datosGrafica,
    datosCategorias
}: {
    resumen: any,
    movimientos: any[],
    deudores: any[],
    totalPages: number,
    currentPage: number,
    datosGrafica: any,
    datosCategorias: any
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
            <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
                <TabButton
                    active={activeTab === "dashboard"}
                    onClick={() => setActiveTab("dashboard")}
                    icon={<LayoutDashboard size={16} />}
                    label="Dashboard"
                />
                <TabButton
                    active={activeTab === "deudores"}
                    onClick={() => setActiveTab("deudores")}
                    icon={<UsersRound size={16} />}
                    label="Cuentas a Cobrar"
                />
            </div>

            {/* CONTENIDO DINÁMICO */}
            <div className="min-h-[600px] transition-all duration-300">
                {activeTab === "dashboard" && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <CardKpi title="Saldo Total" value={resumen.saldoTotal} type="balance" />
                            <CardKpi title="Ingresos" value={resumen.ingresosTotales} trend="+12%" type="income" />
                            <CardKpi title="Gastos" value={resumen.gastosTotales} trend="-3%" type="expense" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-80">
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic">
                                <GraficaFinanciera data={datosGrafica} />
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 font-bold italic">

                                <GraficaGastos data={datosCategorias} />
                            </div>
                        </div>

                        <LibroDiario movimientos={movimientos} />
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
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${active
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}