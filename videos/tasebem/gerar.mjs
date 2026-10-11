// Gera um vídeo por nicho (scene/<id>.html) a partir de um esqueleto comum de 60 s e dos dados de cada nicho.
//   node gerar.mjs            → escreve todos os ficheiros de cena e lista os ids
// Os tempos dos planos estão numa grelha de 0,5 s (120 batidas por minuto): cada corte cai numa batida da música.
// Todos os negócios, nomes, preços e domínios são EXEMPLOS fictícios para mostrar a plataforma.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const AQUI = path.dirname(fileURLToPath(import.meta.url));

const AM = '#F9BA17', TI = '#121214', LA = '#C2410C';
const T = (txt, o = {}) => ({ txt, ...o });

/* ── esqueleto comum (60 s) ── */
function filme(n) {
  const F = n.fem ? 'a' : 'o', TU = n.fem ? 'tua' : 'teu', SO = n.fem ? 'sozinha' : 'sozinho';
  const planos = [
    { ate: 1.5, tipo: 'texto', fundo: 'escuro', linhas: [T(n.hook[0], { tam: 150, cor: AM, modo: 'bate', a: -0.2 }), T(n.hook[1], { tam: 230, it: true, a: 0.3, modo: 'bate' }), T(n.hook[2], { tam: 140, a: 0.7 })], batidas: [0, 0.3] },
    { ate: 3.5, tipo: 'notifs', fundo: 'claro', a0: 0.05, passo: 0.32, itens: n.notifs, topoTitulo: 1120,
      linhas: [T(n.notifTitulo[0], { tam: 120, cor: TI, a: 0.2, sombra: false }), T(n.notifTitulo[1], { tam: 200, cor: TI, it: true, a: 0.45, modo: 'bate', sombra: false })] },
    { ate: 6.0, tipo: 'pilulas', fundo: 'claro', topo: 560, a0: 0.1, passo: 0.6, itens: n.problemas },
    { ate: 8.5, tipo: 'conversa', fundo: 'claro', topo: 700, a0: 0.1, passo: 0.55, msgs: n.conversa, topoTitulo: 220,
      linhas: [T(n.perdeTitulo[0], { tam: 110, cor: TI, sombra: false }), T(n.perdeTitulo[1], { tam: 150, cor: LA, it: true, sombra: false, a: 1.6, modo: 'bate' })] },
    { ate: 10.5, tipo: 'texto', fundo: 'fogo', batidas: [0.3, 1.1], linhas: [T(`E se ${F} ${TU}`, { tam: 120 }), T(n.nome, { tam: 220, it: true, a: 0.3, modo: 'bate' }),
      T(n.sozinho, { tam: 160, a: 0.7 }), T(`${SO}?`, { tam: 210, cor: TI, sombra: false, it: true, a: 1.1, modo: 'bate' })] },
    { ate: 12.0, tipo: 'texto', fundo: 'escuro', batidas: [0.5], linhas: [T('Com a', { tam: 110 }), T('Tá-se Bem', { tam: 190, fonte: 'redonda', minus: true, cor: AM, a: 0.5, modo: 'bate' })] },
    { ate: 19.0, tipo: 'app', fundo: 'escuro', negocio: n.negocio, topoTitulo: 120, descer: 170, escala: 1.12, linhas: [T(n.appTitulo || 'O cliente escolhe', { tam: 96, a: 0.05 })], ecras: n.ecras },
    { ate: 20.0, tipo: 'texto', fundo: 'preto', batidas: [0.12], linhas: [T('Sem', { tam: 130, cor: AM }), T(n.sem[0], { tam: 200, it: true, a: 0.12, modo: 'bate' })] },
    { ate: 21.0, tipo: 'texto', fundo: 'claro', batidas: [0.12], linhas: [T('Sem', { tam: 130, cor: LA, sombra: false }), T(n.sem[1], { tam: 200, cor: TI, it: true, sombra: false, a: 0.12, modo: 'bate' })] },
    { ate: 22.0, tipo: 'texto', fundo: 'amarelo', batidas: [0.12], linhas: [T('Sem', { tam: 130, cor: TI, sombra: false }), T(n.sem[2], { tam: 200, cor: TI, it: true, sombra: false, a: 0.12, modo: 'bate' })] },
    { ate: 23.5, tipo: 'app', fundo: 'escuro', negocio: n.negocio, descer: 40, escala: 1.1, rot: -3, ecras: [{ a: 0, ...n.feito }] },
    { ate: 25.0, tipo: 'texto', fundo: 'escuro', batidas: [0.3], linhas: [T(n.volta[0], { tam: 140 }), T(n.volta[1], { tam: 260, cor: AM, it: true, a: 0.3, modo: 'bate' })] },
    { ate: 30.0, ...n.destaque },
    { ate: 31.0, tipo: 'visto', fundo: 'verde', batidas: [0.05] },
    { ate: 33.5, tipo: 'texto', fundo: 'fogo', batidas: [0, 1.3], linhas: [T('E tu?', { tam: 200, it: true, modo: 'bate' }), T('Continuas', { tam: 150, a: 0.9 }), T(n.continuas, { tam: 190, cor: TI, sombra: false, it: true, a: 1.3, modo: 'bate' })] },
    { ate: 35.5, tipo: 'texto', fundo: 'claro', batidas: [0.4], linhas: [T('E acompanhas', { tam: 150, cor: TI, sombra: false, it: true }), T('tudo', { tam: 260, cor: LA, sombra: false, a: 0.4, modo: 'bate' })] },
    { ate: 36.5, tipo: 'texto', fundo: 'preto', batidas: [0.2], linhas: [T('em tempo', { tam: 150, cor: AM }), T('real', { tam: 300, a: 0.2, modo: 'bate' })] },
    { ate: 42.0, tipo: 'painel', fundo: 'escuro', topo: 560, topoTitulo: 110, a0: 0.6, passo: 0.22, ...n.painel,
      linhas: [T(n.painel.l[0], { tam: 120 }), T(n.painel.l[1], { tam: 110, cor: AM, a: 1.6 }), T(n.painel.l[2], { tam: 110, a: 3.2 })] },
    { ate: 46.0, tipo: 'pilulas', fundo: 'escuro', topo: 640, a0: 0.4, passo: 0.6, itens: n.modulos, topoTitulo: 200,
      linhas: [T('Tudo num', { tam: 120 }), T('só sítio', { tam: 190, cor: AM, it: true, a: 0.2, modo: 'bate' })] },
    { ate: 48.5, tipo: 'texto', fundo: 'claro', linhas: [T('Com o nome', { tam: 130, cor: TI, sombra: false }), T(n.nomeDe || `d${F} ${TU} ${n.nome}`, { tam: 130, cor: TI, sombra: false, it: true, a: 0.3 }),
      T(n.dominio, { tam: 90, fonte: 'redonda', minus: true, cor: LA, sombra: false, a: 0.9, modo: 'bate', mt: 40 })], batidas: [0.9] },
    { ate: 51.5, tipo: 'texto', fundo: 'fogo', batidas: [1.1], linhas: [T('A pergunta não é', { tam: 120 }), T(n.vaisTer || 'se vais ter', { tam: 150, a: 0.6 }), T(n.pergunta, { tam: 150, cor: TI, sombra: false, it: true, a: 1.1, modo: 'bate' })] },
    { ate: 54.5, tipo: 'texto', fundo: 'preto', batidas: [0.6], linhas: [T('É se vais ser', { tam: 130 }), T(n.primeiro || 'o primeiro', { tam: 230, cor: AM, it: true, a: 0.6, modo: 'bate' }), T(n.rua || 'da tua rua.', { tam: 150, a: 1.2 })] },
    { ate: 60, tipo: 'logo', fundo: 'preto', slogan: n.slogan, botao: 'tassbem.pt', rodape: 'WhatsApp +351 933 748 892', semEntrada: true },
  ];
  return planos;
}

/* grelha do painel: 3 colunas × N linhas, com buracos fixos para parecer uma agenda real */
const BURACOS = new Set([1, 8, 10, 12, 17]);
function grelha(rotulos, linhas = 7) {
  const out = []; let k = 0;
  for (let i = 0; i < 3 * linhas; i++) out.push(BURACOS.has(i) ? '' : rotulos[k++ % rotulos.length]);
  return out;
}

/* ── conceitos: o que é comum dentro de cada um ── */
const chamada = (quem) => ({ titulo: 'Chamada perdida', texto: quem, icone: '☎', cor: '#e5e7eb' });
const dm = (rede, txt) => ({ titulo: rede, texto: txt, icone: rede === 'Instagram' ? 'IG' : rede === 'WhatsApp' ? 'WA' : '@', cor: '#e5e7eb' });

function conceitoA(n) {
  return {
    sozinho: n.fem ? 'marcasse' : 'marcasse', perdeTitulo: ['E o cliente', 'vai a outro lado'],
    problemas: ['Chamada perdida', 'DM por responder', 'Cliente que faltou'], sem: ['chamadas.', 'mensagens.', 'confusões.'],
    volta: ['E o cliente', 'volta.'], pergunta: 'marcações online', modulos: ['Site', 'Marcações', 'Fidelização', 'Painel do dono'],
    slogan: 'Site · Marcações · Fidelização · Painel',
    ecras: [
      { a: 0.0, passo: '1 · Serviço', escolhe: 1, toque: 0.9, opcoes: n.servicos },
      { a: 1.5, passo: `2 · ${n.quemTitulo || 'Profissional'}`, escolhe: 1, toque: 0.8, opcoes: n.equipa.map((e, i) => [e, n.equipaSub ? n.equipaSub[i] : i === 3 ? 'folga hoje' : 'disponível']) },
      { a: 3.0, passo: '3 · Dia', escolhe: 2, toque: 0.7, opcoes: [['Hoje', 'qui 16'], ['Amanhã', 'sex 17'], ['Sábado', 'sáb 18'], ['Terça', 'ter 21']] },
      { a: 4.3, passo: '4 · Hora · sáb 18', escolhe: 4, toque: 1.4, nota: 'Só aparecem horários livres',
        grelha: ['09:00', 'x09:30', 'x10:00', 'x10:15', '10:30', '11:15', 'x11:45', '12:00', 'x14:30', '15:00', 'x15:45', '16:30'] }],
    feito: { passo: 'Marcação confirmada', feito: 'Marcado!', detalhes: [`${n.servicos[1][0]} · com ${n.equipa[1]}`, 'Sábado, 18 · 10:30'] },
    destaque: { tipo: 'carimbos', fundo: 'claro', negocio: n.negocio, n: 5, a0: 0.9, passo: 0.55, simbolo: n.simbolo, premio: '50%', regra: n.regra, topo: 820, topoTitulo: 260, batidas: [3.1],
      linhas: [T(n.cadaTitulo[0], { tam: 150, cor: TI, sombra: false }), T(n.cadaTitulo[1], { tam: 240, cor: LA, it: true, sombra: false, a: 0.3, modo: 'bate' })] },
    painel: { titulo: n.painelTitulo || `${n.negocio} · sábado`, colunas: n.painelColunas || n.equipa.slice(0, 3), horas: ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'],
      marcacoes: grelha(n.curtos), l: [n.painelL0 || 'A agenda do dia', n.cadaLinha, 'cada cliente'],
      contadores: [{ rotulo: 'marcações<br>hoje', ate: 'auto' }, { rotulo: 'clientes<br>no cartão', de: 0, ate: 86, a: 0.8, dur: 3.6 }] },
  };
}
function conceitoB(n) {
  return {
    sozinho: 'recebesse os pedidos', perdeTitulo: ['E o cliente', 'pede noutro lado'],
    problemas: ['Telefone sempre a tocar', 'Pedidos por DM', 'Encomenda trocada'], sem: ['chamadas.', 'papelinhos.', 'enganos.'],
    volta: ['E o pedido', 'chega-te.'], pergunta: n.pergunta || 'pedidos online', modulos: ['Site e menu', 'Encomendas', 'Reservas de mesa', 'Painel do dono'],
    slogan: 'Site · Encomendas · Reservas · Painel',
    feito: n.feito,
    destaque: { tipo: 'notifs', fundo: 'escuro', a0: 0.6, passo: 0.75, itens: n.pedidos.map((x) => ({ titulo: x[0], texto: x[1], icone: '✓', quando: 'agora' })), topoTitulo: 1120, batidas: [0.6, 1.35, 2.1, 2.85],
      linhas: [T('Os pedidos', { tam: 130 }), T('a chegar', { tam: 200, cor: AM, it: true, a: 0.3, modo: 'bate' }), T('em tempo real', { tam: 110, a: 0.6 })] },
    painel: { titulo: `${n.negocio} · hoje`, colunas: n.painelColunas || ['Mesa', 'Takeaway', 'Entrega'], horas: n.horasPainel || ['12:00', '12:30', '13:00', '19:30', '20:00', '20:30', '21:00'],
      marcacoes: n.marcacoes || grelha(n.curtos), l: ['O dia todo', 'cada pedido', 'cada cliente'],
      contadores: [{ rotulo: n.cont1 || 'pedidos<br>hoje', ate: 'auto' }, { rotulo: n.cont2 || 'reservas<br>de mesa', ate: 'auto', filtro: n.filtro2 || 'Mesa' }] },
  };
}
function conceitoC(n) {
  return {
    sozinho: 'tratasse dos pedidos', perdeTitulo: ['E o cliente', 'vai a outro lado'],
    problemas: ['Orçamento por responder', 'Chamada perdida', n.esquecido || 'Revisão esquecida'], sem: ['chamadas.', 'papéis.', 'esquecimentos.'],
    volta: ['E o cliente', 'acompanha.'], pergunta: n.pergunta || 'pedidos online', modulos: ['Site', 'Marcações', 'Orçamentos', 'Histórico + lembretes'],
    slogan: 'Site · Marcações · Orçamentos · Lembretes',
    ecras: [
      { a: 0.0, passo: '1 · O que precisas?', escolhe: n.pedeOrcamento ? 1 : 0, toque: 0.8, opcoes: [['Pedir marcação', 'escolhe dia e hora'], ['Pedir orçamento', 'resposta no telemóvel'], ['Ver o meu histórico', ''], ['Falar connosco', '']] },
      { a: 1.5, passo: '2 · Serviço', escolhe: n.escolheServico ?? 0, toque: 0.8, opcoes: n.servicos },
      { a: 3.0, passo: `3 · ${n.diaTitulo || 'Dia'}`, escolhe: 2, toque: 0.7, opcoes: [['Amanhã', 'sex 17'], ['Segunda', 'seg 20'], ['Terça', 'ter 21'], ['Quarta', 'qua 22']] },
      { a: 4.3, passo: `4 · Hora · ter 21`, escolhe: 4, toque: 1.4, nota: 'Só aparecem horários livres',
        grelha: ['08:30', 'x09:00', 'x09:30', 'x10:00', '10:30', '11:00', 'x11:30', '14:00', 'x14:30', '15:00', 'x16:00', '17:00'] }],
    feito: n.feito,
    destaque: { tipo: 'percurso', fundo: 'escuro', etapas: n.etapas, lembrete: { titulo: 'Lembrete', texto: n.lembrete, icone: '!', quando: n.lembreteQuando || 'agora' },
      a0: 0.5, passo: 0.75, topo: 560, topoTitulo: 140, linhas: [T('Do pedido', { tam: 120 }), T('ao histórico', { tam: 170, cor: AM, it: true, a: 0.25, modo: 'bate' })] },
    painel: { titulo: `${n.negocio} · semana`, colunas: n.equipa, horas: ['Seg 20', 'Ter 21', 'Qua 22', 'Qui 23', 'Sex 24', 'Sáb 25', 'Seg 27'],
      marcacoes: grelha(n.curtos), l: ['A semana toda', n.cadaLinha, 'cada cliente'],
      contadores: [{ rotulo: 'trabalhos<br>marcados', ate: 'auto' }, { rotulo: 'orçamentos<br>aceites', ate: 'auto', filtro: 'Orç' }] },
  };
}
function conceitoD1(n) {
  return {
    sozinho: n.sozinho || 'vendesse a noite', perdeTitulo: ['E o grupo', 'vai a outro lado'],
    problemas: n.problemas || ['Guest list no papel', 'Mesas VIP por DM', 'Bilhetes à porta'], sem: n.sem || ['DMs.', 'listas em papel.', 'confusões.'],
    volta: n.volta || ['Entra', 'com QR.'], pergunta: n.pergunta || 'bilhetes online', modulos: n.modulos || ['Bilhetes com QR', 'Guest list', 'Mesas VIP', 'Eventos privados'],
    slogan: n.slogan || 'Bilhetes · Guest list · Mesas VIP · Eventos',
    destaque: { tipo: 'planta', fundo: 'escuro', palco: n.palco || 'DJ', centro: n.centro || 'PISTA', topo: 640, topoTitulo: 170, a0: 0.8, passo: 0.45, mesas: n.mesas,
      linhas: [T(n.plantaTitulo[0], { tam: 130 }), T(n.plantaTitulo[1], { tam: 190, cor: AM, it: true, a: 0.25, modo: 'bate' })] },
    painel: { titulo: n.painelTitulo, colunas: n.painelColunas, horas: n.horas, marcacoes: grelha(n.curtos, n.horas.length), l: n.painelLinhas,
      contadores: [{ rotulo: n.cont1, ate: 'auto' }, { rotulo: n.cont2, ate: 'auto', filtro: n.filtro2 }] },
  };
}
function conceitoD2(n) {
  return {
    sozinho: 'vendesse direto', perdeTitulo: ['E o hóspede', 'reserva noutro lado'],
    problemas: ['Comissão em cada reserva', 'Calendários duplicados', 'Reservas por email'], sem: ['comissões.', 'reservas duplicadas.', 'emails perdidos.'],
    volta: ['Reserva', 'direta.'], pergunta: 'reservas diretas', modulos: ['Site', 'Reservas diretas', 'Preços por época', 'Sync Airbnb e Booking'],
    slogan: 'Site · Reservas diretas · Épocas · Sync',
    feito: { passo: 'Reserva confirmada', feito: 'Reservado!', detalhes: [`${n.quartos[1][0]} · 2 noites`, '14 – 16 ago · 2 hóspedes', 'Reserva direta · sem comissão'] },
    ecras: [
      { a: 0.0, passo: '1 · Datas · agosto', escolhe: 4, toque: 1.2, nota: 'Só aparecem noites livres', grelha: ['10', 'x11', 'x12', 'x13', '14', '15', 'x16', '17', 'x18', '19', '20', 'x21'] },
      { a: 2.2, passo: `2 · ${n.unidade || 'Quarto'} · 14–16 ago`, escolhe: 1, toque: 0.8, opcoes: n.quartos },
      { a: 3.8, passo: '3 · Hóspedes', escolhe: 1, toque: 0.7, opcoes: [['1 hóspede', ''], ['2 hóspedes', ''], ['3 hóspedes', ''], ['4 hóspedes', '']] },
      { a: 5.3, passo: '4 · Resumo', escolhe: 3, toque: 0.8, opcoes: [[n.quartos[1][0], n.quartos[1][1]], ['2 noites · época alta', `${2 * n.precoAlta} €`], ['Comissão', '0 €'], ['Confirmar reserva', '→']] }],
    destaque: { tipo: 'sync', fundo: 'escuro', canais: ['Airbnb', 'Booking'], centro: n.dominio, topo: 620, topoTitulo: 150,
      chips: [['Época baixa', `${n.precoBaixa} €`], ['Época média', `${n.precoMedia} €`], ['Época alta', `${n.precoAlta} €`]], chipAtivo: 2,
      linhas: [T('Calendário', { tam: 130 }), T('sincronizado', { tam: 170, cor: AM, it: true, a: 0.25, modo: 'bate' })] },
    painel: { titulo: `${n.negocio} · agosto`, colunas: n.painelColunas, horas: ['seg 10', 'ter 11', 'qua 12', 'qui 13', 'sex 14', 'sáb 15', 'dom 16'],
      marcacoes: grelha(['Direto', 'Airbnb', 'Direto', 'Booking', 'Direto']), l: ['O mês inteiro', `cada ${n.cadaUnidade || 'quarto'}`, 'cada reserva'],
      contadores: [{ rotulo: 'noites<br>reservadas', ate: 'auto' }, { rotulo: 'reservas<br>diretas', ate: 'auto', filtro: 'Direto' }] },
  };
}

/* ── os 26 nichos ── */
const NICHOS = [
  // A — Marcações
  { id: 'A-barbearia', c: 'A', nome: 'barbearia', fem: true, negocio: 'Barbearia do Rui', dominio: 'barbeariadorui.pt', hook: ['Enquanto', 'cortas', 'um cabelo…'], continuas: 'a cortar.',
    notifs: [chamada('João Ferreira'), chamada('+351 912 ••• •••'), chamada('Miguel Costa'), dm('Instagram', 'tiago.m: tens vaga amanhã?')], notifTitulo: ['O telemóvel', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Tiago', txt: 'Boas! Tens vaga sábado de manhã?', hora: '09:12' }, { de: 'ele', nome: 'Tiago', txt: 'Olá??', hora: '11:40' }, { de: 'ele', nome: 'Tiago', txt: 'Esquece, já marquei noutro lado. Abraço', hora: '13:05' }],
    servicos: [['Corte', '12 € · 30 min'], ['Corte + Barba', '18 € · 45 min'], ['Barba', '8 € · 20 min'], ['Corte criança', '10 € · 25 min']], quemTitulo: 'Barbeiro', equipa: ['Qualquer um', 'Rui', 'Tiago', 'Hugo'],
    painelColunas: ['Rui', 'Tiago', 'Hugo'], simbolo: '✂', regra: 'Ao 5.º corte: 50% de desconto', cadaTitulo: ['Cada corte', 'conta'], cadaLinha: 'cada barbeiro', curtos: ['Corte', 'Corte+B', 'Barba', 'Corte', 'Corte+B'] },
  { id: 'A-cabeleireiro', c: 'A', nome: 'cabeleireiro', fem: false, negocio: 'Salão Inês Matos', dominio: 'salaoinesmatos.pt', volta: ['E a cliente', 'volta.'], perdeTitulo: ['E a cliente', 'vai a outro lado'], hook: ['Enquanto', 'fazes', 'um brushing…'], continuas: 'a fazer cabelos.',
    notifs: [chamada('Sandra Lopes'), chamada('+351 936 ••• •••'), dm('WhatsApp', 'Ana: tem vaga para madeixas?'), chamada('Rita Pinto')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Ana', txt: 'Olá! Tem vaga para madeixas no sábado?', hora: '10:02' }, { de: 'ele', nome: 'Ana', txt: 'Consegue dizer-me alguma coisa?', hora: '15:31' }, { de: 'ele', nome: 'Ana', txt: 'Já marquei noutro salão, obrigada!', hora: '18:44' }],
    servicos: [['Corte senhora', '25 € · 45 min'], ['Brushing', '15 € · 30 min'], ['Madeixas', '55 € · 2 h'], ['Coloração', '40 € · 1h30']], quemTitulo: 'Cabeleireira', equipa: ['Qualquer uma', 'Inês', 'Carla', 'Sofia'],
    painelColunas: ['Inês', 'Carla', 'Sofia'], simbolo: '✂', regra: 'Ao 5.º brushing: 50% de desconto', cadaTitulo: ['Cada visita', 'conta'], cadaLinha: 'cada cabeleireira', curtos: ['Brushing', 'Corte', 'Madeixas', 'Cor', 'Brushing'] },
  { id: 'A-estetica', c: 'A', nome: 'clínica de estética', fem: true, negocio: 'Espaço Aura', dominio: 'espacoaura.pt', volta: ['E a cliente', 'volta.'], perdeTitulo: ['E a cliente', 'vai a outro lado'], hook: ['Enquanto', 'fazes', 'uma limpeza de pele…'], continuas: 'a cuidar de peles.',
    notifs: [chamada('Marta Reis'), dm('Instagram', 'joana.s: quanto é o laser?'), chamada('+351 918 ••• •••'), chamada('Catarina Dias')], notifTitulo: ['O telemóvel', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Joana', txt: 'Olá! Quanto custa a limpeza de pele? Têm vaga esta semana?', hora: '09:40' }, { de: 'ele', nome: 'Joana', txt: 'Olá?', hora: '14:12' }, { de: 'ele', nome: 'Joana', txt: 'Já arranjei noutro sítio, obrigada', hora: '19:03' }],
    servicos: [['Limpeza de pele', '45 € · 60 min'], ['Depilação a laser', '35 € · 30 min'], ['Massagem facial', '30 € · 40 min'], ['Microblading', '150 € · 2 h']], quemTitulo: 'Esteticista', equipa: ['Qualquer uma', 'Ana', 'Joana', 'Rita'],
    painelColunas: ['Ana', 'Joana', 'Rita'], simbolo: '✦', regra: 'Ao 5.º tratamento: 50% de desconto', cadaTitulo: ['Cada tratamento', 'conta'], cadaLinha: 'cada esteticista', curtos: ['Laser', 'Limpeza', 'Facial', 'Laser', 'Limpeza'] },
  { id: 'A-unhas', c: 'A', nome: 'manicure', fem: true, negocio: 'Nails by Bia', dominio: 'nailsbybia.pt', volta: ['E a cliente', 'volta.'], perdeTitulo: ['E a cliente', 'vai a outro lado'], hook: ['Enquanto', 'pintas', 'umas unhas…'], continuas: 'a pintar unhas.',
    notifs: [dm('Instagram', 'lara.c: tens vaga sexta para gel?'), chamada('Mónica Alves'), dm('WhatsApp', 'Rita: dá para amanhã?'), chamada('+351 925 ••• •••')], notifTitulo: ['As DMs', 'não param'],
    conversa: [{ de: 'ele', nome: 'Lara', txt: 'Olá! Tens vaga sexta para gel? 💅'.replace(' 💅', ''), hora: '08:55' }, { de: 'ele', nome: 'Lara', txt: 'Bia?', hora: '12:20' }, { de: 'ele', nome: 'Lara', txt: 'Já marquei noutra, fica para a próxima', hora: '16:48' }],
    servicos: [['Unhas de gel', '25 € · 1 h'], ['Verniz gel', '18 € · 45 min'], ['Manutenção', '20 € · 1 h'], ['Pedicure', '22 € · 50 min']], quemTitulo: 'Manicure', equipa: ['Qualquer uma', 'Bia', 'Lara', 'Mónica'],
    painelColunas: ['Bia', 'Lara', 'Mónica'], simbolo: '♥', regra: 'À 5.ª manicure: 50% de desconto', cadaTitulo: ['Cada manicure', 'conta'], cadaLinha: 'cada manicure', curtos: ['Gel', 'Verniz', 'Manut.', 'Gel', 'Pedicure'] },
  { id: 'A-massagens', c: 'A', nome: 'casa de massagens', fem: true, negocio: 'Spa Equilíbrio', dominio: 'spaequilibrio.pt', hook: ['Enquanto', 'dás', 'uma massagem…'], continuas: 'a dar massagens.',
    notifs: [chamada('Pedro Nunes'), chamada('+351 913 ••• •••'), dm('WhatsApp', 'Vera: têm vaga para 2 sábado?'), chamada('Luísa Mota')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Vera', txt: 'Boa tarde! Têm vaga para massagem a dois no sábado?', hora: '11:15' }, { de: 'ele', nome: 'Vera', txt: 'É para oferecer, preciso de saber hoje', hora: '15:02' }, { de: 'ele', nome: 'Vera', txt: 'Já reservei noutro spa, obrigada', hora: '18:30' }],
    servicos: [['Relaxante', '45 € · 60 min'], ['Desportiva', '50 € · 60 min'], ['Pedras quentes', '60 € · 75 min'], ['Drenagem', '40 € · 50 min']], quemTitulo: 'Terapeuta', equipa: ['Qualquer um', 'Paula', 'Nuno', 'Vera'],
    painelColunas: ['Paula', 'Nuno', 'Vera'], simbolo: '✦', regra: 'À 5.ª massagem: 50% de desconto', cadaTitulo: ['Cada massagem', 'conta'], cadaLinha: 'cada terapeuta', curtos: ['Relax', 'Desport.', 'Pedras', 'Relax', 'Drenagem'] },
  { id: 'A-tatuagens', c: 'A', nome: 'estúdio de tatuagens', fem: false, negocio: 'Estúdio Tinta Viva', dominio: 'tintaviva.pt', hook: ['Enquanto', 'tatuas', 'um braço…'], continuas: 'a tatuar.',
    notifs: [dm('Instagram', 'duarte.r: quanto fica esta tattoo?'), dm('Instagram', 'filipa: tens agenda em maio?'), chamada('André Lima'), dm('WhatsApp', 'Rui: dá para piercing hoje?')], notifTitulo: ['As DMs', 'não param'],
    conversa: [{ de: 'ele', nome: 'Duarte', txt: 'Boas! Quanto fica uma tattoo pequena no pulso? Tens agenda?', hora: '10:20' }, { de: 'ele', nome: 'Duarte', txt: '??', hora: '16:05' }, { de: 'ele', nome: 'Duarte', txt: 'Já marquei noutro estúdio. Abraço', hora: '21:40' }],
    servicos: [['Tattoo pequena', 'desde 60 € · 1 h'], ['Sessão completa', 'desde 250 € · 4 h'], ['Piercing', '25 € · 20 min'], ['Consulta de design', 'grátis · 30 min']], quemTitulo: 'Artista', equipa: ['Qualquer um', 'André', 'Filipa', 'Duarte'],
    painelColunas: ['André', 'Filipa', 'Duarte'], simbolo: '✒', regra: 'À 5.ª sessão: 50% de desconto', cadaTitulo: ['Cada sessão', 'conta'], cadaLinha: 'cada artista', curtos: ['Tattoo', 'Sessão', 'Piercing', 'Consulta', 'Tattoo'] },
  { id: 'A-personal-trainer', c: 'A', nome: 'agenda', fem: true, nomeDe: 'do teu negócio', painelTitulo: 'Treino com Diogo · semana', painelL0: 'A semana toda', negocio: 'Treino com Diogo', dominio: 'treinocomdiogo.pt', hook: ['Enquanto', 'dás', 'um treino…'], continuas: 'a treinar clientes.',
    notifs: [dm('WhatsApp', 'Inês: amanhã às 7h dá?'), chamada('Carlos Sá'), dm('Instagram', 'marco.f: fazes avaliação?'), dm('WhatsApp', 'Inês: ???')], notifTitulo: ['O WhatsApp', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Marco', txt: 'Boas Diogo! Fazes avaliação física? Quando tens vaga?', hora: '07:30' }, { de: 'ele', nome: 'Marco', txt: 'Diz qualquer coisa', hora: '13:10' }, { de: 'ele', nome: 'Marco', txt: 'Já me inscrevi com outro PT, obrigado', hora: '20:15' }],
    servicos: [['Treino individual', '30 € · 1 h'], ['Treino a dois', '40 € · 1 h'], ['Avaliação física', 'grátis · 30 min'], ['Pack 10 treinos', '250 €']], quemTitulo: 'Local', equipa: ['Ginásio', 'Ar livre', 'Online', 'Ao domicílio'], equipaSub: ['Boavista', 'Parque da Cidade', 'videochamada', 'zona Porto'],
    feito: { passo: 'Marcação confirmada', feito: 'Marcado!', detalhes: ['Treino a dois · ar livre', 'Sábado, 18 · 10:30'] },
    painelColunas: ['Seg', 'Ter', 'Qua'], simbolo: '★', regra: 'Ao 5.º treino: 50% de desconto', cadaTitulo: ['Cada treino', 'conta'], cadaLinha: 'cada treino', curtos: ['Inês', 'Marco', 'Carlos', 'Rita', 'Duo'] },

  // B — Restauração e encomendas
  { id: 'B-restaurante', c: 'B', nome: 'restaurante', fem: false, negocio: 'Restaurante O Lavrador', dominio: 'olavrador.pt', hook: ['Enquanto', 'serves', 'o almoço…'], continuas: 'a cozinhar.',
    notifs: [chamada('Reserva? · +351 917 ••• •••'), chamada('Paulo Santos'), dm('Instagram', 'sara.m: têm mesa para 6 hoje?'), chamada('+351 926 ••• •••')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Sara', txt: 'Boa tarde! Têm mesa para 6 hoje às 20h30?', hora: '17:02' }, { de: 'ele', nome: 'Sara', txt: 'Alguém?', hora: '18:15' }, { de: 'ele', nome: 'Sara', txt: 'Já reservámos noutro restaurante, obrigada', hora: '19:00' }],
    ecras: [
      { a: 0.0, passo: '1 · Como queres?', escolhe: 0, toque: 0.8, opcoes: [['Reservar mesa', ''], ['Takeaway', 'recolha'], ['Entrega', 'até 5 km'], ['Ver menu', '']] },
      { a: 1.5, passo: '2 · Pessoas', escolhe: 1, toque: 0.7, opcoes: [['2 pessoas', ''], ['4 pessoas', ''], ['6 pessoas', ''], ['8 ou mais', '']] },
      { a: 3.0, passo: '3 · Dia', escolhe: 2, toque: 0.7, opcoes: [['Hoje', 'qui 16'], ['Amanhã', 'sex 17'], ['Sábado', 'sáb 18'], ['Domingo', 'dom 19']] },
      { a: 4.3, passo: '4 · Hora · sáb 18', escolhe: 4, toque: 1.4, nota: 'Só aparecem mesas livres', grelha: ['12:30', 'x13:00', 'x13:30', 'x19:30', '20:00', '20:30', 'x21:00', '21:30', 'x22:00', '12:00', 'x14:00', '22:30'] }],
    feito: { passo: 'Reserva confirmada', feito: 'Mesa reservada!', detalhes: ['4 pessoas', 'Sábado, 18 · 20:00'] },
    pedidos: [['Nova reserva · Mesa 7', '4 pessoas · sáb 20:00'], ['Takeaway #214', '2× Francesinha · 13:15'], ['Entrega #215', 'Polvo à lagareiro · 20:30'], ['Nova reserva · Mesa 2', '6 pessoas · dom 13:00']],
    curtos: ['Mesa 7 · 4p', 'Francesinha', 'Polvo', 'Mesa 2 · 6p', 'Bacalhau'] },
  { id: 'B-pizzaria', c: 'B', nome: 'pizzaria', fem: true, negocio: 'Pizzaria Forno Vivo', dominio: 'fornovivo.pt', hook: ['Enquanto', 'tiras', 'a pizza do forno…'], continuas: 'a fazer pizzas.',
    notifs: [chamada('+351 914 ••• •••'), chamada('Bruno Teixeira'), dm('Instagram', 'nuno.p: entregam no Bonfim?'), chamada('+351 932 ••• •••')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Nuno', txt: 'Boas! Entregam no Bonfim? Queria 2 familiares', hora: '19:41' }, { de: 'ele', nome: 'Nuno', txt: 'Olá?', hora: '20:05' }, { de: 'ele', nome: 'Nuno', txt: 'Esquece, já pedi noutro lado', hora: '20:22' }],
    ecras: [
      { a: 0.0, passo: '1 · Menu', escolhe: 0, toque: 0.8, opcoes: [['Margherita', '9,50 €'], ['Diavola', '11 €'], ['Quatro queijos', '11,50 €'], ['Calzone', '12 €']] },
      { a: 1.5, passo: '2 · Tamanho', escolhe: 2, toque: 0.7, opcoes: [['Individual', '9,50 €'], ['Média', '13 €'], ['Familiar', '17 €'], ['+ Extra queijo', '1,50 €']] },
      { a: 3.0, passo: '3 · Como queres?', escolhe: 1, toque: 0.7, opcoes: [['Takeaway', 'recolha'], ['Entrega', 'até 5 km'], ['Comer cá', 'reservar mesa'], ['Agendar', 'para mais tarde']] },
      { a: 4.3, passo: '4 · Hora de entrega', escolhe: 4, toque: 1.4, nota: 'Só aparecem horas disponíveis', grelha: ['19:30', 'x19:45', 'x20:00', 'x20:15', '20:30', '20:45', 'x21:00', '21:15', 'x21:30', '21:45', 'x22:00', '22:15'] }],
    feito: { passo: 'Pedido confirmado', feito: 'Pedido feito!', detalhes: ['Margherita familiar · entrega', 'Hoje · 20:30'] },
    pedidos: [['Entrega #318', 'Margherita familiar · 20:30'], ['Takeaway #319', '2× Diavola · 20:15'], ['Entrega #320', 'Calzone + Quatro queijos · 20:45'], ['Nova reserva · Mesa 4', '5 pessoas · sex 21:00']],
    curtos: ['Margherita', 'Diavola', 'Mesa 4 · 5p', 'Calzone', '4 queijos'] },
  { id: 'B-sushi', c: 'B', nome: 'restaurante de sushi', fem: false, negocio: 'Sushi Kaze', dominio: 'sushikaze.pt', hook: ['Enquanto', 'enrolas', 'um uramaki…'], continuas: 'a fazer sushi.',
    notifs: [chamada('+351 915 ••• •••'), dm('Instagram', 'mariana: fazem entregas hoje?'), chamada('Ricardo Gomes'), dm('WhatsApp', 'Joana: combinado 40 peças?')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Mariana', txt: 'Olá! Fazem entregas hoje? Queria um combinado de 40 peças', hora: '19:10' }, { de: 'ele', nome: 'Mariana', txt: 'Ainda dá?', hora: '19:48' }, { de: 'ele', nome: 'Mariana', txt: 'Já pedi noutro sítio, obrigada', hora: '20:20' }],
    ecras: [
      { a: 0.0, passo: '1 · Menu', escolhe: 1, toque: 0.8, opcoes: [['Combinado 24 peças', '22 €'], ['Combinado 40 peças', '34 €'], ['Poke de salmão', '12,50 €'], ['Gyozas (6)', '6 €']] },
      { a: 1.5, passo: '2 · Extras', escolhe: 0, toque: 0.7, opcoes: [['+ Gyozas (6)', '6 €'], ['+ Edamame', '4 €'], ['+ Molho picante', '0,50 €'], ['Sem extras', '']] },
      { a: 3.0, passo: '3 · Como queres?', escolhe: 0, toque: 0.7, opcoes: [['Entrega', 'até 5 km'], ['Takeaway', 'recolha'], ['Reservar mesa', ''], ['Agendar', 'para mais tarde']] },
      { a: 4.3, passo: '4 · Hora de entrega', escolhe: 4, toque: 1.4, nota: 'Só aparecem horas disponíveis', grelha: ['19:30', 'x19:45', 'x20:00', 'x20:15', '20:30', '20:45', 'x21:00', '21:15', 'x21:30', '21:45', 'x22:00', '22:15'] }],
    feito: { passo: 'Pedido confirmado', feito: 'Pedido feito!', detalhes: ['40 peças + gyozas · 40 €', 'Entrega hoje · 20:30'] },
    pedidos: [['Entrega #102', '40 peças + gyozas · 20:30'], ['Takeaway #103', 'Poke de salmão · 19:50'], ['Nova reserva · Mesa 3', '4 pessoas · sáb 20:30'], ['Entrega #104', '24 peças · 21:00']],
    curtos: ['40 peças', 'Poke', 'Mesa 3 · 4p', '24 peças', 'Gyozas'] },
  { id: 'B-cafe', c: 'B', nome: 'café', fem: false, negocio: 'Café Central', dominio: 'cafecentral.pt', hook: ['Enquanto', 'tiras', 'um café…'], continuas: 'a tirar cafés.',
    notifs: [chamada('+351 919 ••• •••'), dm('WhatsApp', 'Escritório: 12 pequenos-almoços?'), chamada('Teresa Fonseca'), dm('Instagram', 'gui: abrem domingo?')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Escritório 3.º Esq.', txt: 'Bom dia! Conseguem 12 pequenos-almoços para as 9h30?', hora: '08:05' }, { de: 'ele', nome: 'Escritório 3.º Esq.', txt: 'Precisamos de confirmação', hora: '08:40' }, { de: 'ele', nome: 'Escritório 3.º Esq.', txt: 'Já tratámos noutro café, obrigado', hora: '09:00' }],
    ecras: [
      { a: 0.0, passo: '1 · Menu', escolhe: 3, toque: 0.8, opcoes: [['Pastel de nata', '1,30 €'], ['Galão', '1,60 €'], ['Tosta mista', '3,50 €'], ['Pequeno-almoço', '6 €']] },
      { a: 1.5, passo: '2 · Quantidade', escolhe: 2, toque: 0.7, opcoes: [['1×', '6 €'], ['4×', '24 €'], ['12×', '72 €'], ['Outra', '']] },
      { a: 3.0, passo: '3 · Como queres?', escolhe: 0, toque: 0.7, opcoes: [['Recolha', 'no balcão'], ['Entrega', 'até 2 km'], ['Na esplanada', 'mesa'], ['Agendar', 'para amanhã']] },
      { a: 4.3, passo: '4 · Hora de recolha', escolhe: 4, toque: 1.4, nota: 'Só aparecem horas disponíveis', grelha: ['08:30', 'x08:45', 'x09:00', 'x09:15', '09:30', '09:45', 'x10:00', '10:15', 'x10:30', '10:45', 'x11:00', '11:15'] }],
    feito: { passo: 'Pedido confirmado', feito: 'Pedido feito!', detalhes: ['12× Pequeno-almoço · 72 €', 'Recolha hoje · 09:30'] },
    pedidos: [['Recolha #51', '12× Pequeno-almoço · 09:30'], ['Recolha #52', '2× Galão + Tosta · 09:40'], ['Entrega #53', '6× Pastel de nata · 10:15'], ['Esplanada · Mesa 5', 'Brunch para 4 · dom 11:00']],
    curtos: ['P.-almoço', 'Galão', 'Tosta', 'Nata ×6', 'Mesa 5 · 4p'], painelColunas: ['Mesa', 'Recolha', 'Entrega'], cont2: 'mesas<br>na esplanada' },
  { id: 'B-pastelaria', c: 'B', nome: 'pastelaria', fem: true, negocio: 'Pastelaria Doce Lar', dominio: 'docelar.pt', sozinho: 'recebesse as encomendas', hook: ['Enquanto', 'tiras', 'os bolos do forno…'], continuas: 'a fazer bolos.',
    notifs: [chamada('Encomenda? · +351 912 ••• •••'), dm('Instagram', 'patricia: fazem bolo de aniversário?'), chamada('Helena Matos'), dm('WhatsApp', 'Rui: 50 salgados para sábado?')], notifTitulo: ['As encomendas', 'por todo o lado'],
    conversa: [{ de: 'ele', nome: 'Patrícia', txt: 'Olá! Fazem bolo de aniversário para sábado? Chocolate, 20 pessoas', hora: '10:30' }, { de: 'ele', nome: 'Patrícia', txt: 'Olá?', hora: '16:00' }, { de: 'ele', nome: 'Patrícia', txt: 'Já encomendei noutra pastelaria', hora: '20:12' }],
    ecras: [
      { a: 0.0, passo: '1 · Encomendar', escolhe: 0, toque: 0.8, opcoes: [['Bolo de aniversário', 'desde 25 €'], ['Caixa 6 pastéis de nata', '7,50 €'], ['Bolo-rei', '18 €'], ['Salgados (50)', '22 €']] },
      { a: 1.5, passo: '2 · Personalizar', escolhe: 0, toque: 0.7, opcoes: [['Chocolate', ''], ['Ananás', ''], ['Frutos vermelhos', ''], ['Com foto / tema', '+ 5 €']] },
      { a: 3.0, passo: '3 · Pessoas', escolhe: 1, toque: 0.7, opcoes: [['10 pessoas', '25 €'], ['20 pessoas', '40 €'], ['30 pessoas', '55 €'], ['Mais', 'sob consulta']] },
      { a: 4.3, passo: '4 · Recolha · sáb 18', escolhe: 4, toque: 1.4, nota: 'Só aparecem horas disponíveis', grelha: ['09:00', 'x09:30', 'x10:00', 'x10:30', '11:00', '11:30', 'x12:00', '15:00', 'x15:30', '16:00', 'x16:30', '17:00'] }],
    feito: { passo: 'Encomenda confirmada', feito: 'Encomenda feita!', detalhes: ['Bolo de chocolate · 20 pessoas', 'Recolha sáb 18 · 11:00'] },
    pedidos: [['Encomenda #88', 'Bolo chocolate · 20 p · sáb 11:00'], ['Encomenda #89', 'Salgados (50) · sáb 15:00'], ['Recolha #90', '6 pastéis de nata · hoje 17:00'], ['Encomenda #91', 'Bolo-rei · dom 10:00']],
    curtos: ['Bolo 20p', 'Salgados', 'Natas ×6', 'Bolo-rei', 'Bolo 10p'], painelColunas: ['Balcão', 'Encomendas', 'Entrega'], cont2: 'encomendas<br>de bolos', filtro2: 'Bolo', pergunta: 'encomendas online' },
  { id: 'B-confeitaria', c: 'B', nome: 'confeitaria', fem: true, negocio: 'Açúcar & Arte', dominio: 'acucarearte.pt', sozinho: 'recebesse as encomendas', hook: ['Enquanto', 'decoras', 'um bolo…'], continuas: 'a decorar bolos.',
    notifs: [dm('Instagram', 'carla: fazem bolo de batizado?'), dm('WhatsApp', 'Noiva: orçamento casamento?'), chamada('+351 934 ••• •••'), dm('Instagram', 'tiago: cupcakes para sexta?')], notifTitulo: ['As DMs', 'não param'],
    conversa: [{ de: 'ele', nome: 'Carla', txt: 'Olá! Fazem bolo de batizado para dia 25? 30 pessoas, tema azul', hora: '21:14' }, { de: 'ele', nome: 'Carla', txt: 'Conseguem dizer-me o preço?', hora: '11:30' }, { de: 'ele', nome: 'Carla', txt: 'Já encomendei noutro lado, obrigada', hora: '18:05' }],
    ecras: [
      { a: 0.0, passo: '1 · Encomendar', escolhe: 0, toque: 0.8, opcoes: [['Bolo personalizado', 'desde 35 €'], ['Cupcakes (12)', '24 €'], ['Macarons (20)', '18 €'], ['Bolo de casamento', 'sob consulta']] },
      { a: 1.5, passo: '2 · Ocasião', escolhe: 1, toque: 0.7, opcoes: [['Aniversário', ''], ['Batizado', ''], ['Casamento', ''], ['Outra · envia foto', '']] },
      { a: 3.0, passo: '3 · Pessoas', escolhe: 2, toque: 0.7, opcoes: [['10 pessoas', '35 €'], ['20 pessoas', '55 €'], ['30 pessoas', '75 €'], ['50 pessoas', '110 €']] },
      { a: 4.3, passo: '4 · Data de entrega', escolhe: 4, toque: 1.4, nota: 'Só aparecem datas livres', grelha: ['qui 16', 'xsex 17', 'xsáb 18', 'xdom 19', 'qua 22', 'qui 23', 'xsex 24', 'sáb 25', 'xdom 26', 'ter 28', 'xqua 29', 'qui 30'] }],
    feito: { passo: 'Encomenda confirmada', feito: 'Encomenda feita!', detalhes: ['Bolo de batizado · 30 pessoas', 'Entrega qua 22'] },
    pedidos: [['Encomenda #31', 'Bolo batizado · 30 p · qua 22'], ['Encomenda #32', 'Cupcakes (12) · sex 24'], ['Pedido de orçamento', 'Bolo de casamento · 120 p'], ['Encomenda #33', 'Macarons (20) · sáb 25']],
    curtos: ['Batizado', 'Cupcakes', 'Aniversário', 'Macarons', 'Casamento'], painelColunas: ['Bolos', 'Doces', 'Entregas'], horasPainel: ['seg 20', 'ter 21', 'qua 22', 'qui 23', 'sex 24', 'sáb 25', 'dom 26'], cont1: 'encomendas<br>do mês', cont2: 'bolos de<br>aniversário', filtro2: 'Aniv', pergunta: 'encomendas online' },

  // C — Serviços técnicos e clínicos
  { id: 'C-oficina', c: 'C', nome: 'oficina', fem: true, negocio: 'Oficina Motor Norte', dominio: 'motornorte.pt', hook: ['Enquanto', 'mudas o óleo', 'a um carro…'], continuas: 'a reparar carros.',
    notifs: [chamada('Orçamento? · +351 917 ••• •••'), chamada('Luís Carvalho'), dm('Email', 'Pedido de orçamento: travões'), chamada('+351 961 ••• •••')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Luís', txt: 'Boas! Quanto fica a revisão dos 60 mil a um Golf 2018?', hora: '09:05' }, { de: 'ele', nome: 'Luís', txt: 'Conseguem dar-me um valor?', hora: '14:30' }, { de: 'ele', nome: 'Luís', txt: 'Já marquei noutra oficina, obrigado', hora: '18:12' }],
    servicos: [['Revisão', 'desde 89 €'], ['Pneus', 'orçamento'], ['Travões', 'orçamento'], ['Diagnóstico', '25 €']], equipa: ['Zé', 'Carlos', 'Rui'],
    feito: { passo: 'Pedido recebido', feito: 'Marcado!', detalhes: ['Revisão · Golf 2018', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Diagnóstico ao carro'], ['Orçamento', 'Aprovado no telemóvel'], ['Reparação', 'Pronto hoje às 17h'], ['Histórico', 'Tudo guardado']],
    lembrete: 'Revisão dos 75 000 km daqui a 1 mês · marca já', cadaLinha: 'cada mecânico', curtos: ['Revisão', 'Orç. travões', 'Pneus', 'Diagnóstico', 'Orç. embraiag.'] },
  { id: 'C-dentista', c: 'C', nome: 'clínica dentária', fem: true, negocio: 'Clínica Dentária Sorrir+', dominio: 'sorrirmais.pt', hook: ['Enquanto', 'tratas', 'um dente…'], continuas: 'a tratar sorrisos.',
    notifs: [chamada('Consulta? · +351 912 ••• •••'), chamada('Joana Prata'), dm('Email', 'Orçamento implante?'), chamada('+351 938 ••• •••')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Joana', txt: 'Bom dia, queria marcar uma limpeza e saber o preço do branqueamento', hora: '09:20' }, { de: 'ele', nome: 'Joana', txt: 'Liguei mas ninguém atendeu', hora: '12:45' }, { de: 'ele', nome: 'Joana', txt: 'Já marquei noutra clínica', hora: '17:30' }],
    servicos: [['Consulta', '40 €'], ['Limpeza', '45 €'], ['Branqueamento', 'orçamento'], ['Implante', 'orçamento']], escolheServico: 1, equipa: ['Dra. Sofia', 'Dr. Paulo', 'Higienista'],
    feito: { passo: 'Marcação confirmada', feito: 'Marcado!', detalhes: ['Limpeza · Dra. Sofia', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Primeira consulta'], ['Orçamento', 'Plano de tratamento'], ['Tratamento', 'Sessões marcadas'], ['Histórico', 'Tudo na ficha']],
    lembrete: 'Check-up dos 6 meses · marca já', esquecido: 'Check-up esquecido', cadaLinha: 'cada médico', curtos: ['Limpeza', 'Consulta', 'Orç. implante', 'Limpeza', 'Branqueam.'] },
  { id: 'C-clinica', c: 'C', nome: 'clínica', fem: true, negocio: 'Clínica Vida+', dominio: 'clinicavidamais.pt', hook: ['Enquanto', 'dás', 'uma consulta…'], continuas: 'a dar consultas.',
    notifs: [chamada('+351 916 ••• •••'), chamada('Manuel Rocha'), dm('Email', 'Marcação de nutrição?'), chamada('Consulta? · +351 927 ••• •••')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Manuel', txt: 'Bom dia, há vaga para consulta de nutrição esta semana?', hora: '08:50' }, { de: 'ele', nome: 'Manuel', txt: 'Agradecia resposta', hora: '13:15' }, { de: 'ele', nome: 'Manuel', txt: 'Já arranjei noutro lado, obrigado', hora: '18:40' }],
    servicos: [['Clínica geral', '45 €'], ['Nutrição', '40 €'], ['Psicologia', '50 €'], ['Análises', 'orçamento']], escolheServico: 1, equipa: ['Dr. Tiago', 'Dra. Marta', 'Dra. Lúcia'],
    feito: { passo: 'Marcação confirmada', feito: 'Marcado!', detalhes: ['Nutrição · Dra. Marta', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Primeira consulta'], ['Orçamento', 'Plano e valores'], ['Consultas', 'Seguimento marcado'], ['Histórico', 'Tudo na ficha']],
    lembrete: 'Check-up anual · marca já', esquecido: 'Check-up esquecido', cadaLinha: 'cada médico', curtos: ['Nutrição', 'Geral', 'Psicologia', 'Orç. análises', 'Geral'] },
  { id: 'C-fisioterapia', c: 'C', nome: 'clínica de fisioterapia', fem: true, negocio: 'Fisio Movimento', dominio: 'fisiomovimento.pt', hook: ['Enquanto', 'tratas', 'uma lesão…'], continuas: 'a tratar lesões.',
    notifs: [chamada('+351 913 ••• •••'), dm('WhatsApp', 'Hugo: posso mudar para quinta?'), chamada('Sónia Moreira'), dm('Instagram', 'atleta.pt: fazem osteopatia?')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Hugo', txt: 'Boas! Torci o joelho no futebol, têm vaga esta semana?', hora: '08:10' }, { de: 'ele', nome: 'Hugo', txt: 'Está a doer bastante…', hora: '12:00' }, { de: 'ele', nome: 'Hugo', txt: 'Já marquei noutra clínica', hora: '16:20' }],
    servicos: [['Avaliação', '35 €'], ['Fisioterapia', '30 € · sessão'], ['Osteopatia', '45 €'], ['Pack 10 sessões', 'orçamento']], equipa: ['Sónia', 'Pedro', 'Marta'],
    feito: { passo: 'Marcação confirmada', feito: 'Marcado!', detalhes: ['Avaliação · com Sónia', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Primeira sessão'], ['Plano', 'Sessões e valor'], ['Tratamento', 'Sessão 4 de 10'], ['Histórico', 'Evolução guardada']],
    lembrete: 'Sessão de amanhã às 18:00 · confirma', esquecido: 'Sessão esquecida', cadaLinha: 'cada fisioterapeuta', curtos: ['Avaliação', 'Sessão 4', 'Osteopatia', 'Orç. pack', 'Sessão 7'] },
  { id: 'C-jardinagem', c: 'C', nome: 'empresa de jardinagem', fem: true, negocio: 'Jardins Verde Vivo', dominio: 'verdevivo.pt', hook: ['Enquanto', 'cortas', 'uma relva…'], continuas: 'a tratar jardins.',
    notifs: [chamada('+351 918 ••• •••'), dm('Email', 'Orçamento manutenção mensal?'), chamada('Fernanda Silva'), dm('WhatsApp', 'Condomínio: poda das sebes?')], notifTitulo: ['Os pedidos', 'não param'],
    conversa: [{ de: 'ele', nome: 'Fernanda', txt: 'Olá! Quanto fica a manutenção mensal de um jardim de 300 m²?', hora: '10:15' }, { de: 'ele', nome: 'Fernanda', txt: 'Podem vir ver?', hora: '17:40' }, { de: 'ele', nome: 'Fernanda', txt: 'Já contratei outra empresa, obrigada', hora: '11:05' }],
    servicos: [['Manutenção mensal', 'orçamento'], ['Corte de relva', 'desde 30 €'], ['Poda', 'orçamento'], ['Rega automática', 'orçamento']], pedeOrcamento: true, diaTitulo: 'Visita', equipa: ['Equipa 1', 'Equipa 2', 'Equipa 3'],
    feito: { passo: 'Pedido recebido', feito: 'Visita marcada!', detalhes: ['Orçamento · manutenção mensal', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Visita ao jardim'], ['Orçamento', 'Aprovado no telemóvel'], ['Trabalho', 'Agendado · todos os meses'], ['Histórico', 'Cada visita guardada']],
    lembrete: 'Poda de primavera · marca já', esquecido: 'Visita esquecida', cadaLinha: 'cada equipa', curtos: ['Relva', 'Orç. poda', 'Manutenção', 'Rega', 'Orç. sebes'] },
  { id: 'C-limpezas', c: 'C', nome: 'empresa de limpezas', fem: true, negocio: 'Brilho Limpezas', dominio: 'brilholimpezas.pt', hook: ['Enquanto', 'limpas', 'uma casa…'], continuas: 'a limpar.',
    notifs: [chamada('+351 911 ••• •••'), dm('Email', 'Orçamento limpeza pós-obra?'), dm('WhatsApp', 'Escritório: podem às sextas?'), chamada('Rosa Ferreira')], notifTitulo: ['Os pedidos', 'não param'],
    conversa: [{ de: 'ele', nome: 'Rosa', txt: 'Bom dia! Quanto fica uma limpeza a um T3, de 15 em 15 dias?', hora: '09:30' }, { de: 'ele', nome: 'Rosa', txt: 'Preciso de começar na próxima semana', hora: '16:10' }, { de: 'ele', nome: 'Rosa', txt: 'Já contratei outra empresa, obrigada', hora: '10:00' }],
    servicos: [['Limpeza doméstica', 'desde 45 €'], ['Pós-obra', 'orçamento'], ['Escritórios', 'orçamento'], ['Vidros', 'orçamento']], pedeOrcamento: true, diaTitulo: 'Primeira limpeza', equipa: ['Equipa A', 'Equipa B', 'Equipa C'],
    feito: { passo: 'Pedido recebido', feito: 'Marcado!', detalhes: ['Limpeza T3 · quinzenal', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Tipologia e m²'], ['Orçamento', 'Aprovado no telemóvel'], ['Limpeza', 'Equipa a caminho'], ['Histórico', 'Limpezas guardadas']],
    lembrete: 'Limpeza quinzenal · sexta às 10:00', esquecido: 'Limpeza esquecida', cadaLinha: 'cada equipa', curtos: ['T3', 'Orç. pós-obra', 'Escritório', 'T2', 'Vidros'] },
  { id: 'C-obras', c: 'C', nome: 'empresa de obras', fem: true, negocio: 'Pedra Firme Obras', dominio: 'pedrafirme.pt', hook: ['Enquanto', 'levantas', 'uma parede…'], continuas: 'em obra.',
    notifs: [chamada('Orçamento? · +351 919 ••• •••'), dm('Email', 'Remodelação de cozinha'), chamada('Jorge Pinto'), dm('WhatsApp', 'Cliente: quando começa a obra?')], notifTitulo: ['O telefone', 'não pára'],
    conversa: [{ de: 'ele', nome: 'Jorge', txt: 'Boa tarde, queria orçamento para remodelar uma casa de banho', hora: '14:20' }, { de: 'ele', nome: 'Jorge', txt: 'Podem vir ver esta semana?', hora: '10:05' }, { de: 'ele', nome: 'Jorge', txt: 'Já fechei com outra empresa', hora: '17:50' }],
    servicos: [['Cozinha', 'orçamento'], ['Casa de banho', 'orçamento'], ['Pintura', 'orçamento'], ['Pequenas reparações', 'orçamento']], pedeOrcamento: true, escolheServico: 1, diaTitulo: 'Visita', equipa: ['Equipa 1', 'Equipa 2', 'Equipa 3'],
    feito: { passo: 'Pedido recebido', feito: 'Visita marcada!', detalhes: ['Orçamento · casa de banho', 'Terça, 21 · 10:30'] },
    etapas: [['Avaliação', 'Visita à obra'], ['Orçamento', 'Aprovado no telemóvel'], ['Obra', 'Fase 2 de 3'], ['Histórico', 'Fotos e faturas']],
    lembrete: 'Obra: a fase 3 começa segunda', lembreteQuando: 'hoje', esquecido: 'Cliente sem notícias', cadaLinha: 'cada equipa', curtos: ['Cozinha', 'Orç. WC', 'Pintura', 'Reparação', 'Orç. telhado'] },

  // D1 — Noite e eventos
  { id: 'D1-discoteca', c: 'D1', nome: 'discoteca', fem: true, negocio: 'Club Lumen', dominio: 'clublumen.pt', hook: ['Enquanto', 'preparas', 'a noite…'], continuas: 'a fazer a festa.',
    notifs: [dm('Instagram', 'rafa: põe 6 na guest list?'), dm('Instagram', 'bea: quanto é a mesa VIP?'), dm('WhatsApp', 'Promotor: mais 10 nomes'), chamada('+351 924 ••• •••')], notifTitulo: ['As DMs', 'não param'],
    conversa: [{ de: 'ele', nome: 'Bea', txt: 'Boas! Quanto é uma mesa VIP para sábado? Somos 8', hora: '15:20' }, { de: 'ele', nome: 'Bea', txt: 'Ainda há?', hora: '19:45' }, { de: 'ele', nome: 'Bea', txt: 'Esquece, reservámos noutro club', hora: '22:10' }],
    ecras: [
      { a: 0.0, passo: '1 · Evento', escolhe: 0, toque: 0.8, opcoes: [['Sáb 18 · Noite Latina', ''], ['Sex 24 · House Session', ''], ['Sáb 25 · Anos 2000', ''], ['Evento privado', 'pedir']] },
      { a: 1.5, passo: '2 · Entrada', escolhe: 0, toque: 0.7, opcoes: [['Bilhete', '12 €'], ['Guest list', 'até 01:00'], ['Mesa VIP', 'desde 150 €'], ['Pré-venda', 'esgotada']] },
      { a: 3.0, passo: '3 · Quantos?', escolhe: 1, toque: 0.7, opcoes: [['1 bilhete', '12 €'], ['2 bilhetes', '24 €'], ['4 bilhetes', '48 €'], ['6 bilhetes', '72 €']] },
      { a: 4.3, passo: '4 · Promotor', escolhe: 1, toque: 0.8, opcoes: [['Sem promotor', ''], ['Ricardo', ''], ['Inês', ''], ['Bruno', '']] }],
    feito: { passo: 'Bilhetes confirmados', feito: 'Bilhetes!', qr: 7, detalhes: ['2 entradas · Noite Latina', 'Sáb 18 · via Ricardo'] },
    mesas: [{ x: 60, y: 140, nome: 'V1', preco: '150 €' }, { x: 730, y: 140, nome: 'V2', preco: '150 €' }, { x: 60, y: 380, nome: 'V3', preco: '200 €' }, { x: 730, y: 380, nome: 'V4', preco: '200 €' },
      { x: 120, y: 620, nome: 'V5', preco: '250 €' }, { x: 395, y: 640, nome: 'V6', preco: '300 €', livre: true }, { x: 670, y: 620, nome: 'V7', preco: '250 €' }],
    plantaTitulo: ['Mesas VIP', 'na planta'], painelTitulo: 'Club Lumen · sábado', painelColunas: ['Ricardo', 'Inês', 'Bruno'], horas: ['23:00', '23:30', '00:00', '00:30', '01:00', '01:30', '02:00'],
    painelLinhas: ['A noite toda', 'cada promotor', 'cada mesa'], curtos: ['Bilhete ×2', 'Guest ×4', 'VIP V2', 'Bilhete ×6', 'Guest ×3'], cont1: 'reservas<br>esta noite', cont2: 'mesas<br>VIP', filtro2: 'VIP' },
  { id: 'D1-bar', c: 'D1', nome: 'bar', fem: false, negocio: 'Bar da Esquina', dominio: 'bardaesquina.pt', hook: ['Enquanto', 'tiras', 'um gin…'], continuas: 'a servir.',
    notifs: [dm('Instagram', 'marta: há bilhetes para o concerto?'), dm('WhatsApp', 'Grupo: mesa para 10 no quiz?'), chamada('+351 935 ••• •••'), dm('Instagram', 'joão: ainda há lugar?')], notifTitulo: ['As DMs', 'não param'],
    conversa: [{ de: 'ele', nome: 'Marta', txt: 'Olá! Ainda há bilhetes para o concerto de sábado? Somos 4', hora: '16:30' }, { de: 'ele', nome: 'Marta', txt: '?', hora: '19:10' }, { de: 'ele', nome: 'Marta', txt: 'Já fomos para outro bar', hora: '21:45' }],
    ecras: [
      { a: 0.0, passo: '1 · Evento', escolhe: 1, toque: 0.8, opcoes: [['Sex 17 · Karaoke', 'grátis'], ['Sáb 18 · Concerto', '8 €'], ['Qui 23 · Quiz night', '5 €'], ['Festa privada', 'pedir']] },
      { a: 1.5, passo: '2 · Entrada', escolhe: 0, toque: 0.7, opcoes: [['Bilhete', '8 €'], ['Guest list', 'até 23:00'], ['Mesa junto ao palco', 'desde 40 €'], ['Pré-venda', 'esgotada']] },
      { a: 3.0, passo: '3 · Quantos?', escolhe: 2, toque: 0.7, opcoes: [['1 bilhete', '8 €'], ['2 bilhetes', '16 €'], ['4 bilhetes', '32 €'], ['6 bilhetes', '48 €']] },
      { a: 4.3, passo: '4 · Promotor', escolhe: 0, toque: 0.8, opcoes: [['Sem promotor', ''], ['Catarina', ''], ['Leandro', ''], ['Sílvia', '']] }],
    feito: { passo: 'Bilhetes confirmados', feito: 'Bilhetes!', qr: 3, detalhes: ['4 entradas · Concerto', 'Sáb 18 · 22:00'] },
    palco: 'PALCO', centro: 'BALCÃO', plantaTitulo: ['Mesas', 'junto ao palco'],
    mesas: [{ x: 60, y: 160, nome: 'M1', preco: '40 €' }, { x: 730, y: 160, nome: 'M2', preco: '40 €' }, { x: 60, y: 400, nome: 'M3', preco: '40 €' }, { x: 730, y: 400, nome: 'M4', preco: '40 €' },
      { x: 150, y: 640, nome: 'M5', preco: '30 €' }, { x: 395, y: 660, nome: 'M6', preco: '30 €', livre: true }, { x: 640, y: 640, nome: 'M7', preco: '30 €' }],
    painelTitulo: 'Bar da Esquina · sábado', painelColunas: ['Bilhetes', 'Guest list', 'Mesas'], horas: ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'],
    painelLinhas: ['O evento todo', 'cada entrada', 'cada mesa'], curtos: ['Bilhete ×4', 'Guest ×2', 'Mesa M2', 'Bilhete ×2', 'Guest ×5'], cont1: 'reservas<br>esta noite', cont2: 'mesas<br>reservadas', filtro2: 'Mesa',
    modulos: ['Bilhetes com QR', 'Guest list', 'Mesas', 'Festas privadas'], slogan: 'Bilhetes · Guest list · Mesas · Eventos' },
  { id: 'D1-salao-festas', c: 'D1', nome: 'salão de festas', fem: false, negocio: 'Salão Estrela', dominio: 'salaoestrela.pt', hook: ['Enquanto', 'montas', 'uma festa…'], continuas: 'a fazer festas.',
    sozinho: 'vendesse as datas', problemas: ['Datas por confirmar', 'Pedidos por DM', 'Mesas no papel'], sem: ['DMs.', 'agendas em papel.', 'confusões.'], volta: ['Data', 'garantida.'], pergunta: 'reservas online',
    modulos: ['Site', 'Reserva de datas', 'Planta de mesas', 'Painel do dono'], slogan: 'Site · Datas · Planta · Painel',
    notifs: [dm('Instagram', 'ana: têm o dia 25 livre?'), dm('Email', 'Orçamento casamento 120 pessoas'), chamada('+351 926 ••• •••'), dm('WhatsApp', 'Paulo: batizado em junho?')], notifTitulo: ['Os pedidos', 'não param'],
    conversa: [{ de: 'ele', nome: 'Ana', txt: 'Olá! Têm o salão livre a 25 de maio? Aniversário para 80 pessoas', hora: '11:20' }, { de: 'ele', nome: 'Ana', txt: 'Preciso de confirmar esta semana', hora: '18:30' }, { de: 'ele', nome: 'Ana', txt: 'Já reservámos outro espaço', hora: '10:15' }],
    ecras: [
      { a: 0.0, passo: '1 · Tipo de evento', escolhe: 0, toque: 0.8, opcoes: [['Aniversário', ''], ['Batizado', ''], ['Casamento', ''], ['Empresa', '']] },
      { a: 1.5, passo: '2 · Convidados', escolhe: 1, toque: 0.7, opcoes: [['Até 50', ''], ['Até 100', ''], ['Até 200', ''], ['Mais de 200', 'sob consulta']] },
      { a: 3.0, passo: '3 · Pacote', escolhe: 1, toque: 0.7, opcoes: [['Só espaço', ''], ['Espaço + catering', ''], ['Tudo incluído', ''], ['Pedir orçamento', '']] },
      { a: 4.3, passo: '4 · Data · maio', escolhe: 7, toque: 1.4, nota: 'Só aparecem datas livres', grelha: ['sáb 4', 'xdom 5', 'xsáb 11', 'xdom 12', 'sex 17', 'xsáb 18', 'xdom 19', 'sáb 25', 'xdom 26', 'sex 31', 'xsáb 1', 'dom 2'] }],
    feito: { passo: 'Pedido de reserva', feito: 'Data reservada!', detalhes: ['Aniversário · até 100 pessoas', 'Sábado, 25 de maio'] },
    palco: 'MESA DE HONRA', centro: 'PISTA', plantaTitulo: ['A planta', 'das mesas'],
    mesas: [{ x: 60, y: 160, nome: 'M1', preco: '10 lug.' }, { x: 730, y: 160, nome: 'M2', preco: '10 lug.' }, { x: 60, y: 400, nome: 'M3', preco: '10 lug.' }, { x: 730, y: 400, nome: 'M4', preco: '10 lug.' },
      { x: 150, y: 640, nome: 'M5', preco: '8 lug.' }, { x: 395, y: 660, nome: 'M6', preco: '8 lug.' }, { x: 640, y: 640, nome: 'M7', preco: '8 lug.', livre: true }],
    painelTitulo: 'Salão Estrela · maio e junho', painelColunas: ['Sala grande', 'Sala pequena', 'Jardim'], horas: ['sáb 4', 'sáb 11', 'sáb 18', 'sáb 25', 'sáb 1', 'sáb 8', 'sáb 15'],
    painelLinhas: ['Todas as datas', 'cada sala', 'cada evento'], curtos: ['Casamento', 'Aniversário', 'Batizado', 'Empresa', 'Casamento'], cont1: 'eventos<br>marcados', cont2: 'casamentos', filtro2: 'Casamento' },

  // D2 — Alojamento
  { id: 'D2-alojamento-local', c: 'D2', nome: 'alojamento local', fem: false, negocio: 'Casa do Rio', dominio: 'casadorio.pt', hook: ['Enquanto', 'recebes', 'um hóspede…'], continuas: 'a receber hóspedes.',
    notifs: [dm('Plataforma', 'Nova reserva · comissão descontada'), dm('Email', 'Têm quarto de 14 a 16?'), dm('Plataforma', 'Nova reserva · comissão descontada'), chamada('+44 7•••• ••••••')], notifTitulo: ['Cada reserva', 'paga comissão'],
    conversa: [{ de: 'ele', nome: 'Claire', txt: 'Olá! Têm disponibilidade de 14 a 16 de agosto para 2? Preço direto?', hora: '09:10' }, { de: 'ele', nome: 'Claire', txt: 'Hello? Precisamos de saber hoje', hora: '15:40' }, { de: 'ele', nome: 'Claire', txt: 'Já reservámos noutro sítio, obrigada', hora: '20:05' }],
    unidade: 'Apartamento', cadaUnidade: 'apartamento', quartos: [['T0 Ribeira', '65 €/noite'], ['T1 Vista Rio', '95 €/noite'], ['T2 Família', '130 €/noite'], ['Estúdio', '55 €/noite']], precoBaixa: 60, precoMedia: 75, precoAlta: 95,
    painelColunas: ['T0', 'T1', 'T2'] },
  { id: 'D2-hotel', c: 'D2', nome: 'hotel', fem: false, negocio: 'Hotel Atlântico', dominio: 'hotelatlantico.pt', hook: ['Enquanto', 'fazes', 'um check-in…'], continuas: 'a receber hóspedes.',
    notifs: [dm('Plataforma', 'Nova reserva · comissão descontada'), dm('Plataforma', 'Nova reserva · comissão descontada'), dm('Email', 'Grupo de 12 quartos em setembro?'), chamada('+351 22• ••• •••')], notifTitulo: ['Cada reserva', 'paga comissão'],
    conversa: [{ de: 'ele', nome: 'Marco', txt: 'Bom dia, têm duplo superior de 14 a 16 de agosto? Qual o preço direto?', hora: '08:45' }, { de: 'ele', nome: 'Marco', txt: 'Aguardo resposta', hora: '14:20' }, { de: 'ele', nome: 'Marco', txt: 'Já reservei por outra via', hora: '19:30' }],
    quartos: [['Standard', '89 €/noite'], ['Superior', '119 €/noite'], ['Suite', '179 €/noite'], ['Familiar', '139 €/noite']], precoBaixa: 79, precoMedia: 99, precoAlta: 119,
    painelColunas: ['Standard', 'Superior', 'Suite'] },
  { id: 'D2-guest-house', c: 'D2', nome: 'guest house', fem: true, negocio: 'Guest House Ribeira', dominio: 'ghribeira.pt', hook: ['Enquanto', 'preparas', 'o pequeno-almoço…'], continuas: 'a cuidar da casa.',
    notifs: [dm('Plataforma', 'Nova reserva · comissão descontada'), dm('Email', 'Quarto com pequeno-almoço?'), dm('Plataforma', 'Nova reserva · comissão descontada'), chamada('+34 6•• ••• •••')], notifTitulo: ['Cada reserva', 'paga comissão'],
    conversa: [{ de: 'ele', nome: 'Lucía', txt: 'Hola! Têm quarto duplo de 14 a 16 de agosto com pequeno-almoço?', hora: '10:05' }, { de: 'ele', nome: 'Lucía', txt: '¿Hola?', hora: '16:30' }, { de: 'ele', nome: 'Lucía', txt: 'Já reservámos noutro lado, gracias', hora: '21:00' }],
    quartos: [['Individual', '55 €/noite'], ['Duplo', '79 €/noite'], ['Duplo vista rio', '95 €/noite'], ['Triplo', '105 €/noite']], precoBaixa: 55, precoMedia: 65, precoAlta: 79,
    painelColunas: ['Quarto 1', 'Quarto 2', 'Quarto 3'] },
];

/* ── montagem e escrita ── */
const CONCEITOS = { A: conceitoA, B: conceitoB, C: conceitoC, D1: conceitoD1, D2: conceitoD2 };
const html = (n, planos) => `<!doctype html>
<html lang="pt-PT"><head><meta charset="utf-8"><title>Tá-se Bem · ${n.id}</title>
<link rel="stylesheet" href="base.css">
<script>const SCENE_W = 1080, SCENE_H = 1920, DUREE = 60;</script>
</head><body><div id="palco"></div>
<script>window.FILME = ${JSON.stringify({ duracao: 60, planos })};</script>
<script src="engine.js"></script>
</body></html>
`;
const ids = [];
for (const base of NICHOS) {
  const n = { ...CONCEITOS[base.c](base), ...base };
  // o que o nicho define por cima do conceito (sozinho, problemas…) já ganhou no spread; o painel do conceito B pode trazer horas próprias
  const planos = filme(n);
  for (const p of planos) if (Math.abs(p.ate * 2 - Math.round(p.ate * 2)) > 1e-9) throw new Error(`${n.id}: corte fora da grelha (${p.ate})`);
  fs.writeFileSync(path.join(AQUI, 'scene', `${n.id}.html`), html(n, planos));
  ids.push(n.id);
}
fs.writeFileSync(path.join(AQUI, 'scene', 'lista.json'), JSON.stringify(ids, null, 1));
console.log(ids.length + ' vídeos:', ids.join(' '));
