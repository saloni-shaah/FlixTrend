
"use client";
import * as React from "react";
import { Check, Search, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { countries } from "@/lib/countries";

// Helper to convert ISO 3166-1 alpha-2 country code to a flag emoji.
const countryCodeToFlag = (isoCode: string) => {
  if (!isoCode || isoCode.length !== 2) return "🏳️";
  return String.fromCodePoint(
    ...isoCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0))
  );
};

interface CountrySelectorProps {
    onCountrySelect: (code: string) => void;
    initialSelection?: string;
    className?: string;
}

export default function CountrySelector({ onCountrySelect, initialSelection, className }: CountrySelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(() => initialSelection || "+91");

    const selectedCountry = React.useMemo(() => 
        countries.find(c => c.dial_code === value) || countries.find(c => c.dial_code === "+91"), 
    [value]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[120px] justify-between input-glass h-10", className)}
                >
                    {selectedCountry ? `${countryCodeToFlag(selectedCountry.code)} ${selectedCountry.dial_code}` : "Select"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 bg-gray-800 border-gray-700">
                <Command>
                    <CommandInput placeholder="Search country..." className="h-9 text-white border-none focus:ring-0" />
                    <CommandEmpty>No country found.</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {countries.map((country) => (
                                <CommandItem
                                    key={country.code} // Use unique ISO code for key
                                    value={`${country.name} ${country.dial_code}`}
                                    onSelect={() => {
                                        setValue(country.dial_code);
                                        onCountrySelect(country.dial_code);
                                        setOpen(false);
                                    }}
                                    className="text-white aria-selected:!bg-gray-700 aria-selected:!text-white hover:!bg-gray-700/50"
                                >
                                    <span className="mr-2 text-lg">{countryCodeToFlag(country.code)}</span>
                                    <span className="flex-1 truncate">{country.name}</span>
                                    <span className="ml-auto text-gray-400">{country.dial_code}</span>
                                    <Check
                                        className={cn(
                                            "ml-2 h-4 w-4",
                                            value === country.dial_code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
