import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Plus, Trash2, ArrowLeft, Save, Sparkles, TrendingUp, MapPin, Car } from "lucide-react";
import { useListClientes, useCreateOrcamento, getListOrcamentosQueryKey, getGetDashboardResumoQueryKey, getGetOrcamentosRecentesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { CreateItemBodyCategoria } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/format";

const ENDERECO_TECNICO_KEY = "orcafrio:enderecoTecnico";

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

interface SugestaoPrecо {
  precoMinimo: number;
  precoMaximo: number;
  precoSugerido: number;
  justificativa: string;
}

interface SugestaoDeslocamento {
  distanciaEstimadaKm: number;
  taxaMinima: number;
  taxaMaxima: number;
  taxaSugerida: number;
  justificativa: string;
}

const CATEGORIA_LABELS: Record<string, string> = {
  manutencao_preventiva: "Manutenção Preventiva",
  higienizacao: "Higienização",
  instalacao: "Instalação",
  troca_compressor: "Troca de Compressor",
  carga_gas: "Carga de Gás",
  diagnostico: "Diagnóstico",
  conserto: "Conserto",
  mao_de_obra: "Mão de Obra",
  outros: "Outros",
};

export default function OrcamentoNovo() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [sugestoes, setSugestoes] = useState<Record<number, SugestaoPrecо>>({});
  const [loadingSugestao, setLoadingSugestao] = useState<Record<number, boolean>>({});

  const [enderecoTecnico, setEnderecoTecnico] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ENDERECO_TECNICO_KEY) ?? "";
  });
  const [distanciaKm, setDistanciaKm] = useState<string>("");
  const [sugestaoDeslocamento, setSugestaoDeslocamento] = useState<SugestaoDeslocamento | null>(null);
  const [loadingDeslocamento, setLoadingDeslocamento] = useState(false);

  const { data: clientes, isLoading: isLoadingClientes } = useListClientes();
  const createOrcamento = useCreateOrcamento();

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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "itens",
  });

  const watchedItens = form.watch("itens");
  const watchedClienteId = form.watch("clienteId");
  const clienteSelecionado = clientes?.find((c) => c.id === Number(watchedClienteId));
  const totalGeral = watchedItens.reduce((acc, item) => acc + (item.quantidade || 0) * (item.precoUnitario || 0), 0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (enderecoTecnico.trim()) {
      window.localStorage.setItem(ENDERECO_TECNICO_KEY, enderecoTecnico);
    } else {
      window.localStorage.removeItem(ENDERECO_TECNICO_KEY);
    }
  }, [enderecoTecnico]);

  useEffect(() => {
    setSugestaoDeslocamento(null);
  }, [watchedClienteId]);

  const buscarSugestaoDeslocamento = async () => {
    if (!enderecoTecnico.trim()) {
      toast({
        title: "Informe seu endereço",
        description: "Preencha o endereço de origem (técnico) para calcular o deslocamento.",
        variant: "destructive",
      });
      return;
    }
    if (!clienteSelecionado?.endereco) {
      toast({
        title: "Cliente sem endereço",
        description: "Selecione um cliente que tenha endereço cadastrado.",
        variant: "destructive",
      });
      return;
    }

    setLoadingDeslocamento(true);
    setSugestaoDeslocamento(null);

    try {
      const distanciaTrimmed = distanciaKm.trim();
      const distanciaParsed = distanciaTrimmed === "" ? null : Number(distanciaTrimmed);
      const response = await fetch("/api/sugestao-deslocamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enderecoTecnico: enderecoTecnico.trim(),
          enderecoCliente: clienteSelecionado.endereco,
          distanciaKm: distanciaParsed !== null && Number.isFinite(distanciaParsed) ? distanciaParsed : null,
        }),
      });

      if (!response.ok) throw new Error("Erro na resposta da API");

      const data: SugestaoDeslocamento = await response.json();
      setSugestaoDeslocamento(data);
    } catch {
      toast({
        title: "Erro ao calcular deslocamento",
        description: "Não foi possível obter a estimativa de deslocamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingDeslocamento(false);
    }
  };

  const adicionarDeslocamentoComoItem = (valor: number) => {
    const distancia = sugestaoDeslocamento?.distanciaEstimadaKm
      ? `${sugestaoDeslocamento.distanciaEstimadaKm} km`
      : "ida e volta";
    append({
      categoria: "outros",
      descricao: `Taxa de deslocamento (${distancia})`,
      quantidade: 1,
      precoUnitario: valor,
    });
    setSugestaoDeslocamento(null);
    toast({
      title: "Deslocamento adicionado",
      description: `Taxa de ${formatCurrency(valor)} adicionada aos itens do orçamento.`,
    });
  };

  const buscarSugestao = async (index: number) => {
    const item = watchedItens[index];
    if (!item?.descricao?.trim()) {
      toast({
        title: "Preencha a descrição",
        description: "Descreva o serviço para receber uma estimativa de preço.",
        variant: "destructive",
      });
      return;
    }

    setLoadingSugestao((prev) => ({ ...prev, [index]: true }));
    setSugestoes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    try {
      const response = await fetch("/api/sugestao-preco", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: item.descricao,
          categoria: CATEGORIA_LABELS[item.categoria] ?? item.categoria,
        }),
      });

      if (!response.ok) throw new Error("Erro na resposta da API");

      const data: SugestaoPrecо = await response.json();
      setSugestoes((prev) => ({ ...prev, [index]: data }));
    } catch {
      toast({
        title: "Erro ao buscar sugestão",
        description: "Não foi possível obter a estimativa de preço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoadingSugestao((prev) => ({ ...prev, [index]: false }));
    }
  };

  const aplicarSugestao = (index: number, preco: number) => {
    form.setValue(`itens.${index}.precoUnitario`, preco);
    setSugestoes((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const onSubmit = (data: OrcamentoFormValues) => {
    createOrcamento.mutate(
      { data },
      {
        onSuccess: (response) => {
          toast({
            title: "Orçamento criado",
            description: "Orçamento criado com sucesso.",
          });
          queryClient.invalidateQueries({ queryKey: getListOrcamentosQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardResumoQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetOrcamentosRecentesQueryKey() });
          setLocation(`/orcamentos/${response.id}`);
        },
        onError: () => {
          toast({
            title: "Erro ao criar orçamento",
            description: "Ocorreu um erro ao tentar salvar o orçamento.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-4">
        <Link href="/orcamentos">
          <Button variant="outline" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Orçamento</h1>
          <p className="text-muted-foreground">Preencha os detalhes do serviço</p>
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
            <CardHeader>
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-blue-600" />
                <CardTitle>Taxa de Deslocamento</CardTitle>
              </div>
              <CardDescription>
                Informe seu endereço de partida e a IA estima o valor justo a cobrar pela viagem até o cliente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium leading-none mb-2 block">
                  Endereço do Técnico (origem)
                </label>
                <Input
                  value={enderecoTecnico}
                  onChange={(e) => setEnderecoTecnico(e.target.value)}
                  placeholder="Ex: Rua das Acácias, 100 - Bairro X - São Paulo, SP"
                  className="h-12 sm:h-10 text-base sm:text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Salvo automaticamente para os próximos orçamentos
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium leading-none mb-2 block flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Endereço do Cliente (destino)
                  </label>
                  <Input
                    value={clienteSelecionado?.endereco ?? ""}
                    placeholder="Selecione um cliente acima"
                    readOnly
                    className="h-12 sm:h-10 text-base sm:text-sm bg-muted"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium leading-none mb-2 block">
                    Distância (km) — opcional
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanciaKm}
                    onChange={(e) => setDistanciaKm(e.target.value)}
                    placeholder="Deixe em branco para a IA estimar"
                    className="h-12 sm:h-10 text-base sm:text-sm"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={buscarSugestaoDeslocamento}
                disabled={loadingDeslocamento}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {loadingDeslocamento ? "Calculando..." : "Calcular Taxa de Deslocamento (IA)"}
              </Button>

              {sugestaoDeslocamento && (
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                    <TrendingUp className="h-4 w-4" />
                    Estimativa de Taxa de Deslocamento
                    {sugestaoDeslocamento.distanciaEstimadaKm > 0 && (
                      <span className="text-xs font-normal text-blue-600 ml-auto">
                        ~ {sugestaoDeslocamento.distanciaEstimadaKm} km (ida)
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-md p-2 border border-blue-100">
                      <span className="text-xs text-muted-foreground block">Mínimo</span>
                      <span className="font-semibold text-sm">{formatCurrency(sugestaoDeslocamento.taxaMinima)}</span>
                    </div>
                    <div className="bg-blue-600 rounded-md p-2 text-white">
                      <span className="text-xs opacity-80 block">Sugerido</span>
                      <span className="font-bold text-sm">{formatCurrency(sugestaoDeslocamento.taxaSugerida)}</span>
                    </div>
                    <div className="bg-white rounded-md p-2 border border-blue-100">
                      <span className="text-xs text-muted-foreground block">Máximo</span>
                      <span className="font-semibold text-sm">{formatCurrency(sugestaoDeslocamento.taxaMaxima)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{sugestaoDeslocamento.justificativa}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                      onClick={() => adicionarDeslocamentoComoItem(sugestaoDeslocamento.taxaSugerida)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar ao orçamento ({formatCurrency(sugestaoDeslocamento.taxaSugerida)})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-blue-200 text-blue-700"
                      onClick={() => adicionarDeslocamentoComoItem(sugestaoDeslocamento.taxaMinima)}
                    >
                      Usar mínimo
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-blue-200 text-blue-700"
                      onClick={() => adicionarDeslocamentoComoItem(sugestaoDeslocamento.taxaMaxima)}
                    >
                      Usar máximo
                    </Button>
                  </div>
                </div>
              )}
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
                const sugestao = sugestoes[index];
                const carregando = loadingSugestao[index] ?? false;

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
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                    <div className="grid gap-4 grid-cols-2 items-end">
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
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <FormLabel className="mb-0">Preço Unitário (R$)</FormLabel>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1"
                                onClick={() => buscarSugestao(index)}
                                disabled={carregando}
                              >
                                <Sparkles className="h-3 w-3" />
                                {carregando ? "Consultando..." : "Sugerir IA"}
                              </Button>
                            </div>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" {...field} className="h-12 sm:h-10 text-base sm:text-sm bg-background" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="col-span-2 p-3 bg-primary/10 rounded-md text-right">
                        <span className="text-xs text-muted-foreground block mb-1">Subtotal</span>
                        <span className="font-bold text-primary">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>

                    {sugestao && (
                      <div className="border border-violet-200 bg-violet-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-2 text-violet-700 font-medium text-sm">
                          <TrendingUp className="h-4 w-4" />
                          Estimativa de Mercado (IA)
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-md p-2 border border-violet-100">
                            <span className="text-xs text-muted-foreground block">Mínimo</span>
                            <span className="font-semibold text-sm">{formatCurrency(sugestao.precoMinimo)}</span>
                          </div>
                          <div className="bg-violet-600 rounded-md p-2 text-white relative">
                            <span className="text-xs opacity-80 block">Sugerido</span>
                            <span className="font-bold text-sm">{formatCurrency(sugestao.precoSugerido)}</span>
                          </div>
                          <div className="bg-white rounded-md p-2 border border-violet-100">
                            <span className="text-xs text-muted-foreground block">Máximo</span>
                            <span className="font-semibold text-sm">{formatCurrency(sugestao.precoMaximo)}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{sugestao.justificativa}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs"
                            onClick={() => aplicarSugestao(index, sugestao.precoSugerido)}
                          >
                            Usar valor sugerido ({formatCurrency(sugestao.precoSugerido)})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-violet-200 text-violet-700"
                            onClick={() => aplicarSugestao(index, sugestao.precoMinimo)}
                          >
                            Usar mínimo
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs border-violet-200 text-violet-700"
                            onClick={() => aplicarSugestao(index, sugestao.precoMaximo)}
                          >
                            Usar máximo
                          </Button>
                        </div>
                      </div>
                    )}
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

          <div className="bg-card p-4 border rounded-lg flex flex-col gap-3 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total do Orçamento</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(totalGeral)}</span>
            </div>
            <Button type="submit" disabled={createOrcamento.isPending} className="w-full h-12">
              <Save className="mr-2 h-5 w-5" />
              {createOrcamento.isPending ? "Salvando..." : "Salvar Orçamento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
