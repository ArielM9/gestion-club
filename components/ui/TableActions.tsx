"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";

interface TableActionsProps {
  viewUrl?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  deleteDisabled?: boolean;
}

export function TableActions({
  viewUrl,
  onEdit,
  onDelete,
  isDeleting = false,
  deleteDisabled = false,
}: TableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {viewUrl && (
        <Link
          href={viewUrl}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Ver detalle"
        >
          <Eye size={16} />
        </Link>
      )}
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Editar"
        >
          <Pencil size={16} />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          disabled={isDeleting || deleteDisabled}
          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
          title="Eliminar"
        >
          {isDeleting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Trash2 size={16} />
          )}
        </button>
      )}
    </div>
  );
}