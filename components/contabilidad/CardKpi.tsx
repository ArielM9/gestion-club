import { Wallet, ArrowUpCircle, ArrowDownCircle } from "lucide-react";

interface KpiProps {
    title: string;
    value: number;
    trend?: string;
    type: 'balance' | 'income' | 'expense';
}

export default function CardKpi({ title, value, trend, type }: KpiProps) {
    const styles = {
        balance: {
            bg: "bg-[#1e293b]",
            text: "text-white",
            subtext: "text-slate-400",
            icon: <Wallet className="text-slate-400" size={24} />,
            accent: "border-l-0"
        },
        income: {
            bg: "bg-white",
            text: "text-slate-900",
            subtext: "text-slate-500",
            icon: <ArrowUpCircle className="text-green-500" size={24} />,
            accent: "border-l-4 border-l-green-500"
        },
        expense: {
            bg: "bg-white",
            text: "text-slate-900",
            subtext: "text-slate-500",
            icon: <ArrowDownCircle className="text-red-500" size={24} />,
            accent: "border-l-4 border-l-red-500"
        }
    };

    const current = styles[type];

    return (
        <div className={`${current.bg} ${current.accent} p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5`}>
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${type === 'balance' ? 'bg-slate-800' : 'bg-slate-50'}`}>
                {current.icon}
            </div>
            <div>
                <p className={`${current.subtext} text-[10px] font-black uppercase tracking-widest`}>{title}</p>
                <div className="flex items-baseline gap-2">
                    <h2 className={`${current.text} text-2xl font-black tracking-tight`}>
                        {value.toLocaleString('es-ES', { minimumFractionDigits: 2 })}€
                    </h2>
                    {trend && (
                        <span className={`text-[10px] font-bold ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                            {trend}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}