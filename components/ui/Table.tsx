import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export function Table({ className = "", children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className={`min-w-full divide-y divide-slate-200 text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500" {...props}>
      {children}
    </thead>
  );
}

export function Tbody({ className = "", children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function Th({ className = "", children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className={`px-4 py-2 text-left ${className}`} {...props}>
      {children}
    </th>
  );
}

export function Td({ className = "", children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={`px-4 py-2 ${className}`} {...props}>
      {children}
    </td>
  );
}
