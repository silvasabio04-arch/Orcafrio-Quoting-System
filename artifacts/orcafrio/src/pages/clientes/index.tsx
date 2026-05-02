import { useState } from "react";
import { Link } from "wouter";
import { useListClientes } from "@workspace/api-client-react";
import { Plus, Search, Users, Phone, Mail, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export default function ClientesList() {
  const [search, setSearch] = useState("");

  const { data: clientes, isLoading } = useListClientes({ search: search || undefined });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">Gerencie sua carteira de clientes</p>
        </div>
        <Link href="/clientes/novo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-12 sm:h-10">
            <Plus className="mr-2 h-5 w-5" />
            Novo Cliente
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome, telefone ou documento..." 
          className="pl-10 h-12 sm:h-10 text-base sm:text-sm max-w-xl"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        </div>
      ) : clientes && clientes.length > 0 ? (
        <div className="grid gap-4">
          {clientes.map((cliente) => (
            <Link key={cliente.id} href={`/clientes/${cliente.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg line-clamp-1">{cliente.nome}</h3>
                  </div>
                  
                  <div className="space-y-2.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span className="truncate">{cliente.telefone}</span>
                    </div>
                    {cliente.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}
                    {cliente.endereco && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{cliente.endereco}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                    Cliente desde {formatDate(cliente.createdAt)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center max-w-2xl mx-auto">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-medium mb-2">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground mb-6">
            {search
              ? "Não encontramos nenhum cliente com esses termos." 
              : "Você ainda não possui clientes cadastrados. Adicione seu primeiro cliente para criar orçamentos."}
          </p>
          {search ? (
            <Button variant="outline" onClick={() => setSearch("")}>
              Limpar Busca
            </Button>
          ) : (
            <Link href="/clientes/novo">
              <Button size="lg">Cadastrar primeiro cliente</Button>
            </Link>
          )}
        </Card>
      )}
    </div>
  );
}
