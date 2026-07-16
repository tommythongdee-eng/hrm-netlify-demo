import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { SuperAdminAuthProvider } from "@/lib/superadmin-auth-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoSansThai = Noto_Sans_Thai({ subsets: ["thai"], variable: "--font-noto-thai" });

export const metadata: Metadata = {
  title: "HRM for Thai SMEs",
  description: "HR management built for Thai small and medium businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansThai.variable}`}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <AuthProvider>
          <SuperAdminAuthProvider>{children}</SuperAdminAuthProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
