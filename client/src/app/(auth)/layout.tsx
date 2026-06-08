import { Logo } from "@/components/brand/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col font-body-lg">
      
      {/* Top AppBar (Brand Identity) */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-gutter h-16 bg-surface-bright/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="font-display-md text-title-lg font-bold text-on-surface"><Logo/></div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-20 px-4 md:px-gutter w-full">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}
