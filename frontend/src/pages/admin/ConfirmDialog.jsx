import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmDialog({ open, onOpenChange, title, desc, onConfirm, confirmTestId }) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="bg-white border-mir-border rounded-none">
                <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading text-mir-text">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-mir-muted">
                        {desc}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-none border-mir-border">
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        data-testid={confirmTestId}
                        onClick={onConfirm}
                        className="rounded-none bg-rose-600 hover:bg-rose-700 text-white"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
