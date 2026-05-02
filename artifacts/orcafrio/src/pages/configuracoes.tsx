import { useRef, useState } from "react";
import { Eraser, PenTool, Save, Settings, User, Cpu, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { saveTecnicoProfile, useTecnicoProfile } from "@/lib/tecnico";

export default function Configuracoes() {
  const { toast } = useToast();
  const profile = useTecnicoProfile();
  const sigRef = useRef<SignaturePadHandle>(null);

  const [nome, setNome] = useState(profile.nome);
  const [endereco, setEndereco] = useState(profile.endereco);
  const [registroTecnico, setRegistroTecnico] = useState(profile.registroTecnico);
  const [veiculoTipo, setVeiculoTipo] = useState(profile.veiculoTipo);
  const [veiculoCombustivel, setVeiculoCombustivel] = useState(profile.veiculoCombustivel);
  const [veiculoModelo, setVeiculoModelo] = useState(profile.veiculoModelo);
  const [veiculoAno, setVeiculoAno] = useState(profile.veiculoAno);
  const [calibrando, setCalibrando] = useState(false);
  const [calibracaoResumo, setCalibracaoResumo] = useState(profile.veiculoCustoKm ? `Custo salvo: R$ ${Number(profile.veiculoCustoKm).toFixed(3)}/km` : "");
  const [hasSignature, setHasSignature] = useState(!!profile.assinatura);

  const handleCalibrarVeiculo = async () => {
    if (!veiculoTipo || !veiculoCombustivel) {
      toast({ title: "Preencha tipo e combustível do veículo primeiro", variant: "destructive" });
      return;
    }
    setCalibrando(true);
    setCalibracaoResumo("");
    try {
      const r = await fetch("/api/calibrar-veiculo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ veiculoTipo, veiculoCombustivel, veiculoModelo: veiculoModelo.trim() || undefined, veiculoAno: veiculoAno.trim() || undefined }),
      });
      if (!r.ok) throw new Error();
      const data: { custoKm: number; resumo: string } = await r.json();
      saveTecnicoProfile({ veiculoCustoKm: String(data.custoKm) });
      setCalibracaoResumo(data.resumo);
      toast({ title: "Veículo calibrado com sucesso!" });
    } catch {
      toast({ title: "Erro ao calibrar. Tente novamente.", variant: "destructive" });
    } finally {
      setCalibrando(false);
    }
  };

  const handleClearSignature = () => {
    sigRef.current?.clear();
    setHasSignature(false);
  };

  const handleSave = () => {
    let assinatura = profile.assinatura;
    if (sigRef.current && !sigRef.current.isEmpty()) {
      assinatura = sigRef.current.toDataURL();
    } else if (sigRef.current && sigRef.current.isEmpty()) {
      assinatura = "";
    }
    saveTecnicoProfile({
      nome: nome.trim(),
      endereco: endereco.trim(),
      registroTecnico: registroTecnico.trim(),
      veiculoTipo,
      veiculoCombustivel,
      veiculoModelo: veiculoModelo.trim(),
      veiculoAno: veiculoAno.trim(),
      assinatura,
    });
    toast({ title: "Configurações salvas no aparelho" });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Suas informações aparecem nos orçamentos enviados ao cliente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            Identificação do Técnico
          </CardTitle>
          <CardDescription>
            Salvo apenas neste aparelho — não é enviado para nenhum servidor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              placeholder="Ex: João Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
            />
            <p className="text-xs text-muted-foreground">
              Aparece no rodapé do orçamento (PDF e impressão)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="endereco">Endereço (ponto de partida)</Label>
            <Textarea
              id="endereco"
              placeholder="Rua, número - Bairro - Cidade/UF"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Usado pela IA para calcular a taxa de visita técnica
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="registro">Registro Técnico <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="registro"
              placeholder="Ex: CREA-SC 123456 ou CFT 78901"
              value={registroTecnico}
              onChange={(e) => setRegistroTecnico(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Aparece abaixo do seu nome no rodapé do orçamento (PDF)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de Veículo</Label>
              <Select value={veiculoTipo} onValueChange={setVeiculoTipo}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Moto">Moto</SelectItem>
                  <SelectItem value="Carro">Carro</SelectItem>
                  <SelectItem value="Van/Kombi">Van / Kombi</SelectItem>
                  <SelectItem value="Caminhonete/Pickup">Caminhonete / Pickup</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Combustível</Label>
              <Select value={veiculoCombustivel} onValueChange={setVeiculoCombustivel}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gasolina">Gasolina</SelectItem>
                  <SelectItem value="Etanol">Etanol</SelectItem>
                  <SelectItem value="Flex">Flex</SelectItem>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Elétrico">Elétrico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="veiculoModelo">Modelo</Label>
              <Input
                id="veiculoModelo"
                placeholder="Ex: Honda Biz 125"
                value={veiculoModelo}
                onChange={e => setVeiculoModelo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="veiculoAno">Ano</Label>
              <Input
                id="veiculoAno"
                placeholder="Ex: 2021"
                value={veiculoAno}
                onChange={e => setVeiculoAno(e.target.value)}
                maxLength={4}
              />
            </div>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-700">Calibrar veículo para IA</p>
                <p className="text-xs text-muted-foreground">
                  Calcula o custo real por km do seu veículo. Feito uma única vez — só refaça se trocar de veículo.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={handleCalibrarVeiculo}
                disabled={calibrando || !veiculoTipo || !veiculoCombustivel}
              >
                {calibrando
                  ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Calculando...</>
                  : <><Cpu className="mr-1.5 h-4 w-4" />Calibrar</>}
              </Button>
            </div>
            {calibracaoResumo && (
              <div className="flex items-start gap-2 text-xs text-green-700 bg-green-50 rounded-md p-2 border border-green-200">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>{calibracaoResumo}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PenTool className="h-5 w-5 text-muted-foreground" />
            Assinatura Digital
          </CardTitle>
          <CardDescription>
            Desenhe sua assinatura usando o dedo (no celular) ou o mouse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg bg-white overflow-hidden">
            <SignaturePad
              ref={sigRef}
              initialDataUrl={profile.assinatura || undefined}
              onChange={setHasSignature}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              {hasSignature ? "Assinatura preenchida" : "Em branco"}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearSignature}
            >
              <Eraser className="mr-2 h-4 w-4" /> Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} size="lg" className="w-full">
        <Save className="mr-2 h-4 w-4" /> Salvar Configurações
      </Button>
    </div>
  );
}
