import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/orcamentos", label: "Orçamentos", icon: FileText },
    { href: "/clientes", label: "Clientes", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col print:bg-white">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 print:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="max-w-xs flex flex-col">
            <nav className="grid gap-6 text-lg font-medium flex-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.jpg"
                  alt="Orcafrio"
                  className="h-10 w-10 rounded-lg object-cover shadow-sm"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-primary font-bold text-xl">Orcafrio</span>
                  <span className="text-xs text-muted-foreground font-normal">Orçamento Inteligente</span>
                </div>
              </div>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-4 px-2.5 ${
                    location === item.href
                      ? "text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t pt-4 mt-4 space-y-2 text-sm text-muted-foreground">
              <Link href="/termos" className="block px-2.5 hover:text-foreground">
                Termos de Uso
              </Link>
              <Link href="/privacidade" className="block px-2.5 hover:text-foreground">
                Política de Privacidade
              </Link>
              <p className="px-2.5 pt-2 text-xs">© {new Date().getFullYear()} Orcafrio</p>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="Orcafrio"
              className="h-8 w-8 rounded-md object-cover shadow-sm"
            />
            <span className="font-bold text-primary">Orcafrio</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full print:max-w-none print:p-0 print:pb-0">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around items-center h-16 pb-safe z-40 print:hidden">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
