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
    <div className="min-h-screen bg-muted/40 flex flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium">
              <div className="flex items-center gap-2 text-primary font-bold text-xl mb-4">
                <div className="bg-primary text-primary-foreground p-2 rounded-md">
                  <FileText className="h-5 w-5" />
                </div>
                Orcafrio
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
          </SheetContent>
        </Sheet>

        <div className="flex w-full justify-between items-center sm:hidden">
          <span className="font-bold text-primary">Orcafrio</span>
        </div>

        <nav className="hidden sm:flex w-full items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-primary font-bold text-xl mr-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <FileText className="h-5 w-5" />
              </div>
              Orcafrio
            </div>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location === item.href ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation for Mobile (optional, but requested thumb-friendly, let's keep it simple with header for now) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around items-center h-16 pb-safe z-40">
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
      </div>
    </div>
  );
}
