import { Layout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/orcamentos" component={OrcamentosList} />
      <Route path="/orcamentos/novo" component={OrcamentoNovo} />
      <Route path="/orcamentos/:id/editar" component={OrcamentoEditar} />
      <Route path="/orcamentos/:id" component={OrcamentoDetalhes} />
      <Route path="/clientes" component={ClientesList} />
      <Route path="/clientes/novo" component={ClienteNovo} />
      <Route path="/clientes/:id" component={ClienteDetalhes} />
      <Route path="/termos" component={Termos} />
      <Route path="/privacidade" component={Privacidade} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
