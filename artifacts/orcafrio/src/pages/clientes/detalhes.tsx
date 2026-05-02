import { useParams, Link } from "wouter";
import { useGetCliente, useDeleteCliente } from "@workspace/api-client-react";
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { formatDate } from "@/lib/format";

export default function ClienteDetalhes() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: cliente, isLoading } = useGetCliente(Number(id), {
    query: { enabled: !!id }
  });

  const deleteCliente = useDeleteCliente();

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      deleteCliente.mutate(
        { id: Number(id) },
        {
          onSuccess: () => {
            toast({ title: "Cliente excluído com sucesso" });
            setLocation("/clientes");
          },
          onError: () => {
            toast({
              title: "Erro ao excluir cliente",
              description: "Verifique se o cliente não possui orçamentos vinculados.",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <p className="text-muted-foreground mt-2 mb-6">O cliente que você está procurando não existe ou foi excluído.</p>
        <Link href="/clientes">
          <Button>Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clientes">
            <Button variant="outline" size="icon" className="shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detalhes do Cliente</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="icon" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-4 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{cliente.nome}</CardTitle>
              {cliente.cpfCnpj && <p className="text-muted-foreground mt-1">CPF/CNPJ: {cliente.cpfCnpj}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="h-4 w-4" /> Telefone
            </div>
            <p className="text-lg">{cliente.telefone}</p>
          </div>
          
          {cliente.email && (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Mail className="h-4 w-4" /> E-mail
              </div>
              <p className="text-lg break-all">{cliente.email}</p>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" /> Cliente Desde
            </div>
            <p className="text-lg">{formatDate(cliente.createdAt)}</p>
          </div>
          
          {cliente.endereco && (
            <div className="space-y-1 sm:col-span-2 lg:col-span-4 border-t pt-4 mt-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                <MapPin className="h-4 w-4" /> Endereço
              </div>
              <p className="text-lg">{cliente.endereco}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* TODO: Add list of orcamentos for this client when backend supports it via client relationship or list endpoint with filter */}
    </div>
  );
}
