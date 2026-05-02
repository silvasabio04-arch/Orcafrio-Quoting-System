import { useParams, Link, useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, ArrowLeft, Save } from "lucide-react";
import { useGetOrcamento, useUpdateOrcamento, useListClientes, getGetOrcamentoQueryKey, getListOrcamentosQueryKey, getGetDashboardResumoQueryKey, getGetOrcamentosRecentesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateItemBodyCategoria } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";
import { useEffect } from "react";

const itemSchema = z.object({
  categoria: z.nativeEnum(CreateItemBodyCategoria),
  descricao: z.string().min(1, "A descrição é obrigatória"),
  quantidade: z.coerce.number().min(1, "A quantidade deve ser maior que zero"),
  precoUnitario: z.coerce.number().min(0, "O preço deve ser maior ou igual a zero"),
});

const orcamentoSchema = z.object({
  clienteId: z.coerce.number().min(1, "Selecione um cliente"),
  prazoExecucao: z.string().optional(),
  validadeOrcamento: z.string().optional(),
  garantia: z.string().optional(),
  condicoesPagamento: z.string().optional(),
  observacoes: z.string().optional(),
  itens: z.array(itemSchema).min(1, "Adicione pelo menos um item ao orçamento"),
});

type OrcamentoFormValues = z.infer<typeof orcamentoSchema>;

export default function OrcamentoEditar() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orcamento, isLoading: isLoadingOrcamento } = useGetOrcamento(Number(id), {
    query: { enabled: !!id, queryKey: getGetOrcamentoQueryKey(Number(id)) }
  });

  const { data: clientes, isLoading: isLoadingClientes } = useListClientes();
  const updateOrcamento = useUpdateOrcamento();

  const form = useForm<OrcamentoFormValues>({
    resolver: zodResolver(orcamentoSchema),
    defaultValues: {
      clienteId: undefined,
      prazoExecucao: "",
      validadeOrcamento: "7 dias",
      garantia: "90 dias",
      condicoesPagamento: "A vista / Pix",
      observacoes: "",
      itens: [
        {
          categoria: "manutencao_preventiva",
          descricao: "",
          quantidade: 1,
          precoUnitario: 0,
        },
      ],
    },
  });

  useEffect(() => {
    if (orcamento) {
      form.reset({
        clienteId: orcamento.clienteId,
        prazoExecucao: orcamento.prazoExecucao || "",
        validadeOrcamento: orcamento.validadeOrcamento || "",
        garantia: orcamento.garantia || "",
        condicoesPagamento: orcamento.condicoesPagamento || "",
        observacoes: orcamento.observacoes || "",
        itens: orcamento.itens.map(item => ({
          categoria: item.categoria,
          descricao: item.descricao,
          quantidade: item.quantidade,
          precoUnitario: item.precoUnitario,
        })),
      });
    }
  }, [orcamento, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const watchedItens = form.watch("itens");
  const totalGeral = watchedItens.reduce((acc, item) => acc + (item.quantidade || 0) * (item.precoUnitario || 0), 0);

  const onSubmit = (data: OrcamentoFormValues) => {
    updateOrcamento.mutate(
      { id: Number(id), data },
      {
        onSuccess: () => {
          toast({
            title: "Orçamento atualizado",
            description: "Orçamento atualizado com sucesso.",
          });
          queryClient.invalidateQueries({ queryKey: getGetOrcamentoQueryKey(Number(id)) });
          queryClient.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardResumoQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrcamentosRecentesQueryKey() });
          setLocation(`/orcamentos/${id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao atualizar orçamento",
            description: "Ocorreu um erro ao tentar salvar as alterações.",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoadingOrcamento) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Orçamento não encontrado</h2>
        <Link href="/orcamentos">
          <Button className="mt-4">Voltar para Orçamentos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href={`/orcamentos/${id}`}>
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Orçamento {orcamento.numero}</h1>
          <p className="text-muted-foreground">Altere os detalhes do serviço</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
              <CardDescription>Selecione para quem é este orçamento</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="clienteId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm">
                          <SelectValue placeholder={isLoadingClientes ? "Carregando..." : "Selecione o cliente"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes?.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id.toString()}>
                            {cliente.nome} {cliente.telefone ? `(${cliente.telefone})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Itens do Serviço</CardTitle>
                <CardDescription>Adicione as peças e serviços a serem realizados</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => {
                const quantidade = watchedItens[index]?.quantidade || 0;
                const preco = watchedItens[index]?.precoUnitario || 0;
                const subtotal = quantidade * preco;

                return (
                  <div key={field.id} className="relative p-4 pt-6 border rounded-lg bg-muted/20 space-y-4">
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-3 -right-3 h-8 w-8 rounded-full"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`itens.${index}.categoria`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 sm:h-10 text-base sm:text-sm bg-background">
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="manutencao_preventiva">Manutenção Preventiva</SelectItem>
                                <SelectItem value="higienizacao">Higienização</SelectItem>
                                <SelectItem value="instalacao">Instalação</SelectItem>
                                <SelectItem value="troca_compressor">Troca de Compressor</SelectItem>
                                <SelectItem value="carga_gas">Carga de Gás</SelectItem>
                                <SelectItem value="diagnostico">Diagnóstico</SelectItem>
                                <SelectItem value="conserto">Conserto</SelectItem>
                                <SelectItem value="mao_de_obra">Mão de Obra</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`itens.${index}.descricao`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição Detalhada</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ex: Higienização completa da evaporadora" className="h-12 sm:h-10 text-base sm:text-sm bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 items-end">
                      <FormField
                        control={form.control}
                        name={`itens.${index}.quantidade`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" step="1" min="1" {...field} className="h-12 sm:h-10 text-base sm:text-sm bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`itens.${index}.precoUnitario`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preço Unitário (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} className="h-12 sm:h-10 text-base sm:text-sm bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="col-span-2 sm:col-span-1 p-3 bg-primary/10 rounded-md text-right">
                        <span className="text-xs text-muted-foreground block mb-1">Subtotal</span>
                        <span className="font-bold text-primary">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <Button
                type="button"
                variant="outline"
                className="w-full border-dashed"
                onClick={() => append({ categoria: "outros", descricao: "", quantidade: 1, precoUnitario: 0 })}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar mais um item
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições e Prazos</CardTitle>
              <CardDescription>Informações adicionais que aparecerão no orçamento</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="prazoExecucao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prazo de Execução</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 2 dias úteis" className="h-12 sm:h-10 text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="validadeOrcamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validade do Orçamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 7 dias" className="h-12 sm:h-10 text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="garantia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Garantia</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 90 dias após instalação" className="h-12 sm:h-10 text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="condicoesPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condições de Pagamento</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: 50% entrada, 50% na entrega" className="h-12 sm:h-10 text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Observações adicionais para o cliente..." className="min-h-[100px] text-base sm:text-sm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Sticky bottom bar for save action */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t shadow-[0_-4px_10px_-10px_rgba(0,0,0,0.1)] z-40 sm:sticky sm:bottom-0 sm:rounded-b-lg sm:p-0 sm:border-0 sm:shadow-none sm:bg-transparent sm:mt-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card sm:p-6 sm:border sm:rounded-lg max-w-5xl mx-auto">
              <div className="flex flex-col items-center sm:items-start w-full sm:w-auto">
                <span className="text-sm text-muted-foreground">Total do Orçamento</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(totalGeral)}</span>
              </div>
              <Button type="submit" disabled={updateOrcamento.isPending} className="w-full sm:w-auto h-12 px-8">
                <Save className="mr-2 h-5 w-5" />
                {updateOrcamento.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
