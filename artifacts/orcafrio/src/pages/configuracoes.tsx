import { useRef, useState } from "react";
import { Eraser, PenTool, Save, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { saveTecnicoProfile, useTecnicoProfile } from "@/lib/tecnico";

export default function Configuracoes() {
  const { toast } = useToast();
  const profile = useTecnicoProfile();
  const sigRef = useRef<SignaturePadHandle>(null);

  const [nome, setNome] = useState(profile.nome);
  const [endereco, setEndereco] = useState(profile.endereco);
  const [hasSignature, setHasSignature] = useState(!!profile.assinatura);

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
              Usado pela IA para calcular taxa de deslocamento
            </p>
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
