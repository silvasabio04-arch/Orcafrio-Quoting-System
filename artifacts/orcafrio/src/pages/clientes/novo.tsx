import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, User } from "lucide-react";
import { useCreateCliente, getListClientesQueryKey, getGetDashboardResumoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const clienteSchema = z.object({
  nome: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  telefone: z.string().min(10, "Telefone inválido"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  endereco: z.string().optional(),
  cpfCnpj: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

export default function ClienteNovo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createCliente = useCreateCliente();

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      endereco: "",
      cpfCnpj: "",
    },
  });

  const onSubmit = (data: ClienteFormValues) => {
    // Convert empty strings to null/undefined or remove them to match API
    const payload = {
      ...data,
      email: data.email || undefined,
      endereco: data.endereco || undefined,
      cpfCnpj: data.cpfCnpj || undefined,
    };

    createCliente.mutate(
      { data: payload },
      {
        onSuccess: (response) => {
          toast({
            title: "Cliente cadastrado",
            description: "O cliente foi cadastrado com sucesso.",
          });
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardResumoQueryKey() });
          setLocation(`/clientes/${response.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao cadastrar",
            description: "Ocorreu um erro ao tentar salvar o cliente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground">Cadastre as informações do cliente</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Dados Pessoais</CardTitle>
              <CardDescription>Informações de contato e identificação</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nome Completo / Razão Social</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: João da Silva" className="h-12 sm:h-10 text-base sm:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone / WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} type="tel" placeholder="(00) 00000-0000" className="h-12 sm:h-10 text-base sm:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cpfCnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF / CNPJ (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="000.000.000-00" className="h-12 sm:h-10 text-base sm:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>E-mail (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="cliente@exemplo.com" className="h-12 sm:h-10 text-base sm:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Endereço Completo (Opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Rua, Número, Bairro, Cidade - UF" className="h-12 sm:h-10 text-base sm:text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="submit" disabled={createCliente.isPending} className="w-full sm:w-auto h-12 sm:h-10 px-8">
                  <Save className="mr-2 h-5 w-5" />
                  {createCliente.isPending ? "Salvando..." : "Salvar Cliente"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
