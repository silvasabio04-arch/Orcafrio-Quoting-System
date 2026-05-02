import { Router } from "express";
import { z } from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

const sugestaoBodySchema = z.object({
  descricao: z.string().min(1),
  categoria: z.string().min(1),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

router.post("/sugestao-preco", async (req, res) => {
  const parsed = sugestaoBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", details: parsed.error.issues });
    return;
  }

  const { descricao, categoria, cidade, estado } = parsed.data;
  const regiao = cidade && estado ? `${cidade} - ${estado}` : cidade || estado || "Brasil";

  const prompt = `Você é um especialista em precificação de serviços de refrigeração e ar-condicionado no Brasil.

Com base nas informações abaixo, forneça uma estimativa de preço de mercado justo para cobrar pelo serviço:

- Categoria do serviço: ${categoria}
- Descrição do serviço: ${descricao}
- Região: ${regiao}

Responda SOMENTE com um JSON no seguinte formato, sem explicações adicionais:
{
  "precoMinimo": <número em reais, apenas o número>,
  "precoMaximo": <número em reais, apenas o número>,
  "precoSugerido": <número em reais, apenas o número, valor médio recomendado>,
  "justificativa": "<breve explicação em 1-2 frases de como chegou a esse valor>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      max_completion_tokens: 512,
      messages: [
        {
          role: "system",
          content: "Você é um especialista em precificação de serviços de refrigeração e ar-condicionado no Brasil. Responda SEMPRE em JSON válido, sem markdown, sem explicações extras.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = response.choices[0]?.message?.content ?? "";
    req.log.info({ content }, "AI response received");

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      req.log.error({ content, choices: response.choices }, "AI response did not contain JSON");
      res.status(500).json({ error: "Não foi possível gerar uma sugestão de preço" });
      return;
    }

    const resultado = JSON.parse(jsonMatch[0]);
    res.json({
      precoMinimo: Number(resultado.precoMinimo),
      precoMaximo: Number(resultado.precoMaximo),
      precoSugerido: Number(resultado.precoSugerido),
      justificativa: String(resultado.justificativa),
    });
  } catch (err) {
    req.log.error({ err }, "Erro ao consultar IA para sugestão de preço");
    res.status(500).json({ error: "Erro ao gerar sugestão de preço" });
  }
});

export default router;
