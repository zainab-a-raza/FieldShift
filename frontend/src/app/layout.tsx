import type { Metadata } from "next";
import "./globals.css";
import { FarmProvider } from "@/context/FarmContext";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "FieldShift — NASA Agricultural Decision Support",
  description:
    "Intelligent agricultural decision-support platform for the 2026 NASA Space Apps Challenge. Comparing crop rotations with NASA Earth observations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex bg-[#F8F8F3] text-[#26352C] antialiased">
        <FarmProvider>
          {/* Dark Forest Green Sidebar */}
          <Sidebar />

          {/* Main Layout Area */}
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-[#F8F8F3] p-6 lg:p-8">
              <div className="max-w-7xl mx-auto space-y-8">
                {children}
              </div>
            </main>
          </div>
        </FarmProvider>
      </body>
    </html>
  );
}
