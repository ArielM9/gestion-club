"use client";

import { actualizarSocioAction, togglearFederadoAction } from "@/lib/actions/socios";
import { inscribirJugadorEnTemporadaAction } from "@/lib/actions/temporadas";
import { useState } from "react";
import type { SocioData, CategoriaBasic, JugadorPageProps, InscripcionData } from "@/lib/types/jugador";
import {
    Pencil,
    Save,
    X,
    UserPlus,
    Shirt,
    Plus,
    ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import ModalPago from "./ModalPago";
import ModalCargo from "./ModalCargo";
import DocumentosSocio from "./DocumentosSocio";
import DocumentViewerModal from "@/components/documentos/DocumentViewerModal";
import SubirDocumentoModal from "./SubirDocumentoModal";
import DatosBasicos from "./DatosBasicos";
import ContactoSection from "./ContactoSection";
import BalanceCard from "./BalanceCard";
import HistorialMovimientos from "./HistorialMovimientos";
import { FichaHeader } from "./FichaHeader";
import EntregaRopaModal from "@/components/tienda/EntregaRopaModal";

export default function FichaCliente({
    socio,
    categorias,
    temporadaActiva,
    userRole = "COLABORADOR",
    federadoActual = false,
}: JugadorPageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<SocioData>(socio);

    const [ropaEntregada, setRopaEntregada] = useState(false);
    const [inscribiendo, setInscribiendo] = useState(false);
    const [showFederadoModal, setShowFederadoModal] = useState(false);
    const [federando, setFederando] = useState(false);

    const tieneInscripcionActiva = socio.inscripciones?.some((i: InscripcionData) => i.temporada?.activa);

    const handleInscribir = async () => {
        if (!temporadaActiva) {
            toast.error("No hay temporada activa");
            return;
        }

        const resultado = await inscribirJugadorEnTemporadaAction(socio.id, false);
        
        if (resultado.tieneDeuda && resultado.deuda) {
            const confirmar = confirm(
                `El jugador tiene ${resultado.deuda}€ de deuda. ¿Quieres migrarla a la temporada actual y continuar con la inscripción?`
            );
            if (confirmar) {
                setInscribiendo(true);
                const resultado2 = await inscribirJugadorEnTemporadaAction(socio.id, true);
                setInscribiendo(false);
                if (resultado2.success) {
                    toast.success("Jugador inscrito correctamente");
                    window.location.reload();
                } else {
                    toast.error(resultado2.error);
                }
            }
        } else if (resultado.error) {
            toast.error(resultado.error);
        } else if (resultado.success) {
            toast.success("Jugador inscrito correctamente");
            window.location.reload();
        }
    };

    const handleTogglarFederado = async () => {
        setFederando(true);
        const res = await togglearFederadoAction(socio.id);
        setFederando(false);

        if (res.success) {
            toast.success(res.federado ? "Jugador federado" : "Federación retirada");
            window.location.reload();
        } else {
            toast.error(res.error);
        }
    };

    const handleSave = async () => {
        const promise = actualizarSocioAction(socio.id, formData);

        toast.promise(promise, {
            loading: 'Guardando cambios...',
            success: (data) => {
                if (data?.error) {
                    throw new Error(data.error);
                }
                setIsEditing(false);
                return '¡Socio actualizado correctamente!';
            },
            error: (err) => `Error: ${err.message || 'No se pudo actualizar'}`,
        });
    };

    const handleEntregaRopa = async () => {
        if (confirm("¿Confirmas la entrega del pack?")) {
            setRopaEntregada(true);

            toast.promise(actualizarSocioAction(socio.id, { ...formData, ropaEntregada: true }), {
                loading: 'Registrando entrega...',
                success: 'Entrega registrada con éxito',
                error: 'Error al registrar la entrega',
            });
        }
    };

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const [showModalPago, setShowModalPago] = useState(false);
    const [showModalCargo, setShowModalCargo] = useState(false);
    const [showEntregaRopa, setShowEntregaRopa] = useState(false);

    const getDocumentoPorTipo = (tipo: string) => {
        return (socio.documentos || []).find((d: any) => d.tipo === tipo);
    };
    const [docVer, setDocVer] = useState<any>(null);
    const [docSubir, setDocSubir] = useState<{ tipo: string; label: string } | null>(null);

    return (
        <div className="space-y-6">
            <FichaHeader
                socio={socio}
                formData={formData}
                federadoActual={federadoActual}
                isEditing={isEditing}
                tieneInscripcionActiva={tieneInscripcionActiva}
                temporadaActiva={temporadaActiva}
                inscribiendo={inscribiendo}
                onInscribir={handleInscribir}
                onEdit={() => setIsEditing(true)}
                onCancelEdit={() => setIsEditing(false)}
                onSave={handleSave}
                onTogglarFederado={handleTogglarFederado}
                federando={federando}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                    <div className="flex flex-col md:grid-cols-2 gap-6">
                        <DatosBasicos
                            formData={formData}
                            socio={socio}
                            isEditing={isEditing}
                            categorias={categorias}
                            onChange={handleChange}
                            getDocumentoPorTipo={getDocumentoPorTipo}
                            setDocVer={setDocVer}
                            setDocSubir={setDocSubir}
                        />

                        <ContactoSection
                            formData={formData}
                            isEditing={isEditing}
                            onChange={handleChange}
                            getDocumentoPorTipo={getDocumentoPorTipo}
                            setDocVer={setDocVer}
                            setDocSubir={setDocSubir}
                        />
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Shirt size={14} /> Equipación y Tallas
                            </h2>
                            <button 
                                onClick={() => setShowEntregaRopa(true)}
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-all"
                            >
                                <Plus size={12} /> Entregar Ropa
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                    Talla Registrada
                                </p>
                                {isEditing ? (
                                    <select
                                        name="tallaRopa"
                                        value={formData.tallaRopa || ""}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="">Seleccionar talla...</option>
                                        <optgroup label="Infantil">
                                            <option value="Talla 6">Talla 6</option>
                                            <option value="Talla 8">Talla 8</option>
                                            <option value="Talla 10">Talla 10</option>
                                            <option value="Talla 12">Talla 12</option>
                                        </optgroup>
                                        <optgroup label="Adulto">
                                            <option value="S">S</option>
                                            <option value="M">M</option>
                                            <option value="L">L</option>
                                            <option value="XL">XL</option>
                                            <option value="XXL">XXL</option>
                                        </optgroup>
                                    </select>
                                ) : (
                                    <p className="px-1 text-sm font-black text-slate-700">
                                        {formData.tallaRopa || "---"}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                                    Estado de Entrega (Pack Inicial)
                                </p>
                                <div
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all w-fit ${ropaEntregada
                                        ? "bg-green-50 border-green-100 text-green-700"
                                        : "bg-slate-50 border-slate-200 text-slate-500"
                                        }`}
                                >
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            id="entregaRopa"
                                            checked={ropaEntregada}
                                            disabled={ropaEntregada}
                                            onChange={() => {
                                                if (
                                                    confirm(
                                                        "¿Confirmas que se ha entregado el pack de ropa inicial?",
                                                    )
                                                ) {
                                                    setRopaEntregada(true);
                                                }
                                            }}
                                            className="h-5 w-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed accent-green-600"
                                        />
                                    </div>
                                    <label
                                        htmlFor="entregaRopa"
                                        className={`text-xs font-black uppercase tracking-wider cursor-pointer ${ropaEntregada ? "cursor-default" : "cursor-pointer"
                                            }`}
                                    >
                                        {ropaEntregada
                                            ? "Equipación Entregada"
                                            : "Pendiente de Entrega"}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <BalanceCard
                        socio={socio}
                        onOpenPago={() => setShowModalPago(true)}
                        onOpenCargo={() => setShowModalCargo(true)}
                    />

                    <DocumentosSocio
                        documentos={socio.documentos || []}
                        socioId={socio.id}
                        fechaNacimiento={socio.fechaNacimiento ? socio.fechaNacimiento.toISOString() : null}
                        nacionalidad={socio.nacionalidad || null}
                        temporadaActiva={temporadaActiva}
                    />

                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                        <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                            <ClipboardList size={14} /> Observaciones
                        </h2>
                        {isEditing ? (
                            <textarea
                                name="observaciones"
                                value={formData.observaciones || ""}
                                onChange={handleChange}
                                placeholder="Alergias, lesiones previas, disponibilidad..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium focus:border-blue-500 outline-none h-32 transition-all"
                            />
                        ) : (
                            <div className="bg-slate-50/50 p-6 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    {formData.observaciones ||
                                        "No hay observaciones registradas para este socio."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <HistorialMovimientos socio={socio} userRole={userRole} />

            <ModalPago
                socioId={socio.id}
                isOpen={showModalPago}
                onClose={() => setShowModalPago(false)}
            />
            <ModalCargo
                socioId={socio.id}
                isOpen={showModalCargo}
                onClose={() => setShowModalCargo(false)}
            />
            {docVer && (
                <DocumentViewerModal
                    isOpen={true}
                    onClose={() => setDocVer(null)}
                    storagePath={docVer.storagePath}
                    filename={docVer.filename}
                />
            )}
            <EntregaRopaModal
                isOpen={showEntregaRopa}
                onClose={() => setShowEntregaRopa(false)}
                socioId={socio.id}
                tallaJugador={socio.tallaRopa}
            />
            {docSubir && (
                <SubirDocumentoModal
                    isOpen={true}
                    onClose={() => setDocSubir(null)}
                    socioId={socio.id}
                    tipoDocumento={docSubir.tipo}
                    labelDocumento={docSubir.label}
                    temporadaActiva={temporadaActiva}
                />
            )}
        </div>
    );
}
