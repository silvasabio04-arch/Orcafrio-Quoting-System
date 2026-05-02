import PDFDocument from 'pdfkit';
import { createWriteStream } from 'fs';

const doc = new PDFDocument({ size: 'A4', margin: 60 });
doc.pipe(createWriteStream('attached_assets/generated_images/orcafrio-acesso.pdf'));

const azul = '#1e40af';
const azulClaro = '#dbeafe';
const verde = '#15803d';
const cinza = '#6b7280';
const preto = '#111827';

// Fundo do cabeçalho
doc.rect(0, 0, doc.page.width, 160).fill(azul);

// Título
doc.fillColor('white')
   .fontSize(32)
   .font('Helvetica-Bold')
   .text('Orcafrio', 60, 50);

doc.fillColor('white')
   .fontSize(13)
   .font('Helvetica')
   .text('Sistema de Orçamentos com Inteligência Artificial', 60, 95);

doc.fillColor('#93c5fd')
   .fontSize(11)
   .text('Para técnicos de refrigeração e ar-condicionado', 60, 118);

// Corpo
doc.fillColor(preto).fontSize(14).font('Helvetica-Bold').text('Bem-vindo(a) ao Orcafrio!', 60, 185);

doc.fillColor(cinza).fontSize(11).font('Helvetica')
   .text('Obrigado pela sua compra. Seu acesso vitalício está ativo. Siga as instruções abaixo para começar a usar agora mesmo.', 60, 210, { width: 475, lineGap: 4 });

// Caixa de acesso
doc.rect(60, 255, 475, 80).fill(azulClaro).stroke('#bfdbfe');

doc.fillColor(azul).fontSize(12).font('Helvetica-Bold').text('🔗  Link de Acesso ao Sistema:', 80, 270);
doc.fillColor(azul).fontSize(13).font('Helvetica')
   .text('https://orcafrio-quoting-system.replit.app', 80, 293);

// Passo a passo
doc.fillColor(preto).fontSize(14).font('Helvetica-Bold').text('Como acessar:', 60, 360);

const passos = [
  'Abra o link acima no seu celular ou computador',
  'Clique em "Entrar com Google" e use seu e-mail',
  'Pronto! Seu acesso está liberado — pode começar a criar orçamentos',
];

passos.forEach((passo, i) => {
  const y = 390 + i * 38;
  doc.rect(60, y, 32, 32).fill(azul);
  doc.fillColor('white').fontSize(14).font('Helvetica-Bold').text(`${i + 1}`, 60, y + 8, { width: 32, align: 'center' });
  doc.fillColor(preto).fontSize(11).font('Helvetica').text(passo, 105, y + 10, { width: 430 });
});

// Recursos
doc.fillColor(preto).fontSize(14).font('Helvetica-Bold').text('O que você pode fazer:', 60, 515);

const recursos = [
  'Criar orçamentos profissionais em minutos',
  'Sugestão de preço mínimo, sugerido e máximo com IA',
  'Gerenciar clientes',
  'Enviar orçamentos pelo WhatsApp',
  'Gerar PDF com sua assinatura',
];

recursos.forEach((r, i) => {
  const y = 543 + i * 24;
  doc.fillColor(verde).fontSize(12).font('Helvetica-Bold').text('✓', 60, y);
  doc.fillColor(preto).fontSize(11).font('Helvetica').text(r, 80, y);
});

// Suporte
doc.rect(60, 680, 475, 70).fill('#f0fdf4').stroke('#bbf7d0');
doc.fillColor(verde).fontSize(12).font('Helvetica-Bold').text('💬  Suporte via WhatsApp:', 80, 695);
doc.fillColor(preto).fontSize(12).font('Helvetica').text('+55 (51) 99603-5124', 80, 716);

// Rodapé
doc.fillColor(cinza).fontSize(9).font('Helvetica')
   .text('Orcafrio © 2026 — Acesso vitalício. Sem mensalidade.', 60, 760, { align: 'center', width: 475 });

doc.end();
console.log('PDF gerado com sucesso!');
