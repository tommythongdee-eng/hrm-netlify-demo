import { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  action?: ReactNode;
}

export function Card({ title, action, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between">
          {title && <h2 className="font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
