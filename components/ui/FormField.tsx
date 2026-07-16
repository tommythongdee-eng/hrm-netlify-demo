import { ReactNode } from "react";

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  full?: boolean;
  className?: string;
}

export function FormField({ label, children, full = false, className = "" }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1 text-sm font-medium text-slate-700 ${full ? "col-span-2" : ""} ${className}`}>
      {label}
      {children}
    </label>
  );
}
