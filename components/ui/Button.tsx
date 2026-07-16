import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50",
  danger: "border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50",
  ghost: "text-slate-500 hover:bg-slate-100 disabled:opacity-50",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
});
