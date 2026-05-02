import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, Users, FileText, Menu, Settings, LogOut, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useClerk, useUser } from "@clerk/react";
import { useTrialStatus } from "@/lib/use-trial";

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const load = () => {
      fetch("/api/notificacoes")
        .then(r => r.ok ? r.json() : [])
        .then((items: { respostaLida: boolean }[]) => {
          setUnread(items.filter(i => !i.respostaLida).length);
        })
        .catch(() => {});
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <button
      onClick={() => setLocation("/notificacoes")}
      className="relative p-2 rounded-md hover:bg-muted transition-colors"
      aria-label="Notificações"
    >
      <Bell className="h-5 w-5 text-muted-foreground" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { signOut } = useClerk();
  const { user } = useUser();
  const trial = useTrialStatus();

  useEffect(() => {
    if (!trial.isLoading && trial.trialExpired) {
      setLocation("/trial-expired");
    }
  }, [trial.isLoading, trial.trialExpired, setLocation]);

  const navItems = [
    { href: "/inicio", label: "Início", icon: Home },
    { href: "/orcamentos", label: "Orçamentos", icon: FileText },
    { href: "/clientes", label: "Clientes", icon: Users },
  ];

  const sheetItems = [
    ...navItems,
    { href: "/configuracoes", label: "Configurações", icon: Settings },
  ];

  const isActive = (href: string) =>
    href === "/inicio"
      ? location === "/inicio" || location === "/"
      : location === href || (href !== "/inicio" && location.startsWith(href));

  const handleSignOut = () => {
    setMenuOpen(false);
    signOut({ redirectUrl: "/" });
  };

  const showTrialBanner =
    !trial.isLoading && !trial.isPaid && !trial.trialExpired && trial.daysLeft <= 7;

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col print:bg-white">
      {/* Trial banner */}
      {showTrialBanner && (
        <div className="bg-amber-50 border-b border-amber-200 text-center py-2 px-4 print:hidden">
          <p className="text-xs text-amber-800 font-medium flex items-center justify-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {trial.daysLeft === 0
              ? "Seu período de teste encerra hoje"
              : `${trial.daysLeft} ${trial.daysLeft === 1 ? "dia restante" : "dias restantes"} no seu período de teste gratuito`}
          </p>
        </div>
      )}

      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4 print:hidden">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
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

              {/* User info */}
              {user && (
                <div className="flex items-center gap-3 px-2.5 py-3 bg-muted/50 rounded-lg -mt-2">
                  <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(user.firstName?.[0] ?? user.emailAddresses?.[0]?.emailAddress?.[0] ?? "U").toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">
                      {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Técnico"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {!trial.isPaid && !trial.trialExpired
                        ? `Teste: ${trial.daysLeft} ${trial.daysLeft === 1 ? "dia" : "dias"} restantes`
                        : trial.isPaid
                        ? "Plano ativo"
                        : ""}
                    </p>
                  </div>
                </div>
              )}

              {sheetItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-4 px-2.5 ${
                    isActive(item.href)
                      ? "text-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="border-t pt-4 mt-4 space-y-2">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-red-600 w-full text-base font-medium"
              >
                <LogOut className="h-5 w-5" />
                Sair
              </button>
              <div className="text-sm text-muted-foreground mt-2 space-y-1.5">
                <Link href="/termos" className="block px-2.5 hover:text-foreground text-sm">
                  Termos de Uso
                </Link>
                <Link href="/privacidade" className="block px-2.5 hover:text-foreground text-sm">
                  Política de Privacidade
                </Link>
                <p className="px-2.5 pt-1 text-xs">© {new Date().getFullYear()} Orcafrio</p>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 justify-between items-center">
          <Link href="/inicio" className="flex items-center gap-2">
            <img
              src="/logo.jpg"
              alt="Orcafrio"
              className="h-8 w-8 rounded-md object-cover shadow-sm"
            />
            <span className="font-bold text-primary">Orcafrio</span>
          </Link>
          <NotificationBell />
        </div>
      </header>

      <main className="flex-1 p-4 pb-24 max-w-md mx-auto w-full print:max-w-none print:p-0 print:pb-0">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background flex justify-around items-center h-16 pb-safe z-40 print:hidden">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                active ? "text-primary" : "text-muted-foreground"
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
