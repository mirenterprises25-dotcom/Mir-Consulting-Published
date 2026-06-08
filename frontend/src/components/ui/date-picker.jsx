import React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Lightweight date picker bound to ISO yyyy-MM-dd strings (matching <input type="date"> contract).
export function DatePicker({ value, onChange, testId, placeholder = "Pick a date", className = "" }) {
    const parsed = value ? parse(value, "yyyy-MM-dd", new Date()) : null;
    const selected = parsed && isValid(parsed) ? parsed : null;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    data-testid={testId}
                    className={`inline-flex items-center justify-between gap-2 w-full h-11 px-3 border border-mir-border bg-white text-left text-sm text-mir-text hover:border-mir-accent transition-colors ${className}`}
                >
                    <span className={selected ? "" : "text-mir-muted"}>
                        {selected ? format(selected, "PPP") : placeholder}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-mir-muted" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start" data-testid={`${testId}-popover`}>
                <Calendar
                    mode="single"
                    selected={selected || undefined}
                    onSelect={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}

export default DatePicker;
