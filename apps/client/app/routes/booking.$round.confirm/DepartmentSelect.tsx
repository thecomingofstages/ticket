import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { departments } from "~/departments";
import { cn } from "~/lib/utils";

export interface DepartmentSelectProps {
  value: (typeof departments)[number];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DepartmentSelect({
  value,
  onChange,
  disabled,
}: DepartmentSelectProps) {
  const [query, setQuery] = useState("");

  const filtered =
    query === ""
      ? departments
      : departments.filter((department) =>
          department.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <Combobox
      disabled={disabled}
      value={value}
      onChange={onChange}
      onClose={() => setQuery("")}
    >
      <div className="relative">
        <ComboboxInput
          as={Input}
          placeholder="พิมพ์หรือเลือกฝ่าย..."
          onChange={(event) => setQuery(event.target.value)}
        />
        <ComboboxButton className="group absolute inset-y-0 right-0 px-2.5">
          <ChevronDownIcon className="w-4 h-4 fill-white/60 group-data-[hover]:fill-white" />
        </ComboboxButton>
      </div>{" "}
      <ComboboxOptions
        anchor="bottom"
        transition
        className={cn(
          "w-[var(--input-width)] rounded-xl border border-white/5 bg-zinc-800/95 p-1 [--anchor-gap:0.25rem] [--anchor-max-height:30vh] empty:invisible",
          "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0"
        )}
      >
        {filtered.map((dep, idx) => (
          <ComboboxOption
            key={idx}
            value={dep}
            className="group flex cursor-default items-center gap-2 rounded-lg py-2 px-3 select-none data-[focus]:bg-white/10"
          >
            <CheckIcon
              strokeWidth={2}
              className="invisible w-4 h-4 text-white group-data-[selected]:visible"
            />
            <div className="text-sm/6 text-white">{dep}</div>
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
