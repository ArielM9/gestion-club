interface EditableFieldProps {
  label: string;
  name: string;
  value: string;
  isEditing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

export function EditableField({ label, name, value, isEditing, onChange }: EditableFieldProps) {
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
