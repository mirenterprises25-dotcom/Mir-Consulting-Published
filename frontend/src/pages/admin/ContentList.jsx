import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { btnGhost, btnPrimary } from "./_shared";
import ConfirmDialog from "./ConfirmDialog";

export function StatusPill({ status }) {
    const cls =
        status === "published"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : "bg-amber-50 text-amber-700 border-amber-200";
    return (
        <Badge
            className={`${cls} rounded-none border uppercase text-[10px] tracking-[0.18em]`}
        >
            {status}
        </Badge>
    );
}

export default function ContentList({
    title,
    singular,
    testIdPrefix,
    items,
    loading,
    columns,
    renderRow,
    onNew,
    onEdit,
    onDelete,
    confirmDel,
    setConfirmDel,
    doDelete,
}) {
    const newLabel = (
        singular ||
        (title.toLowerCase().endsWith("ies")
            ? title.slice(0, -3).toLowerCase() + "y"
            : title.replace(/s$/i, "").toLowerCase())
    );
    return (
        <div className="border border-mir-border bg-white">
            <div className="px-6 py-5 border-b border-mir-border flex items-center justify-between">
                <div>
                    <div className="font-heading text-xl tracking-tight text-mir-text">
                        {title}
                    </div>
                    <div className="text-xs text-mir-muted mt-1">
                        {loading ? "Loading..." : `${items.length} entries`}
                    </div>
                </div>
                <button
                    onClick={onNew}
                    data-testid={`admin-${testIdPrefix}-new`}
                    className={btnPrimary}
                >
                    <Plus className="w-4 h-4" />
                    New {newLabel}
                </button>
            </div>

            <div className="overflow-x-auto">
                <Table data-testid={`admin-${testIdPrefix}-table`}>
                    <TableHeader>
                        <TableRow className="border-mir-border hover:bg-transparent">
                            {columns.map((h) => (
                                <TableHead
                                    key={h}
                                    className="text-mir-muted uppercase text-[10px] tracking-[0.2em]"
                                >
                                    {h}
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 && !loading && (
                            <TableRow className="border-mir-border hover:bg-transparent">
                                <TableCell
                                    colSpan={columns.length}
                                    className="text-center text-mir-muted py-12"
                                >
                                    No {title.toLowerCase()} yet. Create your first one.
                                </TableCell>
                            </TableRow>
                        )}
                        {items.map((it) => {
                            const cells = renderRow(it);
                            return (
                                <TableRow
                                    key={it.id}
                                    data-testid={`admin-${testIdPrefix}-row-${it.id}`}
                                    className="border-mir-border hover:bg-mir-surface"
                                >
                                    {cells.map((c, i) => (
                                        <TableCell
                                            key={i}
                                            className="text-sm text-mir-text"
                                        >
                                            {c}
                                        </TableCell>
                                    ))}
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEdit(it)}
                                                data-testid={`admin-${testIdPrefix}-edit-${it.id}`}
                                                className={`${btnGhost} px-3 py-1.5 text-xs`}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => onDelete(it)}
                                                data-testid={`admin-${testIdPrefix}-delete-${it.id}`}
                                                className={`${btnGhost} px-3 py-1.5 text-xs hover:border-rose-400 hover:text-rose-600`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!confirmDel}
                onOpenChange={(v) => !v && setConfirmDel(null)}
                title={`Delete this ${title.slice(0, -1).toLowerCase()}?`}
                desc={
                    confirmDel
                        ? `"${confirmDel.title}" will be permanently removed.`
                        : ""
                }
                confirmTestId={`admin-${testIdPrefix}-delete-confirm`}
                onConfirm={() => confirmDel && doDelete(confirmDel.id)}
            />
        </div>
    );
}
