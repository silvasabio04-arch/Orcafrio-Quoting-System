import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useAuth } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Redirect, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout";
import Landing from "@/pages/landing";
import TrialExpired from "@/pages/trial-expired";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import OrcamentosList from "@/pages/orcamentos/index";
import OrcamentoNovo from "@/pages/orcamentos/novo";
import OrcamentoEditar from "@/pages/orcamentos/editar";
import OrcamentoDetalhes from "@/pages/orcamentos/detalhes";
import ClientesList from "@/pages/clientes/index";
import ClienteNovo from "@/pages/clientes/novo";
import ClienteDetalhes from "@/pages/clientes/detalhes";
import Termos from "@/pages/termos";
import Privacidade from "@/pages/privacidade";
import Configuracoes from "@/pages/configuracoes";
import Aprovacao from "@/pages/aprovacao";
import Notificacoes from "@/pages/notificacoes";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#1d4ed8",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#ef4444",
    colorBackground: "#ffffff",
    colorInput: "#f8fafc",
    colorInputForeground: "#0f172a",
    colorNeutral: "#cbd5e1",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[400px] max-w-full overflow-hidden shadow-md border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-blue-700 font-semibold",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-blue-700",
    formFieldSuccessText: "text-green-600",
    alertText: "text-slate-700",
    logoBox: "mb-1",
    logoImage: "rounded-lg",
    socialButtonsBlockButton: "border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-blue-700 hover:bg-blue-800 text-white font-semibold",
    formFieldInput: "border-slate-200 bg-slate-50 text-slate-900",
    footerAction: "bg-slate-50",
    dividerLine: "bg-slate-200",
    alert: "border-slate-200",
    otpCodeFieldInput: "border-slate-200",
    formFieldRow: "",
    main: "",
  },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 402 || error?.status === 401) return false;
        return failureCount < 2;
      },
    },
  },
});

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function SignInPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/inicio" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Component />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/trial-expired" component={TrialExpired} />
      <Route path="/inicio">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/orcamentos/novo">
        {() => <ProtectedRoute component={OrcamentoNovo} />}
      </Route>
      <Route path="/orcamentos/:id/editar">
        {() => <ProtectedRoute component={OrcamentoEditar} />}
      </Route>
      <Route path="/orcamentos/:id">
        {() => <ProtectedRoute component={OrcamentoDetalhes} />}
      </Route>
      <Route path="/orcamentos">
        {() => <ProtectedRoute component={OrcamentosList} />}
      </Route>
      <Route path="/clientes/novo">
        {() => <ProtectedRoute component={ClienteNovo} />}
      </Route>
      <Route path="/clientes/:id">
        {() => <ProtectedRoute component={ClienteDetalhes} />}
      </Route>
      <Route path="/clientes">
        {() => <ProtectedRoute component={ClientesList} />}
      </Route>
      <Route path="/configuracoes">
        {() => <ProtectedRoute component={Configuracoes} />}
      </Route>
      <Route path="/notificacoes">
        {() => <ProtectedRoute component={Notificacoes} />}
      </Route>
      <Route path="/aprovacao/:token" component={Aprovacao} />
      <Route path="/termos">
        {() => <ProtectedRoute component={Termos} />}
      </Route>
      <Route path="/privacidade">
        {() => <ProtectedRoute component={Privacidade} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      afterSignOutUrl={`${basePath}/`}
      localization={{
        signIn: {
          start: {
            title: "Bem-vindo de volta",
            subtitle: "Entre na sua conta Orcafrio",
          },
        },
        signUp: {
          start: {
            title: "Crie sua conta grátis",
            subtitle: "30 dias de teste · Sem cartão de crédito",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
