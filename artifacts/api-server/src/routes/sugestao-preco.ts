import { Router } from "express";
import { z } from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const sugestaoBodySchema = z.object({
  descricao: z.string().trim().min(1).max(500),
  categoria: z.string().trim().min(1).max(100),
  cidade: z.string().trim().max(100).optional(),
  estado: z.string().trim().max(100).optional(),
});

const precoResponseSchema = z.object({
  precoMinimo: z.number().finite().nonnegative(),
  precoMaximo: z.number().finite().nonnegative(),
  precoSugerido: z.number().finite().nonnegative(),
  justificativa: z.string().min(1),
});

const deslocamentoBodySchema = z.object({
  enderecoTecnico: z.string().trim().min(1).max(300),
  enderecoCliente: z.string().trim().min(1).max(300),
  distanciaKm: z.number().finite().nonnegative().max(10000).nullable().optional(),
});

const deslocamentoResponseSchema = z.object({
  distanciaEstimadaKm: z.number().finite().nonnegative(),
  taxaMinima: z.number().finite().nonnegative(),
  taxaMaxima: z.number().finite().nonnegative(),
  taxaSugerida: z.number().finite().nonnegative(),
  justificativa: z.string().min(1),
});

router.post("/sugestao-preco", async (req, res) => {
  const parsed = sugestaoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.issues });
    return;
  }

  const { descricao, categoria, cidade, estado } = parsed.data;
  const regiao = cidade && estado ? `${cidade} - ${estado}` : cidade || estado || "Brasil";

  const prompt = `Estime o preço de mercado justo no Brasil para o seguinte serviço de refrigeração/ar-condicionado:

- Categoria: ${categoria}
- Descrição: ${descricao}
- Região: ${regiao}

Responda APENAS com este JSON (sem texto fora do JSON, sem markdown):
{"precoMinimo": <número>, "precoMaximo": <número>, "precoSugerido": <número médio>, "justificativa": "<1-2 frases curtas>"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: "Você é um especialista em precificação de serviços de refrigeração e ar-condicionado no Brasil. Responda SEMPRE em JSON válido, sem markdown, sem explicações fora do JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "";
    const finishReason = response.choices[0]?.finish_reason;

    if (!content) {
      req.log.error({ finishReason, choices: response.choices }, "AI returned empty content");
      res.status(500).json({ error: "A IA não conseguiu gerar uma sugestão. Tente novamente." });
      return;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ content }, "AI response did not contain JSON");
      res.status(500).json({ error: "Resposta da IA em formato inválido" });
      return;
    }

    const raw = JSON.parse(jsonMatch[0]);
    const normalized = {
      precoMinimo: Number(raw.precoMinimo),
      precoMaximo: Number(raw.precoMaximo),
      precoSugerido: Number(raw.precoSugerido),
      justificativa: String(raw.justificativa ?? ""),
    };
    const validated = precoResponseSchema.safeParse(normalized);
    if (!validated.success) {
      req.log.error({ raw, issues: validated.error.issues }, "Resposta da IA fora do esquema esperado");
      res.status(500).json({ error: "Resposta da IA em formato inválido" });
      return;
    }
    res.json(validated.data);
  } catch (err) {
    req.log.error({ err }, "Erro ao consultar IA para sugestão de preço");
    res.status(500).json({ error: "Erro ao gerar sugestão de preço" });
  }
});

router.post("/sugestao-deslocamento", async (req, res) => {
  const parsed = deslocamentoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.issues });
    return;
  }

  const { enderecoTecnico, enderecoCliente, distanciaKm } = parsed.data;

  const prompt = `Estime o valor justo a cobrar de TAXA DE DESLOCAMENTO para um técnico de refrigeração/ar-condicionado no Brasil, considerando:

- Endereço do técnico (origem): ${enderecoTecnico}
- Endereço do cliente (destino): ${enderecoCliente}
${typeof distanciaKm === "number" ? `- Distância informada: ${distanciaKm} km (ida)` : "- Distância não informada (estime com base nos endereços)"}

Considere:
- Preço médio da gasolina no Brasil (~R$ 6,00/litro)
- Consumo médio de veículo (~10 km/litro)
- Tempo do técnico (deslocamento ida e volta)
- Pedágios típicos da região (se aplicável)
- Praticas comuns do mercado de assistência técnica

Responda APENAS com este JSON (sem texto fora do JSON, sem markdown):
{"distanciaEstimadaKm": <número estimado em km, ida apenas>, "taxaMinima": <número em reais>, "taxaMaxima": <número em reais>, "taxaSugerida": <número em reais, valor médio recomendado>, "justificativa": "<1-2 frases explicando como chegou ao valor, citando km e custos>"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "system",
          content: "Você é um especialista em precificação de serviços de assistência técnica no Brasil, com conhecimento de geografia brasileira. Responda SEMPRE em JSON válido, sem markdown.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "";
    const finishReason = response.choices[0]?.finish_reason;

    if (!content) {
      req.log.error({ finishReason, choices: response.choices }, "AI returned empty content");
      res.status(500).json({ error: "A IA não conseguiu gerar uma sugestão. Tente novamente." });
      return;
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ content }, "AI response did not contain JSON");
      res.status(500).json({ error: "Resposta da IA em formato inválido" });
      return;
    }

    const raw = JSON.parse(jsonMatch[0]);
    const normalized = {
      distanciaEstimadaKm: Number(raw.distanciaEstimadaKm),
      taxaMinima: Number(raw.taxaMinima),
      taxaMaxima: Number(raw.taxaMaxima),
      taxaSugerida: Number(raw.taxaSugerida),
      justificativa: String(raw.justificativa ?? ""),
    };
    const validated = deslocamentoResponseSchema.safeParse(normalized);
    if (!validated.success) {
      req.log.error({ raw, issues: validated.error.issues }, "Resposta da IA fora do esquema esperado");
      res.status(500).json({ error: "Resposta da IA em formato inválido" });
      return;
    }
    res.json(validated.data);
  } catch (err) {
    req.log.error({ err }, "Erro ao consultar IA para sugestão de deslocamento");
    res.status(500).json({ error: "Erro ao gerar sugestão de deslocamento" });
  }
});

export default router;
