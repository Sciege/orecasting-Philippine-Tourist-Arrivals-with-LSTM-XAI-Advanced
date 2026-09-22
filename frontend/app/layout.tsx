// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Tourist Arrivals Forecast",
  description: "Philippine Tourist Arrivals – FastAPI + Next.js",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <StoreProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 min-w-0 px-8 py-8 overflow-y-auto">
              {children}
            </main>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}


