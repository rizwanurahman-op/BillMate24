"use client";

import * as React from "react";
import { Check, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
    value: string;
    label: string;
    subLabel?: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value?: string;
    onValueChange: (value: string, option?: ComboboxOption) => void;
    placeholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    className?: string;
}

export function Combobox({
    options,
    value,
    onValueChange,
    placeholder = "Type to search...",
    emptyMessage = "No results found.",
    disabled = false,
    className,
}: ComboboxProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");
    const containerRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Find selected option to display its label
    const selectedOption = options.find((option) => option.value === value);

    // Filter options based on input
    const filteredOptions = React.useMemo(() => {
        if (!inputValue) return options;
        const query = inputValue.toLowerCase();
        return options.filter(
            (option) =>
                option.label.toLowerCase().includes(query) ||
                option.subLabel?.toLowerCase().includes(query)
        );
    }, [options, inputValue]);

    // Handle clicking outside to close
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Reset input to selected value when closing
                if (selectedOption) {
                    setInputValue(selectedOption.label);
                } else {
                    setInputValue("");
                }
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [selectedOption]);

    // Sync input value with selected option
    React.useEffect(() => {
        if (selectedOption) {
            setInputValue(selectedOption.label);
        } else {
            setInputValue("");
        }
    }, [selectedOption]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setIsOpen(true);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleSelect = (option: ComboboxOption) => {
        onValueChange(option.value, option);
        setInputValue(option.label);
        setIsOpen(false);
    };

    const handleClear = () => {
        onValueChange("", undefined);
        setInputValue("");
        inputRef.current?.focus();
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {/* Input Field */}
            <div className="relative">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "flex h-12 md:h-14 w-full rounded-xl border-[3px] border-slate-300 bg-white px-4 py-3 text-sm md:text-base font-medium",
                        "ring-offset-background placeholder:text-slate-400",
                        "focus-visible:outline-none focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/20",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                        "pl-11 md:pl-12 pr-11 md:pr-12",
                        "transition-all duration-200"
                    )}
                />
                {(inputValue || value) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Dropdown Suggestions */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="max-h-[200px] overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="py-4 px-3 text-center text-sm text-gray-500">
                                {emptyMessage}
                            </div>
                        ) : (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    onClick={() => handleSelect(option)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                                        "hover:bg-purple-50",
                                        value === option.value && "bg-purple-50"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-5 h-5 rounded-full border",
                                        value === option.value
                                            ? "bg-purple-600 border-purple-600 text-white"
                                            : "border-gray-300"
                                    )}>
                                        {value === option.value && <Check className="h-3 w-3" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-900 truncate">{option.label}</div>
                                        {option.subLabel && (
                                            <div className="text-xs text-orange-600 font-medium">{option.subLabel}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
