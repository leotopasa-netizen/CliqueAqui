/* Tá-se Bem — motor de tipografia animada 9:16.
   O ecrã é uma função pura do tempo: window.__seek(t) reconstrói a cena do instante t.
   Cada vídeo define window.FILME = { duracao, planos: [{ ate, tipo, ...params }] } antes de carregar este ficheiro. */
(() => {
  const W = 1080, H = 1920;
  const C = { amarelo: '#F9BA17', amarelo2: '#FFD25A', preto: '#0B0B0C', branco: '#FFFFFF', cinza: '#1C1C1F',
    verde: '#3DDC5C', tinta: '#121214', claro: '#EEF0F2', laranja: '#F7861B' };

  /* ── utilitários de tempo ── */
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lin = (t, a, b) => cl((t - a) / (b - a));
  const eOut = (x) => 1 - Math.pow(1 - x, 3);
  const eIn = (x) => x * x * x;
  const eIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  const mix = (a, b, k) => a + (b - a) * k;
  const hash = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

  /* entrada com desfoque de movimento: devolve estilo para um elemento que entra em [t0, t0+d] */
  function entra(t, t0, d = 0.28, modo = 'sobe', dist = 160) {
    const k = lin(t, t0, t0 + d);
    if (k <= 0) return 'opacity:0;';
    const e = modo === 'bate' ? back(k) : eOut(k);
    const blur = (1 - eOut(k)) * 22;
    let tr = '';
    if (modo === 'sobe') tr = `translateY(${(1 - e) * dist}px)`;
    else if (modo === 'esq') tr = `translateX(${(1 - e) * -dist * 4}px)`;
    else if (modo === 'dir') tr = `translateX(${(1 - e) * dist * 4}px)`;
    else if (modo === 'bate') tr = `scale(${mix(1.9, 1, e)})`;
    else if (modo === 'zoom') tr = `scale(${mix(0.6, 1, e)})`;
    return `opacity:${cl(k * 3)};transform:${tr};filter:blur(${blur.toFixed(1)}px);`;
  }

  /* ── fundos ── */
  function fundo(tipo, t) {
    const dx = Math.sin(t * 0.7) * 120, dy = Math.cos(t * 0.5) * 160;
    switch (tipo) {
      case 'claro': return `background:radial-gradient(120% 70% at ${50 + dx / 20}% 30%, #FFFFFF 0%, #E9ECEF 55%, #C9CED4 100%);`;
      case 'escuro': return `background:radial-gradient(90% 55% at ${85 + dx / 30}% ${-5 + dy / 40}%, rgba(249,186,23,.32) 0%, rgba(249,186,23,0) 60%),
        radial-gradient(80% 50% at ${10 - dx / 30}% ${105 - dy / 40}%, rgba(247,134,27,.22) 0%, rgba(0,0,0,0) 60%), #070708;`;
      case 'preto': return 'background:radial-gradient(100% 60% at 50% 45%, #1A1A1D 0%, #050506 75%);';
      case 'fogo': return `background:
        radial-gradient(60% 40% at ${30 + dx / 8}% ${30 + dy / 10}%, #FFE07A 0%, rgba(255,224,122,0) 70%),
        radial-gradient(70% 45% at ${75 - dx / 9}% ${65 - dy / 12}%, #F7861B 0%, rgba(247,134,27,0) 70%),
        radial-gradient(90% 60% at ${20 + dy / 10}% ${90}%, #C2410C 0%, rgba(194,65,12,0) 70%),
        linear-gradient(${160 + Math.sin(t) * 10}deg, #F9BA17 0%, #F59E0B 45%, #EA580C 100%);`;
      case 'amarelo': return `background:radial-gradient(100% 70% at 50% 40%, #FFD54F 0%, #F9BA17 60%, #E8A30C 100%);`;
      case 'verde': return `background:radial-gradient(100% 70% at 50% 45%, #5BEA76 0%, #3DDC5C 60%, #28B946 100%);`;
      default: return `background:${tipo};`;
    }
  }
  /* faixas de seda (fogo) por cima do fundo */
  function seda(t, cor = 'rgba(255,255,255,.18)') {
    let s = '';
    for (let i = 0; i < 4; i++) {
      const a = t * (0.3 + i * 0.07) + i * 1.7;
      s += `<div style="position:absolute;left:${-300 + i * 120}px;top:${200 + i * 420 + Math.sin(a) * 120}px;width:1800px;height:${180 + i * 40}px;
        border-radius:50%;background:${cor};filter:blur(${50 + i * 8}px);transform:rotate(${-25 + Math.sin(a * 0.8) * 14}deg);"></div>`;
    }
    return s;
  }
  /* poeira de estrelas (preto) */
  function estrelas(t) {
    let s = '';
    for (let i = 0; i < 90; i++) {
      const x = hash(i) * W, y = (hash(i + 99) * H + t * (20 + hash(i + 7) * 60)) % H, r = 1 + hash(i + 3) * 2.5;
      s += `<div style="position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:rgba(255,255,255,${0.25 + hash(i + 5) * 0.5})"></div>`;
    }
    return s;
  }

  /* ── tipografia ── */
  /* linhas: [{ txt, tam, cor, it, a (início relativo, s), modo, fonte }] */
  function linhas(t, L, opts = {}) {
    const al = opts.alinhar || 'center';
    let h = `<div style="position:absolute;left:70px;right:70px;top:${opts.topo ?? 0}px;${opts.topo == null ? 'bottom:0;display:flex;flex-direction:column;justify-content:center;' : ''}text-align:${al};">`;
    for (const l of L) {
      const fonte = l.fonte === 'redonda' ? "'Fredoka'" : l.fonte === 'ui' ? "'Inter'" : "'Anton'";
      const peso = l.fonte === 'redonda' ? 700 : l.fonte === 'ui' ? 800 : 400;
      const tam = l.tam || 150;
      const sk = l.it ? 'skewX(-9deg)' : '';
      const sombra = l.sombra === false ? '' : 'text-shadow:0 18px 40px rgba(0,0,0,.28);';
      const st = entra(t, l.a || 0, l.d || 0.3, l.modo || 'sobe', l.dist || 140);
      const grad = l.grad ? `background:${l.grad};-webkit-background-clip:text;background-clip:text;color:transparent;${''}` : `color:${l.cor || C.branco};`;
      h += `<div style="font-family:${fonte};font-weight:${peso};font-size:${tam}px;line-height:${l.lh || 1.08};letter-spacing:${l.ls ?? -0.5}px;
        text-transform:${l.minus ? 'none' : 'uppercase'};${grad}${l.grad ? '' : sombra}margin-top:${l.mt || 0}px;">
        <span style="display:inline-block;${st}${sk ? '' : ''}"><span style="display:inline-block;transform:${sk}">${esc(l.txt)}</span></span></div>`;
    }
    return h + '</div>';
  }

  /* ── componentes de interface ── */
  const sombraCartao = 'box-shadow:0 30px 60px rgba(0,0,0,.35), 0 6px 14px rgba(0,0,0,.2);';
  function pilula(txt, estilo) {
    return `<div style="display:inline-block;padding:26px 44px;border-radius:22px;${sombraCartao}
      background:linear-gradient(180deg,#232327 0%,#0E0E10 100%);border:2px solid rgba(249,186,23,.55);
      font-family:'Anton';font-size:66px;color:${C.amarelo};text-transform:uppercase;letter-spacing:0;${estilo}">${esc(txt)}</div>`;
  }
  function logoSVG(corTexto = '#FFFFFF', tam = 1) {
    return `<svg width="${960 * tam}" height="${210 * tam}" viewBox="0 0 960 210" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M70 196 L70 112 Q70 92 90 92 L118 92 Q132 92 132 78 L132 60 Q132 42 150 42 Q168 42 168 62 L168 92"
              stroke="${corTexto}" stroke-width="14"/>
        <path d="M40 104 L40 186 Q40 196 52 196 L170 196 Q186 196 186 180 L186 120" stroke="${corTexto}" stroke-width="14"/>
        <path d="M150 128 L186 128 M150 154 L186 154" stroke="${corTexto}" stroke-width="12"/>
        <path d="M112 66 Q160 128 214 52" stroke="${C.amarelo}" stroke-width="20"/>
        <path d="M134 14 L134 34 M178 14 L178 34" stroke="${corTexto}" stroke-width="14"/>
      </g>
      <text x="252" y="160" font-family="Fredoka" font-weight="700" font-size="150" fill="${corTexto}" letter-spacing="-2">Tá-se</text>
      <text x="636" y="160" font-family="Fredoka" font-weight="700" font-size="150" fill="${C.amarelo}" letter-spacing="-2">Bem</text>
    </svg>`;
  }
  function notif(n, estilo = '') {
    return `<div style="width:900px;display:flex;gap:26px;align-items:center;padding:28px 32px;border-radius:34px;
      background:rgba(28,28,31,.92);${sombraCartao}${estilo}">
      <div style="width:96px;height:96px;flex:none;border-radius:24px;background:${n.cor || C.amarelo};display:flex;align-items:center;justify-content:center;
        font-family:'Fredoka';font-weight:700;font-size:44px;color:${C.preto}">${n.icone || '✓'}</div>
      <div style="flex:1;min-width:0;font-family:'Inter';color:#fff">
        <div style="display:flex;justify-content:space-between;font-size:30px;font-weight:800">${esc(n.titulo)}<span style="font-weight:500;color:#9a9aa2;font-size:26px">${esc(n.quando || 'agora')}</span></div>
        <div style="font-size:30px;font-weight:500;color:#d4d4d8;margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(n.texto)}</div>
      </div></div>`;
  }
  function bolha(m, estilo = '') {
    const minha = m.de === 'eu';
    return `<div style="display:flex;justify-content:${minha ? 'flex-end' : 'flex-start'};${estilo}">
      <div style="max-width:720px;padding:24px 30px;border-radius:30px;${minha ? 'border-bottom-right-radius:8px' : 'border-bottom-left-radius:8px'};
        background:${minha ? '#DCF8C6' : '#FFFFFF'};color:#111;font-family:'Inter';font-weight:500;font-size:36px;line-height:1.3;${sombraCartao}">
        ${m.nome ? `<div style="font-weight:800;font-size:28px;color:#B7791F;margin-bottom:4px">${esc(m.nome)}</div>` : ''}${esc(m.txt)}
        <div style="text-align:right;font-size:22px;color:#8a8a8a;margin-top:6px">${esc(m.hora || '')} ${m.lido === false ? '✓' : ''}</div>
      </div></div>`;
  }

  /* telemóvel com ecrã HTML */
  function telemovel(ecra, estilo = '', escala = 1) {
    return `<div style="position:absolute;left:50%;top:50%;width:640px;height:1300px;margin:-650px 0 0 -320px;transform:scale(${escala});${estilo}">
      <div style="position:absolute;inset:0;border-radius:92px;background:linear-gradient(145deg,#3a3a3f,#0d0d0f);box-shadow:0 60px 120px rgba(0,0,0,.55);"></div>
      <div style="position:absolute;inset:16px;border-radius:78px;overflow:hidden;background:#F6F6F4;">${ecra}</div>
      <div style="position:absolute;left:50%;top:34px;width:190px;height:52px;margin-left:-95px;border-radius:30px;background:#0b0b0c;"></div>
    </div>`;
  }
  /* cabeçalho da app do cliente (marca do negócio) */
  function appTopo(neg, passo) {
    return `<div style="padding:110px 44px 26px;background:${C.preto};color:#fff;font-family:'Inter'">
      <div style="font-family:'Fredoka';font-weight:700;font-size:44px">${esc(neg)}</div>
      <div style="font-size:26px;color:${C.amarelo};font-weight:700;margin-top:8px;letter-spacing:1px;text-transform:uppercase">${esc(passo)}</div></div>`;
  }
  function linhaOpcao(txt, sub, ativo, k = 1) {
    return `<div style="margin:18px 30px 0;padding:28px 30px;border-radius:26px;background:${ativo ? C.amarelo : '#fff'};
      box-shadow:0 6px 18px rgba(0,0,0,.08);display:flex;justify-content:space-between;align-items:center;font-family:'Inter';
      transform:scale(${ativo ? mix(1, 1.04, k) : 1});opacity:${ativo ? 1 : 1}">
      <span style="font-size:34px;font-weight:800;color:#111">${esc(txt)}</span><span style="font-size:30px;font-weight:700;color:${ativo ? '#111' : '#666'}">${esc(sub)}</span></div>`;
  }
  function dedo(x, y, k) {   // ponto de toque
    if (k <= 0) return '';
    const r = mix(30, 90, eOut(k)), op = k < 1 ? 0.55 * (1 - k * 0.6) : 0;
    return `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${2 * r}px;height:${2 * r}px;border-radius:50%;
      background:rgba(249,186,23,${op});border:4px solid rgba(17,17,17,${op})"></div>`;
  }

  /* ── tipos de plano ── */
  const PLANOS = {
    /* texto cinético puro */
    texto(p, t, d) {
      let s = '';
      if (p.fundo === 'fogo') s += seda(t);
      if (p.fundo === 'preto') s += estrelas(t);
      if (p.icone) s += p.icone(t);
      s += linhas(t, p.linhas, { alinhar: p.alinhar, topo: p.topo });
      return s;
    },
    /* cartões de problema que se empilham */
    pilulas(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 260 }) : '';
      s += `<div style="position:absolute;left:0;right:0;top:${p.topo ?? 640}px;display:flex;flex-direction:column;gap:46px;">`;
      p.itens.forEach((it, i) => {
        const a = (p.a0 ?? 0.1) + i * (p.passo ?? 0.55), lado = i % 2 ? 'dir' : 'esq';
        s += `<div style="display:flex;justify-content:${i % 2 ? 'flex-end' : 'flex-start'};padding:0 60px;">
          <div style="${entra(t, a, 0.32, lado, 120)}">${pilula(it, `transform:rotate(${i % 2 ? 2 : -2}deg)`)}</div></div>`;
      });
      return s + '</div>';
    },
    /* notificações que caem do topo e se empilham */
    notifs(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 1150 }) : '';
      p.itens.forEach((n, i) => {
        const a = (p.a0 ?? 0.1) + i * (p.passo ?? 0.45);
        const k = eOut(lin(t, a, a + 0.35));
        const y = 120 + i * 200;
        s += `<div style="position:absolute;left:90px;top:${y}px;${k <= 0 ? 'opacity:0' : `transform:translateY(${(1 - k) * -260}px) scale(${mix(0.9, 1, k)});filter:blur(${(1 - k) * 14}px);opacity:${cl(k * 2)}`}">${notif(n)}</div>`;
      });
      return s;
    },
    /* conversa de mensagens sem resposta */
    conversa(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 150 }) : '';
      s += `<div style="position:absolute;left:60px;right:60px;top:${p.topo ?? 620}px;display:flex;flex-direction:column;gap:30px">`;
      p.msgs.forEach((m, i) => { const a = (p.a0 ?? 0.15) + i * (p.passo ?? 0.5); s += bolha(m, entra(t, a, 0.3, m.de === 'eu' ? 'dir' : 'esq', 60)); });
      return s + '</div>';
    },
    /* telemóvel: fluxo de marcação — p.ecras: [{ passo, opcoes:[[txt,sub]], escolhe (índice), a (início) }] */
    app(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 120 }) : '';
      // ecrã ativo
      let idx = 0; p.ecras.forEach((e, i) => { if (t >= (e.a || 0)) idx = i; });
      const e = p.ecras[idx], te = t - (e.a || 0);
      let ecra = appTopo(p.negocio, e.passo);
      if (e.grelha) {   // horários: grelha com ocupados riscados
        ecra += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:30px;">`;
        e.grelha.forEach((h, j) => {
          const ocupado = h.startsWith('x'), hh = ocupado ? h.slice(1) : h;
          const some = ocupado ? lin(te, 0.25, 0.6) : 0;
          const ativo = j === e.escolhe && te > (e.toque ?? 0.9);
          ecra += `<div style="padding:30px 0;border-radius:22px;text-align:center;font-family:'Inter';font-weight:800;font-size:34px;
            background:${ativo ? C.amarelo : ocupado ? '#e4e4e4' : '#fff'};color:${ocupado ? '#aaa' : '#111'};box-shadow:0 6px 14px rgba(0,0,0,.07);
            opacity:${1 - some * 0.85};transform:scale(${mix(1, 0.85, some)})${ativo ? ` scale(${mix(1.0, 1.06, lin(te, e.toque ?? 0.9, (e.toque ?? 0.9) + 0.2))})` : ''};
            ${ocupado ? 'text-decoration:line-through;' : ''}">${esc(hh)}</div>`;
        });
        ecra += '</div>';
        if (e.nota) ecra += `<div style="margin:10px 30px;font-family:'Inter';font-weight:700;font-size:28px;color:#2f9e44;opacity:${lin(te, 0.6, 0.9)}">● ${esc(e.nota)}</div>`;
      } else if (e.feito) {
        const k = back(lin(te, 0.05, 0.45));
        ecra += `<div style="padding:80px 40px;text-align:center;font-family:'Inter'">
          <div style="width:220px;height:220px;margin:0 auto;border-radius:50%;background:${C.verde};display:flex;align-items:center;justify-content:center;transform:scale(${k});
            font-size:150px;color:#fff;font-weight:800">✓</div>
          <div style="font-family:'Anton';font-size:84px;color:#111;margin-top:40px;text-transform:uppercase;${entra(te, 0.3, 0.3)}">${esc(e.feito)}</div>
          ${(e.detalhes || []).map((x, j) => `<div style="font-size:34px;font-weight:700;color:#444;margin-top:18px;${entra(te, 0.45 + j * 0.12, 0.3)}">${esc(x)}</div>`).join('')}</div>`;
      } else {
        e.opcoes.forEach((o, j) => {
          const ativo = j === e.escolhe && te > (e.toque ?? 0.6);
          ecra += `<div style="${entra(te, 0.04 * j, 0.25, 'sobe', 40)}">${linhaOpcao(o[0], o[1], ativo, lin(te, e.toque ?? 0.6, (e.toque ?? 0.6) + 0.2))}</div>`;
        });
      }
      // toque
      let toque = '';
      if (e.escolhe != null && !e.feito) {
        const tq = e.toque ?? (e.grelha ? 0.9 : 0.6);
        let x, y;
        if (e.grelha) { const col = e.escolhe % 3, row = Math.floor(e.escolhe / 3); x = 30 + 18 * col + (580 - 60 - 36) / 3 * (col + 0.5) + 16; y = 226 + 30 + row * (105 + 18) + 52 + 16; }
        else { x = 320; y = 226 + 18 + e.escolhe * (114 + 18) + 57 + 16; }
        toque = dedo(x, y, lin(te, tq - 0.05, tq + 0.35));
      }
      const ent = lin(t, 0, 0.35), cam = p.camara ? p.camara(t, d) : '';
      s += `<div style="position:absolute;inset:0;transform:translateY(${p.descer ?? 120}px) ${cam}">${telemovel(ecra + `<div style="position:absolute;inset:0">${toque}</div>`, `opacity:${cl(ent * 3)};filter:blur(${(1 - eOut(ent)) * 18}px);transform:scale(${mix(1.25, p.escala ?? 0.95, eOut(ent))}) rotate(${mix(-6, p.rot ?? 0, eOut(ent))}deg)`)}</div>`;
      return s;
    },
    /* cartão de carimbos */
    carimbos(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 220 }) : '';
      const n = p.n || 5, a0 = p.a0 ?? 0.3, passo = p.passo ?? 0.38;
      const k0 = eOut(lin(t, 0, 0.35));
      s += `<div style="position:absolute;left:90px;width:900px;top:${p.topo ?? 760}px;height:560px;border-radius:44px;
        background:linear-gradient(135deg,#1d1d20,#0b0b0c);${sombraCartao}border:3px solid rgba(249,186,23,.6);
        transform:perspective(1400px) rotateX(${mix(35, 8, k0)}deg) rotateZ(${mix(-8, -2, k0)}deg) scale(${mix(0.8, 1, k0)});opacity:${cl(k0 * 3)};filter:blur(${(1 - k0) * 16}px)">
        <div style="padding:46px 56px 0;font-family:'Fredoka';font-weight:700;font-size:48px;color:#fff;display:flex;justify-content:space-between">
          ${esc(p.negocio)}<span style="color:${C.amarelo};font-family:'Inter';font-weight:800;font-size:30px;letter-spacing:2px;margin-top:14px">CARTÃO DE CLIENTE</span></div>
        <div style="display:flex;justify-content:space-between;padding:70px 56px 0">`;
      for (let i = 0; i < n; i++) {
        const a = a0 + i * passo, k = lin(t, a, a + 0.18), ultimo = i === n - 1;
        const cheio = k > 0;
        s += `<div style="width:140px;height:140px;border-radius:50%;border:5px dashed rgba(255,255,255,.35);position:relative;">
          ${cheio ? `<div style="position:absolute;inset:-5px;border-radius:50%;background:${ultimo ? C.verde : C.amarelo};display:flex;align-items:center;justify-content:center;
            transform:scale(${mix(2.2, 1, back(k))}) rotate(${mix(-40, -8, k)}deg);opacity:${cl(k * 3)};font-family:'Anton';font-size:${ultimo ? 52 : 64}px;color:#111">${ultimo ? esc(p.premio || '50%') : esc(p.simbolo || '✂')}</div>` : ''}</div>`;
      }
      s += `</div><div style="padding:56px 56px 0;font-family:'Inter';font-weight:700;font-size:34px;color:#cfcfd4">${esc(p.regra || '')}</div></div>`;
      return s;
    },
    /* painel do dono: agenda que enche + contadores */
    painel(p, t, d) {
      let s = p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 150 }) : '';
      const k0 = eOut(lin(t, 0, 0.35));
      const cols = p.colunas, linhasH = p.horas;
      s += `<div style="position:absolute;left:60px;width:960px;top:${p.topo ?? 640}px;border-radius:40px;overflow:hidden;background:#141416;${sombraCartao}
        border:2px solid #2a2a2e;transform:perspective(1600px) rotateX(${mix(25, 6, k0)}deg) scale(${mix(0.85, 1, k0)});opacity:${cl(k0 * 3)};filter:blur(${(1 - k0) * 14}px)">
        <div style="display:flex;align-items:center;gap:14px;padding:26px 34px;background:#0c0c0d;font-family:'Inter';font-weight:800;color:#fff;font-size:30px">
          <span style="width:16px;height:16px;border-radius:50%;background:#ff5f57"></span><span style="width:16px;height:16px;border-radius:50%;background:#febc2e"></span><span style="width:16px;height:16px;border-radius:50%;background:#28c840"></span>
          <span style="margin-left:18px">${esc(p.titulo || 'Painel')}</span><span style="margin-left:auto;color:${C.verde};font-size:26px">● AO VIVO</span></div>
        <div style="display:flex;gap:22px;padding:28px 34px 10px">`;
      (p.contadores || []).forEach((c, i) => {
        const v = Math.round(c.de + (c.ate - c.de) * eOut(lin(t, c.a ?? 0.4, (c.a ?? 0.4) + (c.dur ?? 1.6))));
        s += `<div style="flex:1;background:#0b0b0c;border-radius:24px;padding:24px 28px;display:flex;align-items:center;gap:20px">
          <span style="font-family:'Anton';font-size:96px;line-height:1;color:${i ? C.verde : '#fff'}">${c.fmt ? c.fmt(v) : v}</span>
          <span style="font-family:'Inter';font-weight:800;font-size:24px;color:#a1a1aa;text-transform:uppercase;line-height:1.2">${c.rotulo}</span></div>`;
      });
      s += `</div><div style="display:grid;grid-template-columns:110px repeat(${cols.length},1fr);gap:10px;padding:20px 34px 34px;font-family:'Inter'">
        <div></div>${cols.map((c) => `<div style="color:#a1a1aa;font-weight:800;font-size:24px;text-align:center">${esc(c)}</div>`).join('')}`;
      linhasH.forEach((h, r) => {
        s += `<div style="color:#71717a;font-weight:700;font-size:24px;padding-top:18px">${esc(h)}</div>`;
        cols.forEach((c, ci) => {
          const id = r * cols.length + ci;
          const item = (p.marcacoes || [])[id];
          let cel = '';
          if (item) {
            const a = (p.a0 ?? 0.5) + (p.ordem ? p.ordem.indexOf(id) : id) * (p.passo ?? 0.09), k = lin(t, a, a + 0.2);
            cel = k > 0 ? `<div style="height:100%;border-radius:14px;background:${C.amarelo};color:#111;font-weight:800;font-size:22px;padding:10px 12px;
              transform:scale(${mix(1.5, 1, back(k))});opacity:${cl(k * 3)};white-space:nowrap;overflow:hidden">${esc(item)}</div>` : '';
          }
          s += `<div style="height:70px;border-radius:14px;background:#1e1e21">${cel}</div>`;
        });
      });
      return s + '</div></div>';
    },
    /* visto gigante */
    visto(p, t, d) {
      const k = back(lin(t, 0.02, 0.32));
      return `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
        <svg width="560" height="560" viewBox="0 0 100 100" style="transform:scale(${k})"><path d="M18 54 L40 74 L84 28" fill="none" stroke="#fff" stroke-width="13"
        stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="110" stroke-dashoffset="${110 * (1 - eOut(lin(t, 0.05, 0.35)))}"/></svg></div>`
        + (p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 1350 }) : '');
    },
    /* assinatura final */
    logo(p, t, d) {
      const k = eOut(lin(t, 0.05, 0.6));
      let s = seda(t, 'rgba(249,186,23,.12)');
      s += `<div style="position:absolute;left:0;right:0;top:${p.topo ?? 700}px;display:flex;justify-content:center;
        transform:scale(${mix(1.6, 1, k)});filter:blur(${(1 - k) * 24}px);opacity:${cl(k * 2)}">${logoSVG('#FFFFFF', 1.05)}</div>`;
      s += `<div style="position:absolute;left:0;right:0;top:${(p.topo ?? 700) + 300}px;text-align:center;font-family:'Inter';font-weight:700;font-size:40px;color:#d4d4d8;${entra(t, 0.6, 0.35)}">${esc(p.slogan || '')}</div>`;
      s += `<div style="position:absolute;left:0;right:0;top:${(p.topo ?? 700) + 470}px;display:flex;justify-content:center;${entra(t, 0.9, 0.35, 'bate')}">
        <div style="padding:36px 70px;border-radius:999px;background:${C.amarelo};font-family:'Fredoka';font-weight:700;font-size:64px;color:#111;box-shadow:0 20px 60px rgba(249,186,23,.45)">${esc(p.botao || 'tassbem.pt')}</div></div>`;
      if (p.rodape) s += `<div style="position:absolute;left:0;right:0;bottom:150px;text-align:center;font-family:'Inter';font-weight:700;font-size:34px;color:#a1a1aa;${entra(t, 1.2, 0.35)}">${esc(p.rodape)}</div>`;
      return s;
    },
  };

  /* ── montagem ── */
  const F = window.FILME;
  let inicio = 0;
  const planos = F.planos.map((p) => { const q = { ...p, de: inicio }; inicio = p.ate; return q; });

  function render(t) {
    let i = planos.findIndex((p) => t < p.ate); if (i < 0) i = planos.length - 1;
    const p = planos[i], lt = t - p.de, d = p.ate - p.de;
    /* câmara: entrada com zoom e desfoque nas primeiras imagens, deriva lenta e batida opcional */
    const kIn = lin(lt, 0, 0.18);
    const zoomIn = p.semEntrada ? 1 : mix(1.12, 1, eOut(kIn));
    const deriva = 1 + lt * (p.deriva ?? 0.012);
    let sx = 0, sy = 0;
    for (const b of p.batidas || []) { const k = lin(lt, b, b + 0.25); if (k > 0 && k < 1) { const a = (1 - k) * 14; sx += Math.sin(lt * 90) * a; sy += Math.cos(lt * 77) * a; } }
    const blurIn = p.semEntrada ? 0 : (1 - eOut(kIn)) * 10;
    const corpo = PLANOS[p.tipo](p, lt, d);
    const vinheta = p.fundo === 'claro' ? 'radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 60%, rgba(0,0,0,.18) 100%)' : 'radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)';
    return `<div style="position:absolute;inset:0;${fundo(p.fundo || 'escuro', t)}"></div>
      <div style="position:absolute;inset:0;transform:translate(${sx}px,${sy}px) scale(${zoomIn * deriva});filter:blur(${blurIn.toFixed(1)}px)">${corpo}</div>
      <div style="position:absolute;inset:0;background:${vinheta};pointer-events:none"></div>`;
  }

  const palco = document.getElementById('palco');
  window.__seek = (t) => { palco.innerHTML = render(t); void palco.offsetHeight; };
  window.CORES = C;
  document.fonts.ready.then(() => Promise.all(['Anton', 'Fredoka', 'Inter'].map((f) => document.fonts.load(`700 40px '${f}'`)))).then(() => {
    window.__seek(+(new URLSearchParams(location.search).get('t') || 0));
    window.__ready = true;
  });
})();
