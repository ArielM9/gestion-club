"use client";
import { actualizarSocioAction } from "@/lib/actions/socios";
import { useState } from "react";
import {
    Pencil,
    Save,
    X,
    User,
    Phone,
    MapPin,
    CreditCard,
    ClipboardList,
    Shirt,
    CheckCircle2,
    AlertCircle,
    ShoppingBag,
    Plus,
    CheckCheckIcon,
    Check,
    ArrowUpRight, ArrowDownLeft, History
} from "lucide-react";
import { toast } from "sonner";
import ModalPago from "./ModalPago";
import ModalCargo from "./ModalCargo";


export default function FichaCliente({
    socio,
    categorias,
}: {
    socio: any;
    categorias: any[];
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(socio);

    // Simulación de estado de ropa (Para cuando implementemos la lógica)
    const [ropaEntregada, setRopaEntregada] = useState(false);

    const totalCargos = socio.cargos?.reduce((acc: number, c: any) => acc + c.monto, 0) || 0;
    // Solo sumamos abonos que NO estén pendientes (ajusta según tu lógica de negocio)
    const totalAbonos = socio.abonos?.reduce((acc: number, a: any) => acc + a.monto, 0) || 0;
    const balanceTotal = totalAbonos - totalCargos;

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

    // También vamos a usarlo en el check de la ropa para que sea más pro
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

    return (
        <div className="space-y-6">
            {/* HEADER ... (Igual que el anterior) */}
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-16 w-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-2xl uppercase">
                        {formData.nombre[0]}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">
                            {formData.nombre} {formData.apellidos}
                        </h1>
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            {socio.categoria?.nombre || "Sin categoría"}
                        </span>
                    </div>
                </div>
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                    >
                        <Pencil size={16} /> Editar Perfil
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 flex items-center gap-2"
                        >
                            <X size={16} /> Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
                        >
                            <Save size={16} /> Guardar
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* DATOS PERSONALES */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                            <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <User size={14} /> Información Básica
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <EditableField
                                    label="Nombre"
                                    name="nombre"
                                    value={formData.nombre}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />
                                <EditableField
                                    label="Apellidos"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />
                                <EditableField
                                    label="Mote"
                                    name="mote"
                                    value={formData.mote || ""}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />
                                <EditableField
                                    label="DNI"
                                    name="dni"
                                    value={formData.dni}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />

                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoría del Jugador</p>
                                {isEditing ? (
                                    <select
                                        name="categoriaId"
                                        value={formData.categoriaId}
                                        onChange={handleChange}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all cursor-pointer"
                                    >
                                        {categorias.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.nombre}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <p className="px-1 text-sm font-black text-blue-600 uppercase italic">
                                        {socio.categoria?.nombre || "Sin categoría"}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* CONTACTO */}
                        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                            <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Phone size={14} /> Contacto y Familia
                            </h2>
                            <EditableField
                                label="Email"
                                name="email"
                                value={formData.email || ""}
                                isEditing={isEditing}
                                onChange={handleChange}
                            />
                            <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                <div className="col-span-2">
                                    <EditableField
                                        label="Nombre Tutor"
                                        name="nombreTutor"
                                        value={formData.nombreTutor || ""}
                                        isEditing={isEditing}
                                        onChange={handleChange}
                                    />
                                </div>
                                <EditableField
                                    label="DNI Tutor"
                                    name="dniTutor"
                                    value={formData.dniTutor || ""}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />
                                <EditableField
                                    label="Teléfono"
                                    name="telefonoTutor"
                                    value={formData.telefonoTutor || ""}
                                    isEditing={isEditing}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN DE ROPA / LOGÍSTICA */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                                <Shirt size={14} /> Equipación y Tallas
                            </h2>
                            <button className="flex items-center gap-1.5 text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-all">
                                <Plus size={12} /> Nueva Venta
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                            {/* CAMPO DE TALLA COMO SELECT */}
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
                                            disabled={ropaEntregada} // Bloqueado si ya se entregó
                                            onChange={() => {
                                                if (
                                                    confirm(
                                                        "¿Confirmas que se ha entregado el pack de ropa inicial?",
                                                    )
                                                ) {
                                                    setRopaEntregada(true);
                                                    // Aquí llamaríamos a la futura Server Action
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

                {/* COLUMNA DERECHA: FINANZAS ... (Igual que el anterior) */}
                <div className="space-y-6">
                    <div className="bg-slate-800 text-white p-8 rounded-[2rem] shadow-xl border border-slate-800 space-y-6">
                        {/* ... Contenido del balance ... */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                                    Balance de Cuenta
                                </h2>
                                <p className={`text-4xl font-black mt-2 tracking-tight ${balanceTotal < 0 ? "text-red-400" : "text-green-400"}`}>
                                    {balanceTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                                </p>
                            </div>
                            <CreditCard className="text-slate-700" size={32} />
                        </div>
                        <div className="flex flex-col gap-2 pt-4">
                            <button onClick={() => setShowModalPago(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase py-3 rounded-xl transition-all">
                                Registrar Pago
                            </button>
                            <button onClick={() => setShowModalCargo(true)} className="w-full bg-slate-500 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase py-3 rounded-xl transition-all">
                                Generar Cargo
                            </button>
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Últimos movimientos
                            </p>
                            <div className="space-y-3">
                                {/* COMBINAMOS CARGOS Y ABONOS */}
                                {[...(socio.cargos || []), ...(socio.abonos || [])]
                                    // Ordenamos de más reciente a más antiguo
                                    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                    // Tomamos solo los 3 últimos
                                    .slice(0, 3)
                                    .map((mov: any) => {
                                        const isAbono = !mov.concepto; // Si no tiene 'concepto' es un abono (usa 'motivo' o es un pago)
                                        return (
                                            <div
                                                key={mov.id}
                                                className="flex justify-between text-[11px] font-medium items-center"
                                            >
                                                <span className="text-slate-400 truncate max-w-[140px]">
                                                    {isAbono ? (mov.motivo || "Abono recibido") : mov.concepto}
                                                </span>
                                                <span className={isAbono ? "text-green-400" : "text-red-400 font-bold"}>
                                                    {isAbono ? "+" : "-"}{mov.monto}€
                                                </span>
                                            </div>
                                        );
                                    })}

                                {(!socio.cargos?.length && !socio.abonos?.length) && (
                                    <p className="text-[10px] text-slate-600 italic text-center">Sin movimientos</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOQUE DE OBSERVACIONES (Abajo del todo, ocupando todo el ancho) */}
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
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-slate-400 uppercase ml-1">
                        RGPD
                    </p>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            disabled={!isEditing}
                            checked={formData.rgpdFirmado}
                            onChange={(e) =>
                                setFormData({ ...formData, rgpdFirmado: e.target.checked })
                            }
                            className="h-5 w-5 accent-blue-600 cursor-pointer ml-1"
                        />
                        <span className="text-xs font-bold text-slate-600">
                            {formData.rgpdFirmado
                                ? "Documento firmado"
                                : "Pendiente de firma"}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- NUEVA SECCIÓN: HISTORIAL DETALLADO DE MOVIMIENTOS --- */}
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                    <h2 className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">
                        <History size={14} /> Historial de Pagos y Cargos
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-4 py-2">Fecha</th>
                                <th className="px-4 py-2">Concepto / Motivo</th>
                                <th className="px-4 py-2">Método / Estado</th>
                                <th className="px-4 py-2 text-right">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...(socio.cargos || []), ...(socio.abonos || [])]
                                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                .map((mov: any) => {
                                    const isAbono = !mov.concepto; // Si no tiene concepto, es un abono
                                    return (
                                        <tr key={mov.id} className="group bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 rounded-l-2xl text-xs font-bold text-slate-500">
                                                {new Date(mov.fecha).toLocaleDateString('es-ES')}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    {isAbono ? (
                                                        <ArrowDownLeft size={14} className="text-green-500" />
                                                    ) : (
                                                        <ArrowUpRight size={14} className="text-red-500" />
                                                    )}
                                                    <span className="text-xs font-black text-slate-700">
                                                        {mov.concepto || mov.motivo || "Pago recibido"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-500">
                                                        {mov.metodo || "CARGO"}
                                                    </span>
                                                    {isAbono && (
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${mov.estado === 'APROBADO' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                                                            }`}>
                                                            {mov.estado}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3 rounded-r-2xl text-right text-sm font-black ${isAbono ? "text-green-600" : "text-red-600"}`}>
                                                {isAbono ? "+" : "-"}{mov.monto.toFixed(2)}€
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {(!socio.cargos?.length && !socio.abonos?.length) && (
                        <div className="text-center py-12 text-slate-400 font-medium text-sm">
                            No se han registrado movimientos financieros todavía.
                        </div>
                    )}
                </div>
            </div>
            {/* Modal de Pago */}
            <ModalPago
                socioId={socio.id}
                isOpen={showModalPago}
                onClose={() => setShowModalPago(false)}
            />
            {/* Modal de Cargo */}
            <ModalCargo
                socioId={socio.id}
                isOpen={showModalCargo}
                onClose={() => setShowModalCargo(false)}
            />
        </div>
    );
}

function EditableField({ label, name, value, isEditing, onChange }: any) {
    return (
        <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase ml-1">
                {label}
            </p>
            {isEditing ? (
                <input
                    name={name}
                    value={value}
                    onChange={onChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                />
            ) : (
                <p className="px-1 text-sm font-black text-slate-700 truncate">
                    {value || "---"}
                </p>
            )}
        </div>


    );
}
