/* Tá-se Bem — planos do guia da plataforma (lado do dono). Carregado antes de engine.js. */
window.EXTRA = (k) => {
  const { C, cl, lin, eOut, eIO, back, mix, hash, esc, entra, linhas, logoSVG, notif, telemovel, dedo, sombraCartao } = k;
  const UI = "font-family:'Inter';";
  const titulo = (p, t) => (p.linhas ? linhas(t, p.linhas, { topo: p.topoTitulo ?? 110 }) : '');
  /* entrada do telemóvel (zoom com desfoque) */
  const telEntra = (t, esc0 = 1.25, escF = 1.0, rot = 0) => { const e = lin(t, 0, 0.35); return `opacity:${cl(e * 3)};filter:blur(${(1 - eOut(e)) * 18}px);transform:scale(${mix(esc0, escF, eOut(e))}) rotate(${mix(-5, rot, eOut(e))}deg)`; };
  const tel = (p, t, ecra, extra = '') => `<div style="position:absolute;inset:0;transform:translateY(${p.descer ?? 180}px)">${telemovel(ecra + extra, telEntra(t, 1.25, p.escala ?? 1.08, p.rot ?? 0))}</div>`;
  /* cabeçalho da app do dono */
  const topoDono = (neg, sub, vivo = true) => `<div style="padding:104px 40px 24px;background:${C.preto};color:#fff;${UI}">
      <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:'Fredoka';font-weight:700;font-size:40px">${esc(neg)}</span>
      ${vivo ? `<span style="font-size:22px;font-weight:800;color:${C.verde}">● AO VIVO</span>` : ''}</div>
      <div style="font-size:24px;color:${C.amarelo};font-weight:700;margin-top:6px;letter-spacing:1px;text-transform:uppercase">${esc(sub)}</div></div>`;
  const cartao = (estilo = '') => `background:#fff;border-radius:26px;box-shadow:0 6px 18px rgba(0,0,0,.08);${estilo}`;
  const num = (v) => String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return {
    /* 1 · login com número de telemóvel e código por SMS */
    login(p, t) {
      const numero = p.numero || '912 345 678', codigo = p.codigo || '482913';
      const nDig = Math.floor(cl((t - 0.6) / 1.4) * numero.replace(/ /g, '').length);
      let mostrado = ''; let c = 0; for (const ch of numero) { if (ch === ' ') { if (c < nDig) mostrado += ' '; continue; } if (c++ < nDig) mostrado += ch; }
      const cursor = t < 2.2 && Math.floor(t * 3) % 2 === 0 ? '|' : '';
      const fase2 = t >= 3.1, entrou = t >= 5.6;
      let ecra = '';
      if (!entrou) {
        ecra += `<div style="padding:150px 44px 0;${UI}">
          <div style="transform:scale(.55);transform-origin:left top;height:130px">${logoSVG('#111', 1)}</div>
          <div style="font-family:'Anton';font-size:76px;color:#111;text-transform:uppercase;line-height:1;margin-top:10px">${fase2 ? 'Código' : 'Entrar'}</div>
          <div style="font-size:30px;color:#555;margin-top:14px;font-weight:500">${fase2 ? 'Enviámos um código por SMS para +351 ' + esc(numero) : 'Só precisas do teu número de telemóvel.'}</div>`;
        if (!fase2) {
          ecra += `<div style="margin-top:46px;display:flex;gap:14px">
            <div style="${cartao('padding:30px 22px;font-size:38px;font-weight:800;color:#111')}">PT +351</div>
            <div style="${cartao('flex:1;padding:30px 26px;font-size:40px;font-weight:800;color:#111;letter-spacing:1px;border:3px solid ' + (t > 0.5 ? C.amarelo : 'transparent'))}">${esc(mostrado)}${cursor}</div></div>
            <div style="margin-top:34px;padding:34px;border-radius:26px;text-align:center;font-size:36px;font-weight:800;color:#111;background:${C.amarelo};transform:scale(${t > 2.6 && t < 2.9 ? 0.96 : 1})">Enviar código</div>`;
        } else {
          const tc = t - 3.1;
          ecra += `<div style="margin-top:50px;display:flex;gap:12px;justify-content:space-between">`;
          for (let i = 0; i < 6; i++) {
            const k = lin(tc, 0.9 + i * 0.16, 1.05 + i * 0.16), ok = tc > 2.1;
            ecra += `<div style="width:80px;height:108px;border-radius:20px;${cartao()}border:3px solid ${ok ? C.verde : k > 0 ? C.amarelo : '#e5e5e5'};display:flex;align-items:center;justify-content:center;
              font-family:'Anton';font-size:60px;color:#111;transform:scale(${k > 0 && k < 1 ? mix(1.3, 1, k) : 1})">${k > 0 ? codigo[i] : ''}</div>`;
          }
          ecra += `</div><div style="margin-top:30px;font-size:28px;font-weight:700;color:${tc > 2.1 ? '#2f9e44' : '#888'}">${tc > 2.1 ? '✓ Código confirmado' : 'Preenchido automaticamente'}</div>`;
        }
        ecra += '</div>';
      } else {
        const tk = t - 5.6, kk = back(lin(tk, 0, 0.4));
        ecra += `<div style="position:absolute;inset:0;background:${C.preto};display:flex;flex-direction:column;align-items:center;justify-content:center;${UI}">
          <div style="width:230px;height:230px;border-radius:50%;background:${C.amarelo};display:flex;align-items:center;justify-content:center;transform:scale(${kk});
            font-family:'Fredoka';font-weight:700;font-size:110px;color:#111">${esc(p.inicial || 'R')}</div>
          <div style="font-family:'Anton';font-size:88px;color:#fff;margin-top:40px;text-transform:uppercase;${entra(tk, 0.25, 0.3)}">Olá, ${esc(p.nome || 'Rui')}!</div>
          <div style="font-size:30px;color:#a1a1aa;margin-top:14px;font-weight:600;${entra(tk, 0.45, 0.3)}">A abrir o teu painel…</div></div>`;
      }
      // SMS que cai do topo
      let sms = '';
      if (t >= 3.0 && !entrou) {
        const ks = eOut(lin(t, 3.0, 3.35)), sai = lin(t, 4.9, 5.3);
        sms = `<div style="position:absolute;left:14px;right:14px;top:${mix(-200, 70, ks) - sai * 260}px;padding:22px 24px;border-radius:30px;background:rgba(30,30,33,.96);color:#fff;${UI}${sombraCartao}">
          <div style="display:flex;justify-content:space-between;font-size:22px;font-weight:800;color:#9a9aa2"><span>MENSAGENS</span><span>agora</span></div>
          <div style="font-size:27px;font-weight:700;margin-top:6px">Tá-se Bem: o teu código é <span style="color:${C.amarelo}">${codigo.slice(0, 3)} ${codigo.slice(3)}</span></div></div>`;
      }
      const toque = t > 2.5 && t < 3.0 ? dedo(304, 860, lin(t, 2.5, 2.9)) : '';
      return titulo(p, t) + tel(p, t, ecra, sms + toque);
    },

    /* 2 · painel ao vivo: cartões com contadores, gráfico do dia e atividade */
    casa(p, t) {
      let ecra = topoDono(p.negocio, p.sub || 'Hoje · quinta, 16');
      ecra += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding:24px 24px 0;${UI}">`;
      p.cartoes.forEach((c, i) => {
        const v = Math.round(c.de + (c.ate - c.de) * eOut(lin(t, 0.4 + i * 0.15, 2.6 + i * 0.15)));
        ecra += `<div style="${cartao('padding:22px 24px;' + entra(t, 0.15 + i * 0.08, 0.3, 'sobe', 40))}">
          <div style="font-size:21px;font-weight:800;color:#777;text-transform:uppercase;letter-spacing:.5px">${esc(c.rotulo)}</div>
          <div style="font-family:'Anton';font-size:64px;line-height:1.05;color:${i === 0 ? '#111' : '#111'}">${num(v)}${c.suf ? `<span style="font-size:38px"> ${c.suf}</span>` : ''}</div></div>`;
      });
      ecra += '</div>';
      // gráfico de área (faturação acumulada ao longo do dia)
      const pts = p.curva, w = 560, h = 190, kk = eOut(lin(t, 0.8, 3.2));
      const xy = pts.map((v, i) => [i / (pts.length - 1) * w, h - v / Math.max(...pts) * (h - 20)]);
      const n = Math.max(2, Math.ceil(kk * pts.length));
      const vis = xy.slice(0, n), d = vis.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
      ecra += `<div style="margin:18px 24px 0;${cartao('padding:20px 20px 12px')}">
        <div style="${UI}font-size:21px;font-weight:800;color:#777;text-transform:uppercase">Faturação ao longo do dia</div>
        <svg width="${w}" height="${h + 8}" viewBox="0 -4 ${w} ${h + 8}"><path d="${d} L ${vis[n - 1][0]} ${h} L 0 ${h} Z" fill="rgba(249,186,23,.25)"/><path d="${d}" fill="none" stroke="${C.amarelo}" stroke-width="5" stroke-linejoin="round"/>
        <circle cx="${vis[n - 1][0]}" cy="${vis[n - 1][1]}" r="9" fill="${C.amarelo}" stroke="#fff" stroke-width="3"/></svg></div>`;
      // atividade ao vivo
      ecra += `<div style="padding:16px 24px 0;${UI}">`;
      p.feed.forEach((f, i) => {
        const a = 1.4 + i * 0.7;
        ecra += `<div style="display:flex;gap:14px;align-items:center;padding:14px 4px;border-bottom:1px solid #e7e7e7;font-size:25px;${entra(t, a, 0.3, 'esq', 30)}">
          <span style="font-weight:800;color:#999;width:74px">${esc(f[0])}</span><span style="width:14px;height:14px;border-radius:50%;background:${f[2] || C.amarelo};flex:none"></span>
          <span style="font-weight:600;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(f[1])}</span></div>`;
      });
      ecra += '</div>';
      return titulo(p, t) + tel(p, t, ecra);
    },

    /* 3 · ecrã de bloqueio com notificações a chegar */
    bloqueio(p, t) {
      let s = titulo(p, t);
      const k0 = eOut(lin(t, 0, 0.35));
      s += `<div style="position:absolute;left:0;right:0;top:${p.topoRelogio ?? 380}px;text-align:center;color:#fff;opacity:${cl(k0 * 2)}">
        <div style="${UI}font-weight:600;font-size:40px;color:#d4d4d8">${esc(p.data || 'quinta-feira, 16 de outubro')}</div>
        <div style="font-family:'Inter';font-weight:800;font-size:230px;line-height:1;letter-spacing:-6px">${esc(p.hora || '10:42')}</div></div>`;
      p.itens.forEach((n, i) => {
        const a = 0.5 + i * (p.passo ?? 0.95), kk = eOut(lin(t, a, a + 0.35));
        const y = (p.topo ?? 760) + i * 200;
        s += `<div style="position:absolute;left:90px;top:${y}px;${kk <= 0 ? 'opacity:0' : `transform:translateY(${(1 - kk) * -160}px) scale(${mix(0.92, 1, kk)});filter:blur(${(1 - kk) * 12}px);opacity:${cl(kk * 2)}`}">${notif({ quando: 'agora', ...n })}</div>`;
      });
      return s;
    },

    /* 4 · agenda da equipa: alterar (arrastar), cancelar, criar */
    agenda(p, t) {
      let s = titulo(p, t);
      const k0 = eOut(lin(t, 0, 0.35)), cols = p.colunas, horas = p.horas, rh = 74, cw = 266, x0 = 130, y0 = 120;
      const bloco = (b) => {
        let row = b.linha, op = 1, extra = '', cor = C.amarelo, txt = b.txt, sc = 1;
        if (b.move) { const km = eIO(lin(t, b.move.a, b.move.a + 0.7)); row = mix(b.linha, b.move.para, km); if (km > 0 && km < 1) { sc = 1.06; extra = 'box-shadow:0 18px 40px rgba(0,0,0,.5);'; } }
        if (b.cancela && t > b.cancela) { const kc = lin(t, b.cancela, b.cancela + 0.4); op = 1 - kc * 0.65; cor = '#3a3a40'; txt = 'Cancelada'; }
        if (b.cria != null) { const kc = lin(t, b.cria, b.cria + 0.3); if (kc <= 0) return ''; sc = mix(1.5, 1, back(kc)); op = cl(kc * 3); extra = `box-shadow:0 0 50px rgba(249,186,23,${0.6 * (1 - kc) + 0.2});`; }
        return `<div style="position:absolute;left:${x0 + b.col * (cw + 10)}px;top:${y0 + 60 + row * rh + 4}px;width:${cw}px;height:${b.dur * rh - 8}px;border-radius:16px;background:${cor};
          color:${cor === C.amarelo ? '#111' : '#a1a1aa'};${UI}font-weight:800;font-size:24px;padding:12px 16px;opacity:${op};transform:scale(${sc});${extra}${b.cancela && t > b.cancela ? 'text-decoration:line-through;' : ''}">
          ${esc(txt)}${b.sub ? `<div style="font-weight:600;font-size:20px;opacity:.75">${esc(b.sub)}</div>` : ''}</div>`;
      };
      s += `<div style="position:absolute;left:40px;width:1000px;top:${p.topo ?? 560}px;height:${y0 + 60 + horas.length * rh + 40}px;border-radius:40px;background:#141416;border:2px solid #2a2a2e;${sombraCartao}
        transform:perspective(1600px) rotateX(${mix(22, 4, k0)}deg) scale(${mix(0.86, 1, k0)});opacity:${cl(k0 * 3)};filter:blur(${(1 - k0) * 14}px)">
        <div style="position:absolute;left:34px;top:34px;${UI}font-weight:800;font-size:30px;color:#fff">${esc(p.cabecalho)}</div>`;
      cols.forEach((c, i) => { s += `<div style="position:absolute;left:${x0 + i * (cw + 10)}px;top:${y0 + 10}px;width:${cw}px;text-align:center;${UI}font-weight:800;font-size:26px;color:#a1a1aa">${esc(c)}</div>`; });
      horas.forEach((h, r) => {
        s += `<div style="position:absolute;left:28px;top:${y0 + 60 + r * rh + 8}px;${UI}font-weight:700;font-size:22px;color:#71717a">${esc(h)}</div>`;
        cols.forEach((c, i) => { s += `<div style="position:absolute;left:${x0 + i * (cw + 10)}px;top:${y0 + 60 + r * rh + 4}px;width:${cw}px;height:${rh - 8}px;border-radius:14px;background:#1c1c1f"></div>`; });
      });
      p.blocos.forEach((b) => { s += bloco(b); });
      // dedo a arrastar
      const mv = p.blocos.find((b) => b.move);
      if (mv && t > mv.move.a - 0.3 && t < mv.move.a + 1.0) {
        const km = eIO(lin(t, mv.move.a, mv.move.a + 0.7)), row = mix(mv.linha, mv.move.para, km);
        s += `<div style="position:absolute;left:${x0 + mv.col * (cw + 10) + cw - 70}px;top:${y0 + 60 + row * rh + 20}px;width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.35);border:4px solid #fff"></div>`;
      }
      s += '</div>';
      // etiquetas das ações
      s += `<div style="position:absolute;left:0;right:0;top:${(p.topo ?? 560) + y0 + 60 + horas.length * rh + 90}px;display:flex;justify-content:center;gap:22px">`;
      p.acoes.forEach(([txt, a]) => {
        const on = t >= a;
        s += `<div style="padding:20px 34px;border-radius:999px;font-family:'Anton';font-size:52px;text-transform:uppercase;background:${on ? C.amarelo : '#1c1c1f'};color:${on ? '#111' : '#55555c'};
          transform:scale(${on ? mix(1.25, 1, back(lin(t, a, a + 0.3))) : 1})">${esc(txt)}</div>`;
      });
      return s + '</div>';
    },

    /* 5 · entregas em curso: mapa com a estafeta e estados de cada pedido */
    entregas(p, t, d) {
      let s = titulo(p, t);
      const k0 = eOut(lin(t, 0, 0.35)), y0 = p.topo ?? 520, mw = 960, mh = 640;
      // ruas (determinísticas)
      let ruas = '';
      for (let i = 0; i < 9; i++) ruas += `<line x1="${i * 120 + hash(i) * 40}" y1="0" x2="${i * 120 - 60 + hash(i + 3) * 80}" y2="${mh}" stroke="#26262b" stroke-width="${i % 3 ? 10 : 18}"/>`;
      for (let j = 0; j < 6; j++) ruas += `<line x1="0" y1="${j * 120 + hash(j + 9) * 40}" x2="${mw}" y2="${j * 120 - 30 + hash(j + 5) * 60}" stroke="#26262b" stroke-width="${j % 2 ? 10 : 18}"/>`;
      const rota = p.rota, seg = [];
      let L = 0; for (let i = 1; i < rota.length; i++) { const l = Math.hypot(rota[i][0] - rota[i - 1][0], rota[i][1] - rota[i - 1][1]); seg.push(l); L += l; }
      const prog = eIO(lin(t, 0.6, d - 0.6));
      let rest = prog * L, pos = rota[0];
      for (let i = 1; i < rota.length; i++) { if (rest <= seg[i - 1]) { const f = rest / seg[i - 1]; pos = [mix(rota[i - 1][0], rota[i][0], f), mix(rota[i - 1][1], rota[i][1], f)]; break; } rest -= seg[i - 1]; pos = rota[i]; }
      const dRota = rota.map((q, i) => (i ? 'L' : 'M') + q[0] + ' ' + q[1]).join(' ');
      const eta = Math.max(1, Math.ceil((1 - prog) * (p.minutos || 8)));
      s += `<div style="position:absolute;left:60px;top:${y0}px;width:${mw}px;height:${mh}px;border-radius:40px;overflow:hidden;background:#141416;border:2px solid #2a2a2e;${sombraCartao}
        transform:scale(${mix(0.88, 1, k0)});opacity:${cl(k0 * 3)};filter:blur(${(1 - k0) * 14}px)">
        <svg width="${mw}" height="${mh}" style="position:absolute;inset:0">${ruas}
          <path d="${dRota}" fill="none" stroke="rgba(249,186,23,.35)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${dRota}" fill="none" stroke="${C.amarelo}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - prog)}" />
          <circle cx="${rota[0][0]}" cy="${rota[0][1]}" r="22" fill="#fff"/><circle cx="${rota.at(-1)[0]}" cy="${rota.at(-1)[1]}" r="26" fill="${C.verde}"/>
          <circle cx="${pos[0]}" cy="${pos[1]}" r="${40 + Math.sin(t * 6) * 4}" fill="rgba(249,186,23,.25)"/><circle cx="${pos[0]}" cy="${pos[1]}" r="24" fill="${C.amarelo}" stroke="#111" stroke-width="5"/></svg>
        <div style="position:absolute;left:28px;top:26px;padding:16px 24px;border-radius:20px;background:rgba(12,12,13,.85);${UI}color:#fff">
          <div style="font-size:22px;font-weight:800;color:#a1a1aa">${esc(p.pedido)}</div><div style="font-family:'Anton';font-size:52px;line-height:1.1">${prog >= 1 ? 'Entregue' : `Chega em ${eta} min`}</div></div></div>`;
      // lista de pedidos com estados
      const est = ['Recebido', 'Em preparação', 'A caminho', 'Entregue'];
      s += `<div style="position:absolute;left:60px;width:960px;top:${y0 + mh + 34}px;display:flex;flex-direction:column;gap:16px">`;
      p.pedidos.forEach((q, i) => {
        let e = q.de; for (const a of q.muda || []) if (t >= a) e++; e = Math.min(3, e);
        s += `<div style="display:flex;align-items:center;gap:20px;padding:22px 26px;border-radius:26px;background:#141416;border:2px solid #2a2a2e;${UI}${entra(t, 0.2 + i * 0.12, 0.3, 'sobe', 40)}">
          <div style="flex:1;min-width:0"><div style="font-weight:800;font-size:28px;color:#fff">${esc(q.nome)}</div><div style="font-size:22px;color:#a1a1aa;font-weight:600;margin-top:4px">${esc(q.sub)}</div></div>
          <div style="display:flex;gap:8px">${est.map((x, j) => `<span style="width:${j === e ? 'auto' : '22px'};height:44px;min-width:22px;border-radius:22px;padding:${j === e ? '0 18px' : '0'};display:flex;align-items:center;
            font-weight:800;font-size:22px;background:${j < e ? C.verde : j === e ? (e === 3 ? C.verde : C.amarelo) : '#2a2a2e'};color:#111;white-space:nowrap">${j === e ? esc(x) : ''}</span>`).join('')}</div></div>`;
      });
      return s + '</div>';
    },

    /* 6 · faturação da semana: barras e total sempre coerentes */
    faturacao(p, t) {
      let s = titulo(p, t);
      const k0 = eOut(lin(t, 0, 0.35)), vals = p.dias.map((d) => d[1]), max = Math.max(...vals), bh = 520;
      const parc = vals.map((v, i) => Math.round(v * eOut(lin(t, 0.5 + i * 0.32, 0.95 + i * 0.32))));
      const total = parc.reduce((a, b) => a + b, 0);
      s += `<div style="position:absolute;left:60px;width:960px;top:${p.topo ?? 520}px;border-radius:40px;background:#141416;border:2px solid #2a2a2e;padding:34px 40px;${sombraCartao}
        transform:scale(${mix(0.88, 1, k0)});opacity:${cl(k0 * 3)};filter:blur(${(1 - k0) * 14}px)">
        <div style="${UI}font-weight:800;font-size:26px;color:#a1a1aa;text-transform:uppercase;letter-spacing:1px">${esc(p.cabecalho)}</div>
        <div style="font-family:'Anton';font-size:150px;line-height:1.05;color:#fff;font-variant-numeric:tabular-nums">${num(total)} <span style="color:${C.amarelo}">€</span></div>
        <div style="display:flex;align-items:flex-end;gap:18px;height:${bh + 60}px;margin-top:20px">`;
      p.dias.forEach(([dia, v], i) => {
        const hgt = max ? parc[i] / max * bh : 0, alto = i === vals.indexOf(max);
        s += `<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:10px;${UI}">
          <div style="font-weight:800;font-size:22px;color:${alto ? C.amarelo : '#d4d4d8'};opacity:${parc[i] > 0 ? 1 : 0}">${v ? num(parc[i]) : ''}</div>
          <div style="width:100%;height:${v ? Math.max(6, hgt) : 6}px;border-radius:14px 14px 6px 6px;background:${v ? (alto ? C.amarelo : '#f4d47a') : '#2a2a2e'}"></div>
          <div style="font-weight:800;font-size:24px;color:#a1a1aa">${esc(dia)}</div></div>`;
      });
      s += `</div></div>`;
      // os serviços que mais faturam
      s += `<div style="position:absolute;left:60px;width:960px;top:${(p.topo ?? 520) + 930}px;display:flex;flex-direction:column;gap:14px">`;
      p.top.forEach(([nome, pct], i) => {
        const kk = eOut(lin(t, 2.9 + i * 0.25, 3.5 + i * 0.25));
        s += `<div style="display:flex;align-items:center;gap:20px;${UI}${entra(t, 2.8 + i * 0.25, 0.3, 'esq', 30)}">
          <span style="width:300px;font-weight:800;font-size:30px;color:#fff">${esc(nome)}</span>
          <div style="flex:1;height:30px;border-radius:15px;background:#1c1c1f"><div style="width:${pct * kk}%;height:100%;border-radius:15px;background:${C.amarelo}"></div></div>
          <span style="width:90px;text-align:right;font-weight:800;font-size:28px;color:#d4d4d8">${Math.round(pct * kk)}%</span></div>`;
      });
      return s + '</div>';
    },

    /* 7 · clientes: pesquisa e ficha */
    clientes(p, t) {
      const procura = p.procura, nl = Math.floor(cl((t - 0.5) / 0.6) * procura.length), q = procura.slice(0, nl).toLowerCase();
      const ficha = t >= p.abre;
      let ecra = topoDono(p.negocio, 'Clientes · ' + p.total, false);
      if (!ficha) {
        ecra += `<div style="padding:22px 24px 0;${UI}"><div style="${cartao('padding:24px 28px;font-size:32px;font-weight:700;color:' + (q ? '#111' : '#999'))}">⌕ ${q ? esc(procura.slice(0, nl)) : 'Procurar cliente'}${t < 1.4 && Math.floor(t * 3) % 2 ? '|' : ''}</div></div>`;
        const lista = p.lista.filter((c) => c[0].toLowerCase().includes(q));
        ecra += `<div style="padding:10px 24px 0;${UI}">`;
        lista.forEach((c, i) => {
          ecra += `<div style="display:flex;align-items:center;gap:20px;padding:20px 8px;border-bottom:1px solid #e7e7e7">
            <span style="width:76px;height:76px;border-radius:50%;background:${i % 2 ? '#e5e7eb' : C.amarelo};display:flex;align-items:center;justify-content:center;font-family:'Fredoka';font-weight:700;font-size:32px;color:#111">${esc(c[0].split(' ').map((x) => x[0]).join('').slice(0, 2))}</span>
            <div style="flex:1"><div style="font-weight:800;font-size:30px;color:#111">${esc(c[0])}</div><div style="font-size:23px;color:#777;font-weight:600">${esc(c[1])}</div></div></div>`;
        });
        ecra += '</div>';
        const toque = t > p.abre - 0.45 ? dedo(300, 420, lin(t, p.abre - 0.45, p.abre - 0.05)) : '';
        return titulo(p, t) + tel(p, t, ecra, toque);
      }
      const tf = t - p.abre, f = p.ficha;
      ecra += `<div style="padding:26px 28px 0;${UI}">
        <div style="display:flex;align-items:center;gap:24px;${entra(tf, 0, 0.3, 'sobe', 40)}"><span style="width:120px;height:120px;border-radius:50%;background:${C.amarelo};display:flex;align-items:center;justify-content:center;font-family:'Fredoka';font-weight:700;font-size:52px;color:#111">${esc(f.iniciais)}</span>
        <div><div style="font-family:'Anton';font-size:60px;color:#111;line-height:1.05;text-transform:uppercase">${esc(f.nome)}</div><div style="font-size:24px;color:#777;font-weight:600">${esc(f.desde)}</div></div></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:26px">`;
      f.dados.forEach(([r, v], i) => { ecra += `<div style="${cartao('padding:20px 22px;' + entra(tf, 0.15 + i * 0.1, 0.3, 'sobe', 30))}"><div style="font-size:20px;font-weight:800;color:#888;text-transform:uppercase">${esc(r)}</div><div style="font-family:'Anton';font-size:48px;color:#111">${esc(v)}</div></div>`; });
      ecra += `</div><div style="${cartao('padding:22px;margin-top:16px;' + entra(tf, 0.6, 0.3, 'sobe', 30))}"><div style="font-size:20px;font-weight:800;color:#888;text-transform:uppercase">Cartão de carimbos</div><div style="display:flex;gap:14px;margin-top:12px">`;
      for (let i = 0; i < 5; i++) ecra += `<span style="width:72px;height:72px;border-radius:50%;background:${i < f.carimbos ? C.amarelo : 'transparent'};border:4px dashed ${i < f.carimbos ? C.amarelo : '#ccc'};display:flex;align-items:center;justify-content:center;font-size:30px;color:#111">${i < f.carimbos ? '✂' : ''}</span>`;
      ecra += `</div></div><div style="${cartao('padding:22px;margin-top:16px;' + entra(tf, 0.8, 0.3, 'sobe', 30))}"><div style="font-size:20px;font-weight:800;color:#888;text-transform:uppercase">Prefere</div><div style="font-size:30px;font-weight:800;color:#111;margin-top:6px">${esc(f.prefere)}</div></div></div>`;
      return titulo(p, t) + tel(p, t, ecra);
    },

    /* 8 · mudar um preço e ver o site a mudar na hora */
    precos(p, t) {
      let s = titulo(p, t);
      const muda = t >= p.guarda, digit = t >= p.escreve;
      let ecra = topoDono(p.negocio, 'Serviços e preços', false) + `<div style="padding:16px 24px 0;${UI}">`;
      p.servicos.forEach(([n, pr], i) => {
        const alvo = i === p.alvo, val = alvo ? (digit ? p.novo : pr) : pr;
        ecra += `<div style="display:flex;justify-content:space-between;align-items:center;padding:24px 10px;border-bottom:1px solid #e7e7e7">
          <span style="font-weight:800;font-size:32px;color:#111">${esc(n)}</span>
          <span style="padding:12px 20px;border-radius:16px;font-weight:800;font-size:32px;color:#111;border:3px solid ${alvo && t > p.escreve - 0.5 && !muda ? C.amarelo : 'transparent'};background:${alvo && muda ? '#e8f8ec' : '#f2f2f2'}">${esc(val)}</span></div>`;
      });
      ecra += `</div><div style="margin:30px 24px 0;padding:30px;border-radius:24px;text-align:center;${UI}font-size:34px;font-weight:800;color:#111;background:${muda ? C.verde : C.amarelo}">${muda ? '✓ Guardado' : 'Guardar'}</div>`;
      const toque = t > p.escreve - 0.6 && t < p.escreve ? dedo(500, 300 + p.alvo * 99, lin(t, p.escreve - 0.6, p.escreve - 0.2)) : t > p.guarda - 0.45 && t < p.guarda + 0.2 ? dedo(304, 300 + p.servicos.length * 99 + 80, lin(t, p.guarda - 0.45, p.guarda)) : '';
      s += `<div style="position:absolute;inset:0;transform:translate(-150px,${p.descer ?? 120}px)">${telemovel(ecra + toque, telEntra(t, 1.2, 0.82, -4))}</div>`;
      // o site do negócio
      const ks = eOut(lin(t, 0.4, 0.8)), flash = muda ? 1 - lin(t, p.guarda + 0.1, p.guarda + 0.9) : 0;
      s += `<div style="position:absolute;left:470px;top:${(p.descer ?? 120) + 1060}px;width:570px;border-radius:28px;overflow:hidden;background:#fff;${sombraCartao}
        transform:translateX(${(1 - ks) * 400}px) rotate(3deg);opacity:${cl(ks * 2)};${UI}">
        <div style="padding:14px 20px;background:#e9e9ec;display:flex;gap:8px;align-items:center"><span style="width:14px;height:14px;border-radius:50%;background:#ff5f57"></span><span style="width:14px;height:14px;border-radius:50%;background:#febc2e"></span><span style="width:14px;height:14px;border-radius:50%;background:#28c840"></span>
          <span style="margin-left:12px;padding:6px 16px;border-radius:12px;background:#fff;font-size:20px;font-weight:700;color:#555">${esc(p.dominio)}</span></div>
        <div style="padding:22px 26px;background:${C.preto};color:#fff;font-family:'Fredoka';font-weight:700;font-size:34px">${esc(p.negocio)}</div>
        <div style="padding:10px 26px 22px">${p.servicos.slice(0, 3).map(([n, pr], i) => `<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #eee;font-size:26px;font-weight:700;color:#222;
          ${i === p.alvo ? `background:rgba(61,220,92,${0.35 * flash});` : ''}"><span>${esc(n)}</span><span>${esc(i === p.alvo && muda ? p.novo : pr)}</span></div>`).join('')}
          <div style="margin-top:16px;padding:16px;border-radius:14px;text-align:center;background:${C.amarelo};font-weight:800;font-size:24px;color:#111">Marcar agora</div></div></div>`;
      return s;
    },

    /* 9a · assistente: o dono escreve, a IA faz */
    ia(p, t) {
      let s = titulo(p, t);
      const msg = p.pedido, nl = Math.floor(cl((t - 0.5) / 1.5) * msg.length), envio = t >= 2.2, resp = t >= p.responde;
      s += `<div style="position:absolute;left:60px;width:960px;top:${p.topo ?? 560}px;border-radius:40px;background:#141416;border:2px solid #2a2a2e;padding:30px;${sombraCartao}${entra(t, 0, 0.35, 'zoom')}">
        <div style="display:flex;align-items:center;gap:16px;${UI}font-weight:800;font-size:30px;color:#fff;padding-bottom:22px;border-bottom:1px solid #2a2a2e">
          <span style="width:56px;height:56px;border-radius:16px;background:${C.amarelo};display:flex;align-items:center;justify-content:center;font-family:'Fredoka';color:#111">AI</span>Tá-se Bem AI <span style="margin-left:auto;font-size:22px;color:#a1a1aa">assistente do painel</span></div>
        <div style="display:flex;flex-direction:column;gap:20px;padding-top:26px;min-height:520px;${UI}">`;
      if (envio) s += `<div style="align-self:flex-end;max-width:760px;padding:24px 30px;border-radius:30px 30px 8px 30px;background:${C.amarelo};color:#111;font-size:34px;font-weight:700;${entra(t, 2.2, 0.25, 'sobe', 30)}">${esc(msg)}</div>`;
      if (envio && !resp) s += `<div style="align-self:flex-start;padding:24px 30px;border-radius:30px;background:#232327;font-size:40px;color:#fff;letter-spacing:6px">${'•••'.slice(0, 1 + Math.floor(t * 4) % 3)}</div>`;
      if (resp) s += `<div style="align-self:flex-start;max-width:780px;padding:24px 30px;border-radius:30px 30px 30px 8px;background:#232327;color:#fff;font-size:33px;font-weight:600;line-height:1.35;${entra(t, p.responde, 0.3, 'sobe', 30)}">${p.resposta}</div>`;
      s += `</div><div style="margin-top:10px;padding:24px 28px;border-radius:24px;background:#0c0c0d;border:2px solid ${!envio && nl ? C.amarelo : '#2a2a2e'};${UI}font-size:30px;color:${!envio && nl ? '#fff' : '#71717a'};font-weight:600">
        ${!envio && nl ? esc(msg.slice(0, nl)) + (Math.floor(t * 3) % 2 ? '|' : '') : 'Escreve o que precisas…'}</div></div>`;
      if (p.nota) s += `<div style="position:absolute;left:0;right:0;top:${(p.topo ?? 560) + 900}px;text-align:center;${UI}font-weight:700;font-size:30px;color:#a1a1aa;${entra(t, p.responde + 0.5, 0.3)}">${esc(p.nota)}</div>`;
      return s;
    },

    /* 9b · a IA atende o telefone */
    chamada(p, t) {
      const fim = t >= p.marca;
      let ecra = `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#1b1b1f,#0b0b0c);display:flex;flex-direction:column;align-items:center;padding-top:200px;${UI}color:#fff">
        <div style="font-size:30px;color:#a1a1aa;font-weight:700">${fim ? 'Chamada terminada' : 'Chamada recebida'}</div>
        <div style="font-family:'Anton';font-size:76px;margin-top:10px">${esc(p.numero)}</div>
        <div style="margin-top:40px;padding:16px 30px;border-radius:999px;background:${C.amarelo};color:#111;font-weight:800;font-size:28px">Tá-se Bem AI a atender</div>
        <div style="display:flex;gap:10px;align-items:center;height:200px;margin-top:40px">`;
      for (let i = 0; i < 18; i++) { const a = fim ? 6 : 14 + Math.abs(Math.sin(t * 9 + i * 0.7) * Math.cos(t * 4 + i)) * 150; ecra += `<span style="width:16px;height:${a}px;border-radius:8px;background:${C.amarelo};opacity:${0.5 + 0.5 * hash(i)}"></span>`; }
      ecra += `</div>`;
      p.falas.forEach(([quem, txt, a]) => { if (t >= a && !fim) ecra += `<div style="max-width:520px;margin-top:16px;padding:18px 24px;border-radius:24px;background:${quem === 'ai' ? '#2a2a2e' : '#fff'};color:${quem === 'ai' ? '#fff' : '#111'};font-size:26px;font-weight:600;align-self:${quem === 'ai' ? 'flex-start' : 'flex-end'};margin-left:40px;margin-right:40px;${entra(t, a, 0.25, 'sobe', 20)}">${esc(txt)}</div>`; });
      ecra += '</div>';
      const nt = fim ? `<div style="position:absolute;left:14px;right:14px;top:${mix(-200, 80, eOut(lin(t, p.marca, p.marca + 0.35)))}px">${notif({ titulo: 'Marcação criada', texto: p.resultado, icone: '✓', cor: C.verde }, 'width:580px;padding:20px;')}</div>` : '';
      return titulo(p, t) + tel(p, t, ecra, nt);
    },
  };
};
