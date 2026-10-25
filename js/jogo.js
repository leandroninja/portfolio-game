/* ==========================================================
   PORTFÓLIO JOGO · Leandro Moraes
   A própria página vira a fase:
   - [data-plat]    elemento vira plataforma (a borda de cima)
   - [data-pouso]   plataforma de chegada e checkpoint da fase
   - [data-letras]  título cujas letras afundam quando pisadas
   - [data-bits] [data-skill] [data-trofeu] [data-cafe]       coletáveis
   - [data-etapa] [data-badge] [data-escudo] [data-portal]    coletáveis e portal
   - [data-segredo]                                           bloco secreto que leva à sala bônus
   - [data-bugs] [data-glitch] [data-mob=crash|vaza|fatura]   inimigos
   - [data-fase]    seção; o fundo de cada uma é um piso sólido
                    com um buraco em cima do título da próxima
   - [data-bonus]   fase fora do fluxo, só alcançada pelo bloco secreto
   Tudo em coordenadas do documento (px a partir do topo).
   ========================================================== */
(function(){
'use strict';

var PV = window.PV, som = PV.som, I18N = PV.i18n, tr = I18N.tr;
var $ = function(s){ return document.querySelector(s); };
var $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
var root = document.documentElement;
function clamp(v, a, b){ return v < a ? a : (v > b ? b : v); }
function aproximar(v, alvo, d){ return v < alvo ? Math.min(v + d, alvo) : Math.max(v - d, alvo); }
function rnd(a, b){ return a + Math.random() * (b - a); }
function dois(n){ return n < 10 ? '0' + n : '' + n; }
function tempo(s){ return dois(Math.floor(s / 60)) + ':' + dois(Math.floor(s % 60)); }
function tempoMs(s){ return tempo(s) + '.' + dois(Math.floor((s % 1) * 100)); }
function esc(t){ return String(t).replace(/[&<>"]/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
var reduzido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- canvas ---------------- */
var cv = $('#jogo'), cx = cv.getContext('2d');
var fundo = $('#fundo'), fx = fundo.getContext('2d');
var W = 0, H = 0, DPR = 1;
function redimensionarCanvas(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = root.clientWidth; H = window.innerHeight;
  [cv, fundo].forEach(function(c){ c.width = W * DPR; c.height = H * DPR; });
  iniciarEstrelas();
}

/* ==========================================================
   SPRITES · mapa de caracteres, 1 caractere = 1 pixel
   ========================================================== */
var COR = {
  K:'#070b14', D:'#2a2018', S:'#f2c6a5', s:'#d49877', E:'#141a2b', m:'#b0614d',
  B:'#1f6feb', b:'#164aa3', L:'#35d0e5', J:'#34476f', T:'#eef3f7',
  R:'#ff4d7e', V:'#c2265a', W:'#ffffff', Q:'#9b5cff', q:'#e1d0ff',
  G:'#35d0e5', g:'#c9f6fc', Y:'#e0a84f', y:'#fff0c4', O:'#7a4f1a',
  M:'#f4efe6', C:'#6b3b1f', H:'#ff4d7e', h:'#ffb3c8', k:'#24364b'
};
var CORPO = [
  '..KKKKKK..', '.KDDDDDDK.', 'KDDDDDDDDK', 'KDSSSSSSDK', 'KSSESSESSK', 'KSSSSSSSSK',
  '.KSSmmSSK.', '..KKKKKK..', '.KbBBBBbK.', 'KSBBBBBBSK', 'KSBBLBBBSK', '.KBBBBBBK.', '.KJJJJJJK.'
];
var CORPO_P = CORPO.slice(); CORPO_P[4] = 'KSSsSSsSSK';
var CORPO_O = CORPO.slice(); CORPO_O[4] = 'KSEKSSKESK';       // óculos (skin professor)
var CORPO_OP = CORPO.slice(); CORPO_OP[4] = 'KSsKSSKsSK';
var BUG = [
  '..K......K..', '...K....K...', '..KRRRRRRK..', '.KRRWRRWRRK.', 'KRRRKRRKRRRK', '.KRRRRRRRRK.', '..KVVVVVVK..', '.K.K....K.K.'
];
var BIT = ['..G..', '.GgG.', 'GgGgG', '.GgG.', '..G..'];
var TROFEU = ['YYYYYYYYY', 'YyyYYYYYY', 'YyYYYYYYY', '.YYYYYYY.', '..YYYYY..', '...YYY...', '....Y....', '...OOO...', '..OOOOO..'];
var CAFE = ['..k..k..', '...k..k.', 'MMMMMMM.', 'MCCCCCMM', 'MCCCCCM.M', 'MCCCCCMM.', '.MMMMM..', '..MMM...'];
var CORACAO = ['.HH.HH.', 'HHHHHHH', 'HHHHHHH', '.HHHHH.', '..HHH..', '...H...'];

function mapa(map, x, y, s, paleta){
  for (var j = 0; j < map.length; j++) {
    var row = map[j];
    for (var i = 0; i < row.length; i++) {
      var c = row.charAt(i);
      if (c === '.') continue;
      cx.fillStyle = (paleta && paleta[c]) || COR[c] || '#fff';
      cx.fillRect(Math.round(x + i * s), Math.round(y + j * s), Math.ceil(s), Math.ceil(s));
    }
  }
}

/* ==========================================================
   MUNDO · transforma a página em fase
   ========================================================== */
var M = { plats: [], porEl: new Map(), fases: [], pisos: [], titulos: [], W: 0, H: 0, esc: 3, ultima: 0 };

function posDoc(el){
  var x = 0, y = 0, n = el;
  while (n) {
    x += n.offsetLeft; y += n.offsetTop;
    var pai = n.offsetParent;
    if (pai) { x += pai.clientLeft; y += pai.clientTop; }
    n = pai;
  }
  return { x: x, y: y };
}

var medidor = document.createElement('canvas').getContext('2d');
function topoDasLetras(el){
  var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
  medidor.font = cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
  var m = medidor.measureText('H');
  var sobe = m.fontBoundingBoxAscent, desce = m.fontBoundingBoxDescent, cap = m.actualBoundingBoxAscent;
  if (!(sobe > 0) || !(cap > 0)) return 0.14 * fs;
  var lh = cs.lineHeight === 'normal' ? sobe + desce : parseFloat(cs.lineHeight);
  return (lh - (sobe + desce)) / 2 + sobe - cap;
}

function separarLetras(el){
  if (el.querySelector('.l')) return;
  var texto = el.textContent.replace(/\s+/g, ' ').trim();
  if (el.dataset.pt === undefined) el.dataset.pt = texto;
  if (!el.closest('h1')) el.setAttribute('aria-label', texto);
  el.textContent = '';
  var caixa = document.createElement('span');
  caixa.setAttribute('aria-hidden', 'true');
  texto.split(' ').forEach(function(palavra, i){
    if (i) caixa.appendChild(document.createTextNode(' '));
    var pal = document.createElement('span');
    pal.className = 'pal';
    Array.prototype.forEach.call(palavra, function(ch){
      var l = document.createElement('span');
      l.className = 'l'; l.textContent = ch;
      pal.appendChild(l);
    });
    caixa.appendChild(pal);
  });
  el.appendChild(caixa);
}

var ALTURA_CHAO = 10;
function montarChao(f, buraco){
  var el = f.el._chao;
  if (!el) {
    el = document.createElement('div');
    el.className = 'chao';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = buraco ? '<i></i><i></i><b class="buraco"></b>' : '<i></i>';
    if (!buraco) el.classList.add('fim');
    f.el.appendChild(el);
    f.el._chao = el;
  }
  if (!buraco) return;
  var x0 = buraco.x0 - f.x, x1 = buraco.x1 - f.x, partes = el.children;
  partes[0].style.cssText = 'left:0;width:' + x0 + 'px';
  partes[1].style.cssText = 'left:' + x1 + 'px;right:0';
  partes[2].style.cssText = 'left:' + x0 + 'px;width:' + (x1 - x0) + 'px';
}

M.preparar = function(){ $$('[data-letras]').forEach(separarLetras); };

M.medir = function(){
  M.W = root.clientWidth;
  M.H = root.scrollHeight;
  M.esc = M.W < 720 ? 2 : 3;
  M.plats = []; M.porEl = new Map(); M.titulos = [];

  $$('[data-plat]').forEach(function(el){
    var w = el.offsetWidth;
    if (!el.offsetParent || w < 16) return;
    var p = posDoc(el), dy = 0, afunda = 0;
    if (el.hasAttribute('data-letras')) {
      dy = topoDasLetras(el);
      afunda = 0.05 * parseFloat(getComputedStyle(el).fontSize);
    }
    var plat = { x: p.x, y: Math.round(p.y + dy), w: w, el: el, solido: false,
                 cartao: el.classList.contains('cartao'), letras: null, afunda: afunda };
    if (el.hasAttribute('data-letras')) {
      var ls = el.querySelectorAll('.l');
      if (ls.length) {
        var topo = posDoc(ls[0]).y;
        plat.letras = [];
        for (var i = 0; i < ls.length; i++) {
          var q = posDoc(ls[i]);
          if (Math.abs(q.y - topo) > 6) break;
          plat.letras.push({ x0: q.x, x1: q.x + ls[i].offsetWidth, el: ls[i] });
        }
        if (plat.letras.length) {
          plat.x = plat.letras[0].x0;
          plat.w = plat.letras[plat.letras.length - 1].x1 - plat.x;
        }
      }
    }
    if (plat.letras) { plat.ph = el.offsetHeight; M.titulos.push(plat); }
    M.plats.push(plat);
    M.porEl.set(el, plat);
  });

  // cada linha de texto vira um degrau: a seta para baixo desce linha a linha
  $$('.fase p, .fase h3, .fase li, .fase pre, .fase .data').forEach(function(el){
    if (!el.offsetParent || el.offsetWidth < 16 || el.offsetHeight < 8) return;
    var cs = getComputedStyle(el), fs = parseFloat(cs.fontSize);
    var lh = parseFloat(cs.lineHeight); if (!(lh > 0)) lh = fs * 1.35;
    var pt = parseFloat(cs.paddingTop) || 0, pb = parseFloat(cs.paddingBottom) || 0;
    var n = clamp(Math.round((el.offsetHeight - pt - pb) / lh), 1, 40), q = posDoc(el);
    for (var i = 0; i < n; i++) M.plats.push({ x: q.x, y: Math.round(q.y + pt + i * lh + lh * 0.2), w: el.offsetWidth, el: el, solido: false, cartao: false, letras: null, afunda: 0, linha: true });
  });

  M.fases = $$('[data-fase]').map(function(el, i){
    var p = posDoc(el), pouso = el.querySelector('[data-pouso]');
    return { el: el, i: i, nome: el.dataset.nome || ('Fase ' + i), x: p.x, top: p.y,
             bottom: p.y + el.offsetHeight, pouso: pouso ? M.porEl.get(pouso) : null, bonus: el.hasAttribute('data-bonus') };
  });
  M.ultima = 0;
  M.fases.forEach(function(f, i){ if (!f.bonus) M.ultima = i; });

  M.pisos = [];
  var gw = Math.round(Math.max(100, 40 * M.esc));
  M.fases.forEach(function(f, i){
    var y = f.bottom - ALTURA_CHAO, prox = M.fases[i + 1];
    if (!prox || prox.bonus) {
      M.plats.push({ x: 0, y: y, w: M.W, solido: true, piso: i, final: true });
      M.pisos.push({ fase: i, y: y, final: true });
      montarChao(f, null);
      return;
    }
    var cxh = prox.pouso ? prox.pouso.x + prox.pouso.w / 2 : M.W / 2;
    cxh = clamp(cxh, gw / 2 + 12, M.W - gw / 2 - 12);
    var x0 = Math.round(cxh - gw / 2), x1 = Math.round(cxh + gw / 2);
    M.plats.push({ x: 0, y: y, w: x0, solido: true, piso: i });
    M.plats.push({ x: x1, y: y, w: M.W - x1, solido: true, piso: i });
    M.pisos.push({ fase: i, y: y, x0: x0, x1: x1, cx: cxh, destino: prox.pouso ? prox.pouso.y : y + 300 });
    montarChao(f, { x0: x0, x1: x1 });
  });
  M.plats.sort(function(a, b){ return a.y - b.y; });
};

M.faseDe = function(y){
  for (var i = M.fases.length - 1; i >= 0; i--) if (y >= M.fases[i].top) return i;
  return 0;
};

var INIM = { bug: 1, glitch: 1, crash: 1, vaza: 1, fatura: 1 };

M.criarEntidades = function(){
  var ents = [];
  $$('[data-bits]').forEach(function(el){
    var n = +el.dataset.bits || 0;
    for (var i = 0; i < n; i++) ents.push({ tipo: 'bit', el: el, i: i, n: n, vivo: true });
  });
  $$('[data-skill]').forEach(function(el){
    ents.push({ tipo: 'skill', el: el, nome: el.dataset.skill, sx: parseFloat(el.dataset.sx) || 0.5, vivo: true });
  });
  $$('[data-trofeu]').forEach(function(el){ ents.push({ tipo: 'trofeu', el: el, nome: el.dataset.trofeu, vivo: true }); });
  $$('[data-cafe]').forEach(function(el){ ents.push({ tipo: 'cafe', el: el, vivo: true }); });
  $$('[data-escudo]').forEach(function(el){ ents.push({ tipo: 'escudo', el: el, vivo: true }); });
  $$('[data-etapa]').forEach(function(el){ ents.push({ tipo: 'etapa', el: el, nome: el.dataset.etapa, vivo: true }); });
  $$('[data-badge]').forEach(function(el){ ents.push({ tipo: 'badge', el: el, nome: el.dataset.badge, vivo: true }); });
  $$('[data-portal]').forEach(function(el){ ents.push({ tipo: 'portal', el: el, vivo: true }); });
  $$('[data-segredo]').forEach(function(el){ ents.push({ tipo: 'segredo', el: el, vivo: true }); });
  $$('[data-bugs]').forEach(function(el){
    var n = +el.dataset.bugs || 0;
    for (var i = 0; i < n; i++) ents.push({ tipo: 'bug', el: el, u: (i + 0.5) / n, dir: i % 2 ? -1 : 1, vivo: true, vel: 50 + Math.random() * 30 });
  });
  $$('[data-glitch]').forEach(function(el){
    var n = +el.dataset.glitch || 0;
    for (var i = 0; i < n; i++) ents.push({ tipo: 'glitch', el: el, ph: i * 2.4 + Math.random(), vivo: true });
  });
  $$('[data-mob]').forEach(function(el){
    var m = el.dataset.mob;
    if (m === 'crash') ents.push({ tipo: 'crash', el: el, u: .5, dir: 1, vivo: true, vel: 115, ciclo: rnd(0, 2), quebra: 0 });
    else if (m === 'fatura') ents.push({ tipo: 'fatura', el: el, u: .5, dir: -1, vivo: true, vel: 42, hp: 3, hpMax: 3 });
    else if (m === 'vaza') ents.push({ tipo: 'vaza', el: el, ph: rnd(0, 6), vivo: true, gota: rnd(1, 2.5) });
  });
  M.pisos.forEach(function(pi, i){
    if (pi.final) return;
    for (var k = 0; k < 4; k++) ents.push({ tipo: 'bit', piso: i, k: k, vivo: true });
  });
  return ents;
};

M.posicionar = function(ents){
  var k = M.esc / 3;
  ents.forEach(function(e){
    e.oculto = false;
    if (e.tipo === 'bug') { e.w = 12 * M.esc; e.h = 8 * M.esc; }
    if (e.tipo === 'glitch') { e.w = 10 * M.esc; e.h = 10 * M.esc; }
    if (e.tipo === 'crash') { e.w = 11 * M.esc; e.h = 11 * M.esc; }
    if (e.tipo === 'vaza') { e.w = 10 * M.esc; e.h = 12 * M.esc; }
    if (e.tipo === 'fatura') { e.w = 13 * M.esc; e.h = 16 * M.esc; }
    if (e.piso !== undefined) {
      var pi = M.pisos[e.piso];
      if (!pi || pi.final) { e.oculto = true; return; }
      e.x = pi.cx; e.y = pi.y + 80 * k + e.k * 52 * k;
      if (e.y > pi.destino - 40 * k) e.oculto = true;
      return;
    }
    var pl = M.porEl.get(e.el);
    if (!pl) { e.oculto = true; return; }
    e.plat = pl;
    switch (e.tipo) {
      case 'bit':
        var t = e.n > 1 ? e.i / (e.n - 1) : 0.5;
        var span = Math.min(pl.w * 0.7, e.n * 46 * k);
        var cxm = clamp(pl.x + pl.w * 0.5, pl.x + span / 2, pl.x + pl.w - span / 2);
        e.x = cxm - span / 2 + span * t;
        e.y = pl.y - 30 * k - Math.sin(Math.PI * t) * 24 * k;
        break;
      case 'skill': case 'etapa': case 'badge': e.x = pl.x + pl.w * (e.sx || 0.5); e.y = pl.y - 56 * k; break;
      case 'trofeu': e.x = pl.x + pl.w * 0.5;  e.y = pl.y - 62 * k; break;
      case 'cafe':   e.x = pl.x + pl.w * 0.9;  e.y = pl.y - 30 * k; break;
      case 'escudo': e.x = pl.x + pl.w * 0.12; e.y = pl.y - 36 * k; break;
      case 'portal': e.x = pl.x + pl.w * 0.5;  e.y = pl.y - 46 * k; break;
      case 'segredo': e.x = pl.x + pl.w * 0.5; e.y = pl.y - 175 * k; break;
      case 'glitch': case 'vaza': e.cx = pl.x + pl.w * 0.5; e.cy = pl.y - 125 * k; e.ax = Math.min(pl.w * 0.42, 220 * k); break;
    }
  });
};

/* ==========================================================
   JOGO
   ========================================================== */
var C = {
  grav: 2300, pulo: 800, pulo2: 690, corrida: 350, acel: 3000, atrito: 2800, acelAr: 1900,
  quedaMax: 1150, socoVel: 1750, quique: 600, quiqueAlto: 820, coyote: 0.1, buffer: 0.13, invuln: 1.3
};

var E = null;      // estado da partida
var modo = 'menu'; // menu | jogando | pausado | morto | fim
var cam = 0, manualAte = 0, tipoPartida = 'normal';

function novoEstado(){
  return {
    ents: [], parts: [], textos: [], aneis: [], tiros: [], bolas: [], toasts: [], reiki: 100, boss: null,
    t: 0, crono: 0, cronoOn: false, pontos: 0, bits: 0, bitsTotal: 0,
    skills: [], skillsTotal: 0, trofeus: [], trofeusTotal: 0, bugs: 0, mortes: 0,
    etapas: 0, etapasTotal: 0, badges: 0, badgesTotal: 0, escudo: 0, flash: 0,
    segredo: false, segredoPts: false, noBonus: false, retorno: null, salvou: false, speed: false,
    combo: 0, seqBits: 0, seqBitsT: -9, faseMax: 0, faseAtual: 0, checkpoint: 0,
    banner: null, dica: null, tremor: 0, mortoT: 0, pisadoEl: null, letraEl: null,
    fimEm: 0, terminou: false, tut: {}
  };
}

var p = { x: 0, y: 0, w: 30, h: 51, vx: 0, vy: 0, pesAntes: 0, chao: null, virado: false,
          pulosAr: 1, coyote: 0, buffer: 0, socando: 0, socoT: 0, invuln: 0, atordoado: 0,
          vidas: 3, sx: 1, sy: 1, giro: 0, ignorar: null, quicando: false, animT: 0, faceX: 1, oculto: false,
          mirando: false, carga: 0, poseT: 0, somT: 0, dashT: 0, dashes: 1, dashDir: 1 };

var inp = { esq: false, dir: false, pulo: false, baixo: false, tiro: false, dash: false, ap: { pulo: false, baixo: false, tiroIni: false, dash: false } };
function apertar(a){
  if (a === 'pulo') { if (!inp.pulo) inp.ap.pulo = true; inp.pulo = true; }
  else if (a === 'baixo') { if (!inp.baixo) inp.ap.baixo = true; inp.baixo = true; }
  else if (a === 'tiro') { if (!inp.tiro) inp.ap.tiroIni = true; inp.tiro = true; }
  else if (a === 'dash') { if (!inp.dash) inp.ap.dash = true; inp.dash = true; }
  else inp[a] = true;
}
function soltar(a){ inp[a] = false; }
function limparInput(){
  inp.esq = inp.dir = inp.pulo = inp.baixo = inp.tiro = inp.dash = false;
  inp.ap.pulo = inp.ap.baixo = inp.ap.tiroIni = inp.ap.dash = false;
  p.mirando = false; p.carga = 0;
}
var TECLAS = { ArrowLeft: 'esq', KeyA: 'esq', ArrowRight: 'dir', KeyD: 'dir', Space: 'pulo', ArrowUp: 'pulo', KeyW: 'pulo',
               ArrowDown: 'baixo', KeyS: 'baixo', KeyX: 'tiro', KeyK: 'tiro', ShiftLeft: 'dash', ShiftRight: 'dash', KeyC: 'dash' };

/* ---------- utilidades de efeito ---------- */
function particula(x, y, vx, vy, vida, cor, tam, grav){ if (E.parts.length < 400) E.parts.push({ x: x, y: y, vx: vx, vy: vy, v: vida, m: vida, cor: cor, tam: tam, g: grav || 0 }); }
function anel(x, y, raio, cor, vida, larg){ E.aneis.push({ x: x, y: y, r: raio, cor: cor, v: vida || 0.4, m: vida || 0.4, l: larg || 3 }); }
function texto(x, y, txt, cor, grande){ E.textos.push({ x: x, y: y, txt: txt, cor: cor || '#eaf1f5', t: 0, grande: !!grande }); }
function poeira(x, y, n, k){ for (var i = 0; i < n; i++) particula(x, y, rnd(-90, 90) * k, rnd(-120, -20) * k, rnd(.2, .45), '#a2b5c4', rnd(3, 5) * k, 200 * k); }
function faiscas(x, y, n, cor, k){ for (var i = 0; i < n; i++) particula(x, y, rnd(-220, 220) * k, rnd(-260, 60) * k, rnd(.3, .6), cor, rnd(2, 5) * k, 500 * k); }
function ondaLetra(el, atraso){
  el.style.animationDelay = atraso + 's';
  el.classList.remove('onda'); void el.offsetWidth; el.classList.add('onda');
  el.addEventListener('animationend', function(){ el.classList.remove('onda'); }, { once: true });
}
function ondaLetras(pl, cxp){
  if (!pl.letras) return;
  pl.letras.forEach(function(L){ ondaLetra(L.el, Math.min(Math.abs((L.x0 + L.x1) / 2 - cxp) * 0.0009, 0.5)); });
}
function tremer(q){ if (!reduzido) E.tremor = Math.max(E.tremor, q); }
function dizer(txt, dur){ E.dica = { txt: txt, ate: E.t + dur }; }
function banner(titulo, sub, dur, cor){ E.banner = { titulo: titulo, sub: sub, t: 0, dur: dur, cor: cor || '#35d0e5' }; }
function toast(txt){ E.toasts.push({ txt: txt, t: 0 }); }

/* ---------- conquistas ---------- */
function ganhar(id){
  if (!E || !PV.conquistas.desbloquear(id)) return;
  var c = PV.conquistas.achar(id);
  toast('Conquista: ' + I18N.t({ pt: c.pt, en: c.en }));
  som.tocar('conquista');
  PV.skins.lista.forEach(function(s){ if (s.req === id) toast('Skin desbloqueada: ' + I18N.t({ pt: s.pt, en: s.en })); });
}

/* ---------- jogador ---------- */
function ajustarTamanho(){ p.w = 10 * M.esc; p.h = 17 * M.esc; }

function sairDoChao(){
  p.chao = null;
  if (E && E.pisadoEl) { E.pisadoEl.classList.remove('pisado'); E.pisadoEl = null; }
}

function pular(v, duplo, k){
  sairDoChao();
  p.vy = -v; p.buffer = 0; p.coyote = 0; p.quicando = false;
  p.sx = 0.78; p.sy = 1.24;
  E.cronoOn = true;
  if (duplo) {
    p.pulosAr--; p.giro = 1;
    anel(p.x + p.w / 2, p.y + p.h, 34 * k, '#35d0e5');
    som.tocar('pulo2'); E.tut.pulou2 = true;
  } else {
    poeira(p.x + p.w / 2, p.y + p.h, 5, k);
    som.tocar('pulo'); E.tut.pulou = true;
  }
}

function iniciarSoco(){ p.socando = 1; p.socoT = 0.15; p.giro = 1; som.tocar('socoIni'); }

function ladoDoBuraco(){
  var pi = M.pisos[M.faseDe(p.y + p.h - 4)];
  if (!pi || pi.final) return 'logo ali';
  return (pi.cx < p.x + p.w / 2) ? 'pra esquerda ←' : 'pra direita →';
}

function controlar(dt, k){
  p.coyote -= dt; p.buffer -= dt;
  if (inp.ap.pulo) { inp.ap.pulo = false; p.buffer = C.buffer; }
  var dir = (inp.dir ? 1 : 0) - (inp.esq ? 1 : 0);
  if (dir) { E.cronoOn = true; E.tut.andou = true; }
  if (p.socando) dir = 0;
  if (p.mirando) dir *= 0.3;
  if (p.atordoado > 0) { p.atordoado -= dt; dir = 0; }
  var alvo = dir * C.corrida * k;
  var acel = (p.chao ? (dir ? C.acel : C.atrito) : C.acelAr) * k;
  if (p.dashT <= 0) p.vx = aproximar(p.vx, alvo, acel * dt);
  if (dir) p.virado = dir < 0;

  if (p.buffer > 0 && !p.socando && p.atordoado <= 0) {
    if (p.chao || p.coyote > 0) pular(C.pulo * k, false, k);
    else if (p.pulosAr > 0) pular(C.pulo2 * k, true, k);
  }
  if (!inp.pulo && !p.quicando && p.vy < -C.pulo * k * 0.42) p.vy = -C.pulo * k * 0.42;

  // dash: um por salto, derruba inimigos
  if (inp.ap.dash) {
    inp.ap.dash = false;
    if (p.dashes > 0 && p.dashT <= 0 && !p.socando && p.atordoado <= 0) {
      p.dashes--; p.dashT = 0.18; p.dashDir = p.virado ? -1 : 1; p.vy = 0; p.mirando = false; p.carga = 0;
      som.tocar('dash'); anel(p.x + p.w / 2, p.y + p.h / 2, 40 * k, '#1f6feb', .3, 3); E.tut.dash = true;
    }
  }
  // Rei Gun: segure X para carregar, solte para atirar
  if (inp.ap.tiroIni) { inp.ap.tiroIni = false; if (E.reiki >= 12 && !p.socando && p.atordoado <= 0 && !p.mirando) { p.mirando = true; p.carga = 0; p.somT = 0; } }
  if (p.mirando) {
    if (inp.tiro && p.atordoado <= 0 && !p.socando) {
      p.carga = Math.min(p.carga + dt, 1.1, Math.max(0, (E.reiki - 12) / 28));
      p.somT -= dt; if (p.somT <= 0) { p.somT = 0.1; som.tocar('carrega', p.carga); }
    } else disparar(k);
  }

  if (inp.ap.baixo) {
    inp.ap.baixo = false;
    if (p.chao) {
      if (!p.chao.solido) { p.ignorar = p.chao; sairDoChao(); p.y += 7; p.vy = 120 * k; }
      else dizer('o buraco é ' + ladoDoBuraco(), 1.8);
    } else if (!p.socando) iniciarSoco();
  }
}

function marcarPisado(pl){
  if (E.pisadoEl === pl.el) return;
  if (E.pisadoEl) E.pisadoEl.classList.remove('pisado');
  E.pisadoEl = null;
  if (pl.el && pl.cartao) { pl.el.classList.add('pisado'); E.pisadoEl = pl.el; }
}

function pousar(pl, k){
  var v = p.vy;
  p.y = pl.y - p.h; p.vy = 0; p.chao = pl; p.pulosAr = 1; p.quicando = false; p.dashes = 1;
  p.sx = 1.25; p.sy = 0.75;
  marcarPisado(pl);
  if (E.combo) E.combo = 0;
  if (p.socando === 2) {
    p.socando = 0;
    som.tocar('soco'); tremer(8);
    anel(p.x + p.w / 2, p.y + p.h, 70 * k, '#e0a84f', .45, 4);
    faiscas(p.x + p.w / 2, p.y + p.h, 16, '#e0a84f', k);
    E.tut.socou = true;
    ondaLetras(pl, p.x + p.w / 2);
  } else {
    p.socando = 0;
    if (v > 500 * k) { poeira(p.x + p.w / 2, p.y + p.h, 6, k); som.tocar('pouso'); }
  }
}

function fisica(dt, k){
  if (p.invuln > 0) p.invuln -= dt;
  if (p.dashT > 0) {
    p.dashT -= dt; p.vx = p.dashDir * 900 * k; p.vy = 0;
    for (var d = 0; d < 3; d++) particula(p.x + rnd(0, p.w), p.y + rnd(0, p.h), -p.dashDir * 90, rnd(-20, 20), .25, d % 2 ? '#35d0e5' : '#1f6feb', 7 * k, 0);
    if (p.dashT <= 0) p.vx = p.dashDir * C.corrida * k;
  } else if (p.socando === 1) {
    p.socoT -= dt; p.vx = 0; p.vy = 0;
    if (p.socoT <= 0) { p.socando = 2; p.vy = C.socoVel * k; }
  } else {
    p.vy += C.grav * k * dt;
    var max = p.socando === 2 ? C.socoVel * k : C.quedaMax * k;
    if (p.vy > max) p.vy = max;
  }
  p.pesAntes = p.y + p.h;
  if (p.chao && p.dashT <= 0) p.dashes = 1;
  p.x += p.vx * dt;
  if (p.x < 0) { p.x = 0; p.vx = 0; } else if (p.x > M.W - p.w) { p.x = M.W - p.w; p.vx = 0; }

  if (p.chao) {
    var c = p.chao;
    if (p.x + p.w < c.x + 4 || p.x > c.x + c.w - 4) { sairDoChao(); p.coyote = C.coyote; }
    else { p.y = c.y - p.h; p.vy = 0; }
  }
  if (!p.chao) {
    p.y += p.vy * dt;
    if (p.vy >= 0) {
      var pes = p.y + p.h, alvo = null;
      for (var i = 0; i < M.plats.length; i++) {
        var pl = M.plats[i];
        if (pl.y < p.pesAntes - 4) continue;
        if (pl.y > pes) break;
        if (pl === p.ignorar) continue;
        if (p.x + p.w <= pl.x + 4 || p.x >= pl.x + pl.w - 4) continue;
        alvo = pl; break;
      }
      if (alvo) pousar(alvo, k);
    }
    if (p.ignorar && p.pesAntes > p.ignorar.y + 9) p.ignorar = null;
    if (p.y < -400) { p.y = -400; p.vy = Math.max(p.vy, 0); }
  }
  var vol = Math.min(1, dt * 14);
  p.sx += (1 - p.sx) * vol; p.sy += (1 - p.sy) * vol;
  if (p.giro > 0) p.giro = Math.max(0, p.giro - dt * 3.4);
  p.faceX = aproximar(p.faceX, p.virado ? -1 : 1, dt * 11);
  p.animT += dt;
  if (p.chao && Math.abs(p.vx) > 120 * k && (Math.floor(p.animT * 6) % 2 === 0) && Math.random() < dt * 5) poeira(p.x + p.w / 2, p.y + p.h, 1, k);

  // letras afundam quando pisadas
  var alvoLetra = null;
  if (p.chao && p.chao.letras) {
    var mx = p.x + p.w / 2;
    for (var j = 0; j < p.chao.letras.length; j++) { var L = p.chao.letras[j]; if (mx >= L.x0 && mx < L.x1) { alvoLetra = L.el; break; } }
  }
  if (alvoLetra !== E.letraEl) {
    if (E.letraEl) E.letraEl.classList.remove('pisada');
    if (alvoLetra) alvoLetra.classList.add('pisada');
    E.letraEl = alvoLetra;
  }
}

function machucar(deX, k){
  if (E.escudo > 0) {
    E.escudo = 0; p.invuln = 1.1;
    som.tocar('escudo'); anel(p.x + p.w / 2, p.y + p.h / 2, 60 * k, '#7b42bc', .5, 4);
    faiscas(p.x + p.w / 2, p.y + p.h / 2, 14, '#b78cff', k);
    dizer('o escudo absorveu o golpe!', 1.8);
    return;
  }
  p.vidas--; p.invuln = C.invuln; p.atordoado = 0.35;
  var lado = p.x + p.w / 2 < deX ? -1 : 1;
  p.vx = lado * 330 * k; p.vy = -440 * k; sairDoChao(); p.socando = 0;
  som.tocar('dano'); tremer(10);
  faiscas(p.x + p.w / 2, p.y + p.h / 2, 12, '#ff4d7e', k);
  if (p.vidas <= 0) morrer(k);
}

function morrer(k){
  modo = 'morto'; E.mortoT = 1.2; E.mortes++; p.oculto = true;
  som.tocar('morte'); tremer(12);
  for (var i = 0; i < 26; i++) particula(p.x + p.w / 2, p.y + p.h / 2, rnd(-340, 340) * k, rnd(-460, 80) * k, rnd(.6, 1.1), i % 3 ? '#1f6feb' : '#f2c6a5', rnd(4, 8) * k, 1200 * k);
}

function renascer(){
  var f = M.fases[E.checkpoint], pl = f && f.pouso;
  if (pl) { p.x = pl.x + pl.w / 2 - p.w / 2; p.y = pl.y - p.h - 2; }
  p.vx = p.vy = 0; sairDoChao(); p.vidas = 3; p.invuln = 2; p.oculto = false; p.socando = 0;
  E.noBonus = false; E.escudo = 0;
  modo = 'jogando';
  dizer('checkpoint: fase ' + E.checkpoint, 1.8);
}

/* ---------- teleporte e sala bônus ---------- */
function teleportar(x, y){
  p.x = x; p.y = y; p.vx = p.vy = 0; sairDoChao(); p.ignorar = null; p.invuln = Math.max(p.invuln, 1.2);
  cam = clamp(y - H * 0.55, 0, Math.max(0, M.H - H));
  window.scrollTo(0, Math.round(cam));
  E.flash = 0.6;
  for (var i = 0; i < 28; i++) particula(x + p.w / 2, y + p.h / 2, rnd(-300, 300), rnd(-300, 300), rnd(.4, .9), i % 2 ? '#9b5cff' : '#fff', rnd(3, 7), 0);
}
function entrarBonus(){
  var f = M.fases[M.fases.length - 1];
  if (!f || !f.bonus || !f.pouso) return;
  E.retorno = { x: p.x, y: p.y }; E.noBonus = true; E.bolas = [];
  if (!E.segredoPts) { E.segredoPts = true; E.pontos += 1000; }
  E.segredo = true; ganhar('segredo'); som.tocar('portal');
  teleportar(f.pouso.x + f.pouso.w * 0.3, f.pouso.y - p.h - 4);
  banner('SALA SECRETA', 'SALA DE SERVIDORES', 2.4, '#9b5cff');
  dizer('saia pelo portal SAÍDA', 6);
}
function sairBonus(){
  E.noBonus = false; som.tocar('portal');
  var r = E.retorno || { x: 60, y: 0 };
  teleportar(r.x, r.y);
}

/* ---------- chefão: Bug Gigante ---------- */
function criarBoss(){
  var s = M.esc * 3;
  return { ativo: false, vivo: true, hp: 14, hpMax: 14, w: 12 * s, h: 8 * s, x: 0, y: 0, t: 0, flash: 0, inv: 0, atk: 3, fase2: false, anuncio: 0 };
}
function danoBoss(n, k){
  var B = E.boss; if (!B.vivo || B.inv > 0) return;
  B.hp -= n; B.inv = 0.25; B.flash = 0.2; E.pontos += 40 * n;
  som.tocar('esmaga', 4); tremer(6 + n * 2);
  faiscas(B.x + B.w / 2, B.y + B.h / 2, 12 + n * 4, '#ff4d7e', k);
  texto(B.x + B.w / 2, B.y - 6, '-' + n, '#ffd890', true);
  if (!B.fase2 && B.hp <= B.hpMax / 2) { B.fase2 = true; banner('FÚRIA!', 'o bug ficou mais rápido', 1.8, '#ff4d7e'); som.tocar('boss'); }
  if (B.hp <= 0) {
    B.vivo = false; E.bolas = []; E.pontos += 2000; E.bugs++;
    banner('BUG GIGANTE DERROTADO', '+2000', 3, '#e0a84f'); som.tocar('trofeu'); tremer(16);
    for (var i = 0; i < 70; i++) particula(B.x + B.w / 2, B.y + B.h / 2, rnd(-520, 520) * k, rnd(-620, 180) * k, rnd(.7, 1.4), i % 3 ? '#ff4d7e' : (i % 2 ? '#fff' : '#e0a84f'), rnd(4, 9) * k, 900 * k);
    anel(B.x + B.w / 2, B.y + B.h / 2, 220 * k, '#e0a84f', .8, 5);
    ganhar('boss'); som.musica.modo('normal');
    E.fimEm = E.t + 3;
  }
}
function atualizarBoss(dt, k){
  var B = E.boss; if (!B || !B.ativo || !B.vivo || E.noBonus) return;
  var F = M.fases[M.ultima], piso = F.bottom - ALTURA_CHAO, vel = B.fase2 ? 1.55 : 1;
  if (B.anuncio && E.t >= B.anuncio) { B.anuncio = 0; banner('BOSS', 'BUG GIGANTE', 2.4, '#ff4d7e'); som.tocar('boss'); som.musica.modo('boss'); }
  B.t += dt * vel; B.flash -= dt; B.inv -= dt;
  B.w = 12 * M.esc * 3; B.h = 8 * M.esc * 3;
  B.x = M.W / 2 - B.w / 2 + Math.sin(B.t * 0.55) * (M.W / 2 - B.w / 2 - 60);
  B.y = piso - B.h - (95 + (Math.sin(B.t * 0.95) * 0.5 + 0.5) * 210) * k;
  B.atk -= dt;
  if (B.atk <= 0 && !B.anuncio) {
    B.atk = B.fase2 ? 1.5 : 2.3;
    var n = B.fase2 ? 5 : 3, ang = Math.atan2(p.y + p.h / 2 - (B.y + B.h * 0.7), p.x + p.w / 2 - (B.x + B.w / 2));
    for (var i = 0; i < n; i++) { var a = ang + (i - (n - 1) / 2) * 0.3; E.bolas.push({ x: B.x + B.w / 2, y: B.y + B.h * 0.7, vx: Math.cos(a) * 330 * k, vy: Math.sin(a) * 330 * k, r: 10 * k, v: 4, cor: '#ff4d7e' }); }
    som.tocar('boss');
  }
  var m = 6 * k;
  if (p.x + p.w > B.x + m && p.x < B.x + B.w - m && p.y + p.h > B.y + m && p.y < B.y + B.h - m) {
    var cima = p.vy > 0 && p.pesAntes <= B.y + B.h * 0.45;
    if (p.socando === 2) danoBoss(3, k);
    else if (p.dashT > 0) danoBoss(1, k);
    else if (cima) { danoBoss(2, k); p.vy = -C.quiqueAlto * k; p.quicando = true; p.pulosAr = 1; p.dashes = 1; }
    else if (p.invuln <= 0) { machucar(B.x + B.w / 2, k); if (modo !== 'jogando') return; }
  }
}
function atualizarBolas(dt, k){
  for (var i = E.bolas.length - 1; i >= 0; i--) {
    var b = E.bolas[i]; b.v -= dt; b.x += b.vx * dt; b.y += b.vy * dt;
    var dx = clamp(b.x, p.x, p.x + p.w) - b.x, dy = clamp(b.y, p.y, p.y + p.h) - b.y, gone = b.v <= 0 || b.x < -40 || b.x > M.W + 40;
    if (!gone && dx * dx + dy * dy < b.r * b.r && p.dashT <= 0 && p.invuln <= 0 && modo === 'jogando') { machucar(b.x, k); gone = true; }
    if (gone) { faiscas(b.x, b.y, 4, b.cor, k); E.bolas.splice(i, 1); if (modo !== 'jogando') return; }
  }
}

/* ---------- Rei Gun ---------- */
function pontaDoDedo(){ var d = p.virado ? -1 : 1; return { x: p.x + p.w / 2 + d * 9.5 * M.esc, y: p.y + 10 * M.esc, d: d }; }
function disparar(k){
  var c = Math.min(p.carga, 1), custo = Math.min(E.reiki, 12 + 28 * c);
  p.mirando = false; p.carga = 0;
  if (E.reiki < 12) return;
  E.reiki -= custo; E.tut.atirou = true;
  if (c > 0.55) ganhar('tiro');
  var pt = pontaDoDedo();
  E.tiros.push({ x: pt.x, y: pt.y, vx: pt.d * (820 + c * 280) * k, r: (8 + c * 22) * k, c: c, fura: c > 0.55, v: 1 + c * 0.6, ang: 0 });
  p.poseT = 0.28; p.vx -= pt.d * (100 + 260 * c) * k;
  som.tocar('tiro', c); tremer(2 + c * 9);
  anel(pt.x, pt.y, (30 + c * 50) * k, '#35d0e5', .35, 3);
  faiscas(pt.x, pt.y, 8 + Math.round(c * 14), '#c9f6fc', k);
}

function atualizarTiros(dt, k){
  for (var i = E.tiros.length - 1; i >= 0; i--) {
    var t = E.tiros[i], morre = false;
    t.v -= dt; t.x += t.vx * dt; t.ang += dt * 14;
    particula(t.x - Math.sign(t.vx) * t.r * 0.6, t.y + rnd(-t.r, t.r) * 0.6, -t.vx * 0.06 + rnd(-30, 30), rnd(-40, 40), rnd(.15, .35), t.c > .55 ? '#ffffff' : '#35d0e5', rnd(2, 4) * k + t.c * 3, 0);
    for (var a = 0; a < M.titulos.length; a++) {
      var T = M.titulos[a];
      if (t.y < T.y - 40 || t.y > T.y + (T.ph || 60)) continue;
      for (var b = 0; b < T.letras.length; b++) {
        var L = T.letras[b], mx = (L.x0 + L.x1) / 2;
        if (Math.abs(mx - t.x) < t.r + 24 && E.t - (L.t || -9) > 0.7) { L.t = E.t; ondaLetra(L.el, 0); }
      }
    }
    for (var j = 0; j < E.ents.length; j++) {
      var e = E.ents[j];
      if (!e.vivo || e.oculto || e.x === undefined) continue;
      if (INIM[e.tipo]) {
        var dx = clamp(t.x, e.x, e.x + e.w) - t.x, dy = clamp(t.y, e.y, e.y + e.h) - t.y;
        if (dx * dx + dy * dy < t.r * t.r) {
          danoEnt(e, t.c > .55 ? 3 : 1, k);
          if (t.c > .55) E.pontos += 50;
          if (!t.fura) { morre = true; break; }
        }
      } else if (e.tipo === 'bit') {
        if (Math.abs(e.x - t.x) < t.r + 14 * k && Math.abs(e.y - t.y) < t.r + 14 * k) coletar(e, k);
      }
    }
    var B = E.boss;
    if (B && B.ativo && B.vivo && !morre && !E.noBonus) {
      var bx = clamp(t.x, B.x, B.x + B.w) - t.x, by = clamp(t.y, B.y, B.y + B.h) - t.y;
      if (bx * bx + by * by < t.r * t.r && B.inv <= 0) { danoBoss(t.c > .55 ? 3 : 1, k); morre = true; }
    }
    for (var q = E.bolas.length - 1; q >= 0 && !morre; q--) {
      var bo = E.bolas[q];
      if (Math.abs(bo.x - t.x) < t.r + bo.r && Math.abs(bo.y - t.y) < t.r + bo.r) { faiscas(bo.x, bo.y, 6, bo.cor, k); E.bolas.splice(q, 1); E.pontos += 20; if (!t.fura) morre = true; }
    }
    if (morre || t.v <= 0 || t.x < -80 || t.x > M.W + 80) {
      faiscas(t.x, t.y, 6 + Math.round(t.c * 10), '#c9f6fc', k);
      anel(t.x, t.y, t.r * 2.2, '#35d0e5', .3, 2);
      E.tiros.splice(i, 1);
    }
  }
}

/* ---------- entidades ---------- */
function patrulhar(e, dt, k, parado){
  var pl = e.plat; if (!pl) return;
  var span = pl.w - e.w - 8;
  if (span > 4 && !parado) {
    e.u += e.dir * e.vel * k * dt / span;
    if (e.u >= 1) { e.u = 1; e.dir = -1; } else if (e.u <= 0) { e.u = 0; e.dir = 1; }
  }
  e.x = pl.x + 4 + e.u * Math.max(0, span); e.y = pl.y - e.h;
}

function atualizarEntidades(dt, k){
  for (var i = 0; i < E.ents.length; i++) {
    var e = E.ents[i];
    if (!e.vivo || e.oculto) continue;
    if (e.inv > 0) e.inv -= dt;
    if (e.flash > 0) e.flash -= dt;
    if (e.tipo === 'bug' || e.tipo === 'fatura') patrulhar(e, dt, k, false);
    else if (e.tipo === 'crash') {
      e.ciclo += dt;
      if (e.quebra > 0) e.quebra -= dt; else if (e.ciclo > 2.8) { e.ciclo = 0; e.quebra = 0.5; }
      patrulhar(e, dt, k, e.quebra > 0);
    } else if (e.tipo === 'glitch' || e.tipo === 'vaza') {
      e.x = e.cx + Math.sin(E.t * 0.8 + e.ph) * e.ax - e.w / 2;
      e.y = e.cy + Math.sin(E.t * 1.9 + e.ph * 1.3) * 26 * k - e.h / 2;
      if (e.tipo === 'vaza' && modo === 'jogando') {
        e.gota -= dt;
        if (e.gota <= 0) {
          e.gota = 2.6;
          if (Math.abs(e.y - p.y) < H * 0.8) E.bolas.push({ x: e.x + e.w / 2, y: e.y + e.h, vx: 0, vy: 250 * k, r: 7 * k, v: 3.5, cor: '#e0a84f' });
        }
      }
    }
  }
}

function matarInimigo(e, k){
  e.vivo = false; E.bugs++;
  var mult = Math.max(1, E.combo), pts = 50 * mult;
  E.pontos += pts; som.tocar('esmaga', E.combo);
  var cor = { bug: '#ff4d7e', crash: '#4aa3ff', vaza: '#e0a84f', fatura: '#34d399' }[e.tipo] || '#9b5cff';
  for (var i = 0; i < 14; i++) particula(e.x + e.w / 2, e.y + e.h / 2, rnd(-300, 300) * k, rnd(-420, -60) * k, rnd(.35, .7), i % 4 ? cor : '#fff', rnd(3, 6) * k, 1200 * k);
  texto(e.x + e.w / 2, e.y - 4, '+' + pts + (mult > 1 ? '  x' + mult : ''), mult > 1 ? '#e0a84f' : '#eaf1f5');
  tremer(5);
  if (mult >= 3) dizer('COMBO x' + mult + '!', 1.2);
  if (E.combo >= 5) ganhar('combo5');
  if (p.dashT > 0) ganhar('dash');
}

/* dano em inimigo: alguns têm mais de 1 de vida (a fatura de cloud tem 3) */
function danoEnt(e, n, k){
  if (e.inv > 0) return false;
  E.combo++;
  e.hp = (e.hp || 1) - n;
  if (e.hp > 0) {
    e.inv = 0.3; e.flash = 0.2; som.tocar('esmaga', 1); tremer(3);
    faiscas(e.x + e.w / 2, e.y + e.h / 2, 8, '#fff', k);
    texto(e.x + e.w / 2, e.y - 4, '-' + n, '#ffd890');
    return false;
  }
  matarInimigo(e, k);
  return true;
}

function coletar(e, k){
  e.vivo = false;
  switch (e.tipo) {
    case 'bit':
      E.bits++; E.pontos += 10;
      E.seqBits = (E.t - E.seqBitsT < 0.6) ? E.seqBits + 1 : 0; E.seqBitsT = E.t;
      som.tocar('bit', E.seqBits); faiscas(e.x, e.y, 6, '#35d0e5', k); break;
    case 'skill':
      E.skills.push(e.nome); E.pontos += 100; som.tocar('skill');
      faiscas(e.x, e.y, 22, '#e0a84f', k); anel(e.x, e.y, 60 * k, '#e0a84f');
      texto(e.x, e.y - 14, '+ ' + e.nome, '#ffd890', true);
      dizer('Skill nova: ' + e.nome + ' (' + E.skills.length + '/' + E.skillsTotal + ')', 1.9);
      if (E.skills.length >= E.skillsTotal) ganhar('colecionador');
      break;
    case 'trofeu':
      E.trofeus.push(e.nome); E.pontos += 250; som.tocar('trofeu');
      faiscas(e.x, e.y, 34, '#e0a84f', k); anel(e.x, e.y, 90 * k, '#e0a84f', .6, 4);
      banner('TROFÉU ' + E.trofeus.length + '/' + E.trofeusTotal, e.nome, 2.6, '#e0a84f'); break;
    case 'cafe':
      if (p.vidas < 3) { p.vidas++; texto(e.x, e.y - 10, '+1 ♥  café', '#ff8fae', true); }
      else { E.pontos += 50; texto(e.x, e.y - 10, '+50  café', '#eaf1f5', true); }
      som.tocar('cafe'); faiscas(e.x, e.y, 10, '#f4efe6', k); break;
    case 'escudo':
      E.escudo = 1; E.pontos += 50; som.tocar('escudo');
      faiscas(e.x, e.y, 18, '#b78cff', k); anel(e.x, e.y, 70 * k, '#7b42bc', .5, 4);
      texto(e.x, e.y - 14, 'escudo Terraform!', '#d2b4ff', true); ganhar('escudo'); break;
    case 'etapa':
      E.etapas++; E.pontos += 150; som.tocar('etapa');
      if (e.el) e.el.classList.add('verde');
      faiscas(e.x, e.y, 18, '#34d399', k); anel(e.x, e.y, 60 * k, '#34d399');
      texto(e.x, e.y - 14, '✔ ' + e.nome, '#8dffc9', true);
      if (E.etapas >= E.etapasTotal) { E.pontos += 300; banner('PIPELINE VERDE', 'todas as etapas passaram', 2.6, '#34d399'); som.tocar('trofeu'); ganhar('pipeline'); }
      break;
    case 'badge':
      E.badges++; E.pontos += 150; som.tocar('skill');
      faiscas(e.x, e.y, 16, '#35d0e5', k); texto(e.x, e.y - 14, '+ ' + e.nome, '#c9f6fc', true);
      if (E.badges >= E.badgesTotal) { banner('SELOS', E.badges + '/' + E.badgesTotal, 2.2, '#35d0e5'); ganhar('badges'); }
      break;
    case 'segredo': entrarBonus(); break;
    case 'portal': sairBonus(); break;
  }
}

function colisoes(k){
  var x0 = p.x, x1 = p.x + p.w, y0 = p.y, y1 = p.y + p.h;
  for (var i = 0; i < E.ents.length; i++) {
    var e = E.ents[i];
    if (!e.vivo || e.oculto || e.x === undefined) continue;
    if (INIM[e.tipo]) {
      var m = 3 * k;
      if (x1 > e.x + m && x0 < e.x + e.w - m && y1 > e.y + m && y0 < e.y + e.h - m) {
        var deCima = p.vy > 0 && p.pesAntes <= e.y + e.h * 0.6;
        if (p.socando === 2 || deCima || p.dashT > 0) {
          danoEnt(e, p.socando === 2 ? 2 : 1, k);
          if (p.socando !== 2 && p.dashT <= 0) { p.vy = -(inp.pulo ? C.quiqueAlto : C.quique) * k; p.quicando = true; p.pulosAr = 1; p.giro = 0; }
        } else if (p.invuln <= 0) {
          machucar(e.x + e.w / 2, k);
          if (modo !== 'jogando') return;
        }
      }
    } else {
      var r = (e.tipo === 'bit' ? 16 : 26) * k;
      if (e.x > x0 - r && e.x < x1 + r && e.y > y0 - r && e.y < y1 + r) coletar(e, k);
    }
  }
}

function acompanharFase(){
  var f = M.faseDe(p.y + p.h - 2);
  E.faseAtual = f;
  if (f > M.ultima || f <= E.faseMax) return;
  E.faseMax = f; E.checkpoint = f;
  for (var q = 1; q <= f; q++) M.fases[q].el.classList.add('fase-ativa');
  som.tocar('fase');
  banner('FASE ' + f, M.fases[f].nome.toUpperCase(), 2.2);
  if (f === M.ultima && !E.terminou) {
    if (E.boss && E.boss.vivo) { E.boss.ativo = true; E.boss.t = 0; E.boss.anuncio = E.t + 2.4; E.boss.atk = 4; dizer('derrote o Bug Gigante: Rei Gun carregado, soco ou pisão', 6); }
    else E.fimEm = E.t + 3;
  }
}

function tutorial(){
  if (E.speed || E.faseMax > 0) return;
  if (!E.tut.andou) dizer('← → andam · espaço pula', 9999);
  else if (!E.tut.pulou2 && E.t < 12) dizer('espaço de novo no ar: pulo duplo', 9999);
  else if (!E.tut.atirou && E.t > 5 && E.t < 25) dizer('X: Rei Gun · segure para carregar, solte para atirar', 9999);
  else if (!E.tut.dash && E.t > 10 && E.t < 40) dizer('Shift: dash (derruba inimigos)', 9999);
  else if (E.t > 14 && E.faseAtual === 0) dizer('o buraco no chão leva à próxima fase (' + ladoDoBuraco() + ')', 9999);
  else E.dica = null;
}

/* ---------- partículas e textos ---------- */
function atualizarEfeitos(dt){
  var i;
  for (i = E.parts.length - 1; i >= 0; i--) {
    var q = E.parts[i]; q.v -= dt;
    if (q.v <= 0) { E.parts.splice(i, 1); continue; }
    q.vy += q.g * dt; q.x += q.vx * dt; q.y += q.vy * dt;
  }
  for (i = E.aneis.length - 1; i >= 0; i--) { E.aneis[i].v -= dt; if (E.aneis[i].v <= 0) E.aneis.splice(i, 1); }
  for (i = E.textos.length - 1; i >= 0; i--) { var tx = E.textos[i]; tx.t += dt; tx.y -= 40 * dt; if (tx.t > 1.1) E.textos.splice(i, 1); }
  for (i = E.toasts.length - 1; i >= 0; i--) { E.toasts[i].t += dt; if (E.toasts[i].t > 3.6) E.toasts.splice(i, 1); }
  if (E.banner) { E.banner.t += dt; if (E.banner.t > E.banner.dur) E.banner = null; }
  if (E.tremor > 0) E.tremor = Math.max(0, E.tremor - dt * 30);
  if (E.flash > 0) E.flash = Math.max(0, E.flash - dt * 1.6);
}

/* ---------- câmera ---------- */
function camera(dt){
  if (performance.now() < manualAte) { cam = window.scrollY; return; }
  var max = Math.max(0, M.H - H);
  var alvo = clamp(p.y + p.h / 2 - H * 0.55, 0, max);
  var veloz = p.vy > 900 ? 12 : 6;
  cam += (alvo - cam) * Math.min(1, dt * veloz);
  window.scrollTo(0, Math.round(cam));
}

/* ---------- passo ---------- */
function passo(dt){
  var k = M.esc / 3;
  if (modo === 'jogando') {
    E.t += dt;
    if (E.cronoOn && !E.terminou) E.crono += dt;
    controlar(dt, k);
    fisica(dt, k);
    atualizarEntidades(dt, k);
    atualizarTiros(dt, k);
    atualizarBoss(dt, k);
    atualizarBolas(dt, k);
    colisoes(k);
    E.reiki = Math.min(100, E.reiki + (p.mirando ? 0 : 18) * dt);
    if (p.poseT > 0) p.poseT -= dt;
    if (p.mirando) {
      var pt = pontaDoDedo();
      if (Math.random() < dt * 45) {
        var an = Math.random() * 6.283, rd = rnd(28, 56) * k, px = pt.x + Math.cos(an) * rd, py = pt.y + Math.sin(an) * rd;
        particula(px, py, (pt.x - px) * 4.5, (pt.y - py) * 4.5, .22, '#c9f6fc', rnd(2, 4) * k, 0);
      }
    }
    if (modo === 'jogando') { acompanharFase(); tutorial(); }
    if (E.fimEm && E.t > E.fimEm && !E.terminou) terminar();
  } else if (modo === 'morto') {
    E.t += dt; E.mortoT -= dt; atualizarEntidades(dt, k);
    if (E.mortoT <= 0) renascer();
  }
  atualizarEfeitos(dt);
  if (modo === 'jogando' || modo === 'morto') camera(dt);
}

/* ==========================================================
   DESENHO
   ========================================================== */
function desenharJogador(){
  if (p.oculto) return;
  var s = M.esc, sk = PV.skins.atual(), pal = sk.pal;
  if (p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0) return;
  cx.save();
  cx.translate(p.x + p.w / 2, p.y + p.h);
  var resp = (p.chao && Math.abs(p.vx) < 40 && !p.mirando) ? 1 + Math.sin(p.animT * 3) * 0.014 : 1;
  cx.scale(p.faceX * p.sx, p.sy * resp);
  if (p.giro > 0) { cx.translate(0, -p.h / 2); cx.rotate(p.giro * Math.PI * 2 * (p.virado ? -1 : 1)); cx.translate(0, p.h / 2); }
  var ox = -p.w / 2, oy = -p.h;
  if (p.socando === 2) { cx.fillStyle = 'rgba(224,168,79,.35)'; cx.fillRect(ox + 2 * s, oy - 18 * s, 6 * s, 18 * s); }
  var pisca = (p.animT % 3.4) < 0.13;
  mapa(sk.oculos ? (pisca ? CORPO_OP : CORPO_O) : (pisca ? CORPO_P : CORPO), ox, oy, s, pal);
  if (p.mirando || p.poseT > 0) {
    var ay = oy + 9 * s;
    cx.fillStyle = COR.K; cx.fillRect(ox + 9 * s, ay - s * 0.4, 4 * s, s * 0.4); cx.fillRect(ox + 9 * s, ay + 2 * s, 4 * s, s * 0.4);
    cx.fillStyle = COR.S; cx.fillRect(ox + 9 * s, ay, 4 * s, 2 * s);
    cx.fillRect(ox + 13 * s, ay, 2 * s, s);
    cx.fillRect(ox + 12 * s, ay - s, s, s);
    var R0 = p.mirando ? (3 + Math.min(p.carga, 1) * 14) * s / 3 : 4 * s / 3 * (p.poseT / 0.28);
    if (R0 > 1) {
      var fl = R0 * (1 + 0.1 * Math.sin(p.animT * 45)), ox2 = ox + 16 * s, oy2 = ay + 0.5 * s;
      var g = cx.createRadialGradient(ox2, oy2, 0, ox2, oy2, fl * 2.4);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(120,225,255,.9)'); g.addColorStop(1, 'rgba(53,208,229,0)');
      cx.fillStyle = g; cx.beginPath(); cx.arc(ox2, oy2, fl * 2.4, 0, 7); cx.fill();
    }
    if (p.mirando && p.carga > 0.5) {
      cx.strokeStyle = 'rgba(53,208,229,' + (0.3 + 0.3 * Math.sin(p.animT * 30)) + ')'; cx.lineWidth = 3;
      cx.beginPath(); cx.ellipse(0, -3, p.w * (0.7 + p.carga * 0.3), 7, 0, 0, 7); cx.stroke();
    }
  }
  var correndo = p.chao && Math.abs(p.vx) > 40, ph = Math.sin(p.animT * 18);
  var lx = 2, rx = 5, lh = 4, rh = 4;
  if (!p.chao) { lx = 1; rx = 6; lh = 3; rh = 3; }
  else if (correndo) { lh = ph > 0 ? 3 : 4; rh = ph > 0 ? 4 : 3; lx = ph > 0 ? 3 : 1; rx = ph > 0 ? 5 : 6; }
  var corJ = (pal && pal.J) || COR.J;
  function perna(x, hh){
    cx.fillStyle = corJ; cx.fillRect(ox + x * s, oy + 13 * s, 3 * s, (hh - 1) * s);
    cx.fillStyle = COR.T; cx.fillRect(ox + x * s, oy + (13 + hh - 1) * s, 3 * s, s);
    cx.fillStyle = COR.K; cx.fillRect(ox + x * s, oy + (13 + hh) * s - s / 3, 3 * s, s / 3);
  }
  perna(lx, lh); perna(rx, rh);
  cx.restore();
}

function hexagono(x, y, r, giro){
  cx.beginPath();
  for (var a = 0; a < 6; a++) { var ang = giro + a * Math.PI / 3; cx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r); }
  cx.closePath();
}

function chip(x, y, rotulo, cor, fundo, s, bz){
  var w = rotulo.length * 9 * (s / 3) + 28 * (s / 3);
  cx.fillStyle = fundo; cx.fillRect(x - w / 2, y - 14 + bz, w, 28);
  cx.strokeStyle = cor; cx.lineWidth = 2; cx.strokeRect(x - w / 2, y - 14 + bz, w, 28);
  cx.fillStyle = cor; cx.font = '700 ' + 11 * (s / 3) + 'px Silkscreen, monospace';
  cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(rotulo, x, y + 1 + bz);
}

function desenharEntidades(topo, base){
  var t = E.t;
  for (var i = 0; i < E.ents.length; i++) {
    var e = E.ents[i];
    if (!e.vivo || e.oculto || e.x === undefined) continue;
    if (e.y < topo - 160 || e.y > base + 160) continue;
    var s = M.esc;
    switch (e.tipo) {
      case 'bit': {
        var bob = Math.sin(t * 4 + e.x * 0.05) * 3;
        mapa(BIT, e.x - 2.5 * s, e.y - 2.5 * s + bob, s); break; }
      case 'skill': chip(e.x, e.y, '★ ' + e.nome, '#e0a84f', 'rgba(224,168,79,.18)', s, Math.sin(t * 3 + e.x * 0.01) * 4); break;
      case 'etapa': chip(e.x, e.y, '✔ ' + e.nome, '#34d399', 'rgba(52,211,153,.18)', s, Math.sin(t * 3 + e.x * 0.01) * 4); break;
      case 'badge': chip(e.x, e.y, '◆ ' + e.nome, '#35d0e5', 'rgba(53,208,229,.16)', s, Math.sin(t * 3 + e.x * 0.01) * 4); break;
      case 'trofeu': mapa(TROFEU, e.x - 4.5 * s * 1.3, e.y - 4.5 * s * 1.3 + Math.sin(t * 3) * 4, s * 1.3); break;
      case 'cafe': mapa(CAFE, e.x - 4 * s, e.y - 4 * s + Math.sin(t * 3) * 3, s); break;
      case 'escudo': {
        var ez = Math.sin(t * 3) * 4, er = 11 * s;
        var ge = cx.createRadialGradient(e.x, e.y + ez, 0, e.x, e.y + ez, er * 2);
        ge.addColorStop(0, 'rgba(123,66,188,.5)'); ge.addColorStop(1, 'rgba(123,66,188,0)');
        cx.fillStyle = ge; cx.beginPath(); cx.arc(e.x, e.y + ez, er * 2, 0, 7); cx.fill();
        hexagono(e.x, e.y + ez, er, t); cx.fillStyle = '#7b42bc'; cx.fill(); cx.strokeStyle = '#d2b4ff'; cx.lineWidth = 2; cx.stroke();
        cx.fillStyle = '#fff'; cx.font = '700 ' + 12 * s + 'px Silkscreen, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('T', e.x, e.y + ez + 1);
        break; }
      case 'portal': {
        var pw = 22 * (s / 3) * 2, ph2 = 38 * (s / 3) * 1.6, pz = Math.sin(t * 4) * 0.12;
        var gp = cx.createLinearGradient(0, e.y - ph2 / 2, 0, e.y + ph2 / 2);
        gp.addColorStop(0, 'rgba(155,92,255,.9)'); gp.addColorStop(1, 'rgba(52,211,153,.9)');
        cx.fillStyle = gp; cx.beginPath(); cx.ellipse(e.x, e.y, pw * (0.5 + pz), ph2 / 2, 0, 0, 7); cx.fill();
        cx.strokeStyle = '#fff'; cx.lineWidth = 2; cx.stroke();
        cx.fillStyle = '#fff'; cx.font = '700 ' + 9 * (s / 3) + 'px Silkscreen, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText(tr('SAÍDA'), e.x, e.y - ph2 / 2 - 10);
        break; }
      case 'segredo': {
        var bz = Math.sin(t * 3) * 5, sz = 34 * (s / 3);
        var gs = cx.createRadialGradient(e.x, e.y + bz, 0, e.x, e.y + bz, sz * 1.8);
        gs.addColorStop(0, 'rgba(224,168,79,.45)'); gs.addColorStop(1, 'rgba(224,168,79,0)');
        cx.fillStyle = gs; cx.beginPath(); cx.arc(e.x, e.y + bz, sz * 1.8, 0, 7); cx.fill();
        cx.fillStyle = '#e0a84f'; cx.fillRect(e.x - sz / 2, e.y + bz - sz / 2, sz, sz);
        cx.strokeStyle = '#7a4f1a'; cx.lineWidth = 3; cx.strokeRect(e.x - sz / 2, e.y + bz - sz / 2, sz, sz);
        cx.fillStyle = '#fff0c4'; cx.font = '700 ' + 22 * (s / 3) + 'px Silkscreen, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText('?', e.x, e.y + bz + 2); break; }
      case 'bug': {
        cx.save(); cx.translate(e.x + e.w / 2, e.y + e.h / 2); cx.scale(e.dir, 1); cx.translate(-e.w / 2, -e.h / 2);
        mapa(BUG, 0, Math.sin(t * 12) > 0 ? 0 : -1, s); cx.restore(); break; }
      case 'glitch': {
        var qs = Math.floor(t * 10) + e.ph * 7;
        for (var a = 0; a < 10; a++) for (var b = 0; b < 10; b++) {
          var h = Math.sin(a * 12.9898 + b * 78.233 + qs) * 43758.5453; h -= Math.floor(h);
          if (h < 0.25) continue;
          cx.fillStyle = h > 0.85 ? COR.q : (h > 0.5 ? COR.Q : '#6b3fc4');
          cx.fillRect(e.x + a * s + (h > 0.9 ? s : 0), e.y + b * s, s, s);
        }
        break; }
      case 'crash': {      // Pod em CrashLoopBackOff
        var qb = e.quebra > 0, mx = e.x + e.w / 2 + (qb ? rnd(-2, 2) : 0), my = e.y + e.h / 2, rr = e.w / 2;
        hexagono(mx, my, rr, Math.PI / 6); cx.fillStyle = qb ? '#ff3b3b' : '#326ce5'; cx.fill();
        cx.strokeStyle = '#070b14'; cx.lineWidth = 3; cx.stroke();
        cx.fillStyle = '#fff'; cx.font = '700 ' + Math.round(rr * 1.0) + 'px Silkscreen, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText(qb ? '!' : 'K', mx, my + 1);
        cx.fillStyle = '#070b14'; cx.fillRect(mx - rr * 0.55, e.y + e.h - 3, rr * 0.4, 3); cx.fillRect(mx + rr * 0.15, e.y + e.h - 3, rr * 0.4, 3);
        if (e.flash > 0) { cx.globalAlpha = .6; hexagono(mx, my, rr, Math.PI / 6); cx.fillStyle = '#fff'; cx.fill(); cx.globalAlpha = 1; }
        break; }
      case 'vaza': {       // vazamento de segredo: chave que pinga
        var kx = e.x, ky = e.y, kw = e.w, kh = e.h;
        cx.fillStyle = '#e0a84f'; cx.beginPath(); cx.arc(kx + kw * 0.5, ky + kh * 0.3, kw * 0.34, 0, 7); cx.fill();
        cx.fillStyle = '#0b1828'; cx.beginPath(); cx.arc(kx + kw * 0.5, ky + kh * 0.3, kw * 0.14, 0, 7); cx.fill();
        cx.fillStyle = '#e0a84f'; cx.fillRect(kx + kw * 0.43, ky + kh * 0.52, kw * 0.14, kh * 0.4);
        cx.fillRect(kx + kw * 0.57, ky + kh * 0.7, kw * 0.22, kh * 0.08); cx.fillRect(kx + kw * 0.57, ky + kh * 0.84, kw * 0.16, kh * 0.08);
        cx.fillStyle = '#ff4d7e'; cx.fillRect(kx + kw * 0.3, ky + kh * 0.2, kw * 0.12, kw * 0.12); cx.fillRect(kx + kw * 0.58, ky + kh * 0.2, kw * 0.12, kw * 0.12);
        if (e.flash > 0) { cx.globalAlpha = .6; cx.fillStyle = '#fff'; cx.fillRect(kx, ky, kw, kh); cx.globalAlpha = 1; }
        break; }
      case 'fatura': {     // fatura de cloud: 3 de vida
        cx.fillStyle = '#f4efe6'; cx.fillRect(e.x, e.y, e.w, e.h);
        cx.fillStyle = '#d8cfc0'; for (var li = 0; li < 3; li++) cx.fillRect(e.x + 4, e.y + e.h * 0.1 + li * e.h * 0.1, e.w - 8, 2);
        cx.fillStyle = '#d6264a'; cx.font = '700 ' + Math.round(e.h * 0.55) + 'px Silkscreen, monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText('$', e.x + e.w / 2, e.y + e.h * 0.64);
        cx.fillStyle = '#070b14'; cx.fillRect(e.x + e.w * 0.28, e.y + e.h * 0.42, 3, 3); cx.fillRect(e.x + e.w * 0.66, e.y + e.h * 0.42, 3, 3);
        cx.fillStyle = '#ff4d7e'; for (var hp = 0; hp < e.hp; hp++) cx.fillRect(e.x + 3 + hp * 9, e.y - 8, 7, 4);
        if (e.flash > 0) { cx.globalAlpha = .6; cx.fillStyle = '#fff'; cx.fillRect(e.x, e.y, e.w, e.h); cx.globalAlpha = 1; }
        break; }
    }
  }
}

function desenharBoss(){
  var B = E.boss, i;
  if (B && B.ativo && B.vivo && !E.noBonus) {
    var s = M.esc * 3;
    var g = cx.createRadialGradient(B.x + B.w / 2, B.y + B.h / 2, B.w * 0.1, B.x + B.w / 2, B.y + B.h / 2, B.w * 0.9);
    g.addColorStop(0, B.fase2 ? 'rgba(255,40,80,.35)' : 'rgba(255,77,126,.25)'); g.addColorStop(1, 'rgba(255,77,126,0)');
    cx.fillStyle = g; cx.beginPath(); cx.arc(B.x + B.w / 2, B.y + B.h / 2, B.w * 0.9, 0, 7); cx.fill();
    mapa(BUG, B.x, B.y + (Math.sin(B.t * 10) > 0 ? 0 : -3), s);
    if (B.flash > 0) { cx.globalAlpha = 0.65; cx.fillStyle = '#fff'; cx.fillRect(B.x, B.y, B.w, B.h); cx.globalAlpha = 1; }
  }
  for (i = 0; i < E.bolas.length; i++) {
    var b = E.bolas[i];
    cx.globalAlpha = 0.35; cx.fillStyle = b.cor; cx.beginPath(); cx.arc(b.x, b.y, b.r * 2.2, 0, 7); cx.fill();
    cx.globalAlpha = 1; cx.beginPath(); cx.arc(b.x, b.y, b.r * 1.2, 0, 7); cx.fill();
    cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(b.x, b.y, b.r * 0.5, 0, 7); cx.fill();
  }
}

function desenharMundo(){
  var sy = window.scrollY, topo = sy, base = sy + H, tx = 0, ty = 0;
  if (E.tremor > 0) { tx = rnd(-1, 1) * E.tremor; ty = rnd(-1, 1) * E.tremor; }
  cx.save();
  cx.translate(tx, -sy + ty);
  desenharEntidades(topo, base);
  desenharBoss();
  var i;
  for (i = 0; i < E.aneis.length; i++) { var a = E.aneis[i], u = 1 - a.v / a.m; cx.strokeStyle = a.cor; cx.globalAlpha = 1 - u; cx.lineWidth = a.l; cx.beginPath(); cx.arc(a.x, a.y, a.r * (0.3 + u), 0, 7); cx.stroke(); }
  cx.globalAlpha = 1;
  for (i = 0; i < E.tiros.length; i++) {
    var ti = E.tiros[i], gr = cx.createRadialGradient(ti.x, ti.y, 0, ti.x, ti.y, ti.r * 2.6);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(160,235,255,.95)'); gr.addColorStop(.6, 'rgba(53,208,229,.5)'); gr.addColorStop(1, 'rgba(53,208,229,0)');
    cx.fillStyle = gr; cx.beginPath(); cx.arc(ti.x, ti.y, ti.r * 2.6, 0, 7); cx.fill();
    if (ti.c > .55) {
      cx.strokeStyle = 'rgba(255,255,255,.8)'; cx.lineWidth = 2;
      for (var sp = 0; sp < 4; sp++) { var aa = ti.ang + sp * 1.5708; cx.beginPath(); cx.moveTo(ti.x + Math.cos(aa) * ti.r, ti.y + Math.sin(aa) * ti.r); cx.lineTo(ti.x + Math.cos(aa) * ti.r * 1.9, ti.y + Math.sin(aa) * ti.r * 1.9); cx.stroke(); }
    }
  }
  desenharJogador();
  if (E.escudo > 0 && !p.oculto) {
    var ccx = p.x + p.w / 2, ccy = p.y + p.h / 2, rr = p.h * 0.78 + Math.sin(E.t * 5) * 2;
    var gs2 = cx.createRadialGradient(ccx, ccy, rr * 0.5, ccx, ccy, rr);
    gs2.addColorStop(0, 'rgba(123,66,188,0)'); gs2.addColorStop(1, 'rgba(155,92,255,.45)');
    cx.fillStyle = gs2; cx.beginPath(); cx.arc(ccx, ccy, rr, 0, 7); cx.fill();
    cx.strokeStyle = 'rgba(210,180,255,.9)'; cx.lineWidth = 2; hexagono(ccx, ccy, rr, E.t); cx.stroke();
  }
  for (i = 0; i < E.parts.length; i++) { var q = E.parts[i]; cx.globalAlpha = Math.min(1, q.v / q.m * 1.5); cx.fillStyle = q.cor; cx.fillRect(q.x, q.y, q.tam, q.tam); }
  cx.globalAlpha = 1;
  cx.textAlign = 'center'; cx.textBaseline = 'alphabetic';
  for (i = 0; i < E.textos.length; i++) {
    var T = E.textos[i], tt = tr(T.txt);
    cx.globalAlpha = 1 - T.t / 1.1; cx.font = '700 ' + (T.grande ? 15 : 12) + 'px Silkscreen, monospace';
    cx.fillStyle = '#000'; cx.fillText(tt, T.x + 1, T.y + 1); cx.fillStyle = T.cor; cx.fillText(tt, T.x, T.y);
  }
  cx.globalAlpha = 1;
  cx.restore();
}

function textoPixel(txt, x, y, cor, tam, alinha){
  txt = tr(txt);
  cx.font = '700 ' + tam + 'px Silkscreen, monospace'; cx.textAlign = alinha || 'left'; cx.textBaseline = 'middle';
  cx.fillStyle = '#000'; cx.fillText(txt, x + 1, y + 1); cx.fillStyle = cor; cx.fillText(txt, x, y);
}

function desenharHUD(){
  var y0 = 60 + 24, x0 = 16, s = 3, i;
  if (E.flash > 0) { cx.fillStyle = 'rgba(255,255,255,' + E.flash * 0.7 + ')'; cx.fillRect(0, 0, W, H); }
  for (i = 0; i < 3; i++) mapa(CORACAO, x0 + i * 28, y0 - 9, s, i < p.vidas ? null : { H: '#24364b' });
  var x = x0 + 100;
  mapa(BIT, x, y0 - 8, 3); textoPixel(E.bits + '/' + E.bitsTotal, x + 22, y0, '#c9f6fc', 13);
  x += 100; textoPixel('★ ' + E.skills.length + '/' + E.skillsTotal, x, y0, '#ffd890', 13);
  x += 90; textoPixel('🏆 ' + E.trofeus.length + '/' + E.trofeusTotal, x, y0, '#e0a84f', 13);
  x += 90; textoPixel(E.speed ? tempoMs(E.crono) : tempo(E.crono), x, y0, E.speed ? '#ffd890' : '#eaf1f5', 13);
  if (E.escudo > 0) textoPixel('⬢ ESCUDO', x + 95, y0, '#d2b4ff', 12);
  textoPixel(String(E.pontos).padStart(6, '0') + ' pts', W - 16, y0, '#eaf1f5', 13, 'right');
  var nomeFase = E.faseAtual > M.ultima ? 'SALA SECRETA' : 'FASE ' + E.faseAtual + '/' + M.ultima + ' · ' + M.fases[E.faseAtual].nome.toUpperCase();
  textoPixel(nomeFase, W - 16, y0 + 20, E.faseAtual > M.ultima ? '#c9a8ff' : '#6a8294', 11, 'right');
  if (E.speed) textoPixel('SPEEDRUN', W / 2, y0 - 2, '#ffd890', 12, 'center');
  textoPixel('P pausa · M som · X rei gun · Shift dash', x0, H - 16, '#6a8294', 10);
  var by = H - 38;
  cx.fillStyle = '#10233a'; cx.fillRect(x0, by - 4, 150, 8);
  cx.fillStyle = E.reiki >= 12 ? '#35d0e5' : '#6a8294'; cx.fillRect(x0, by - 4, 150 * E.reiki / 100, 8);
  if (p.mirando) { cx.fillStyle = '#fff'; cx.fillRect(x0, by + 5, 150 * Math.min(p.carga, 1), 3); }
  textoPixel('REIKI', x0 + 158, by, '#6a8294', 10);
  var BB = E.boss;
  if (BB && BB.ativo && BB.vivo && !BB.anuncio && !E.noBonus) {
    var bw = Math.min(320, W - 40), bx0 = W / 2 - bw / 2, byy = y0 + 22;
    cx.fillStyle = '#2a0f1c'; cx.fillRect(bx0, byy, bw, 10);
    cx.fillStyle = BB.fase2 ? '#ff2d55' : '#ff4d7e'; cx.fillRect(bx0, byy, bw * Math.max(0, BB.hp) / BB.hpMax, 10);
    cx.strokeStyle = '#fff'; cx.lineWidth = 1; cx.strokeRect(bx0, byy, bw, 10);
    textoPixel('BUG GIGANTE', W / 2, byy - 10, '#ff8fae', 11, 'center');
  }
  for (i = 0; i < E.toasts.length; i++) {
    var ts = E.toasts[i], al = Math.min(1, ts.t * 4, (3.6 - ts.t) * 2);
    cx.globalAlpha = Math.max(0, al);
    var tw = cx.measureText(tr(ts.txt)).width + 40, ty = y0 + 56 + i * 34;
    cx.fillStyle = 'rgba(11,24,40,.92)'; cx.fillRect(W / 2 - tw / 2, ty - 14, tw, 28);
    cx.strokeStyle = '#e0a84f'; cx.lineWidth = 2; cx.strokeRect(W / 2 - tw / 2, ty - 14, tw, 28);
    textoPixel('🏅 ' + ts.txt, W / 2, ty + 1, '#ffd890', 11, 'center');
    cx.globalAlpha = 1;
  }
  if (E.dica && E.dica.ate > E.t) textoPixel(E.dica.txt, W / 2, H - 70, '#eaf1f5', 13, 'center');
  if (E.banner) {
    var b = E.banner, al2 = Math.min(1, b.t * 4, (b.dur - b.t) * 3);
    cx.globalAlpha = Math.max(0, al2);
    textoPixel(b.titulo, W / 2, H * 0.32, b.cor, 34, 'center');
    textoPixel(b.sub, W / 2, H * 0.32 + 38, '#eaf1f5', 16, 'center');
    cx.globalAlpha = 1;
  }
}

function desenhar(){
  cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  cx.clearRect(0, 0, W, H);
  if (modo === 'menu' || !E) return;
  desenharMundo();
  desenharHUD();
}

/* ---------- cenário: muda a cada fase, com paralaxe ---------- */
/* camadas: estrelas, aurora, sol, nuvens, montanhas, cidade, matrix, servidores */
var TEMAS = [
  { c: ['#060b14', '#0b1830'], cam: ['estrelas', 'cidade'] },              // 0 início: cidade à noite
  { c: ['#081226', '#10233f'], cam: ['estrelas', 'cidade'] },              // 1 perfil
  { c: ['#0a1a33', '#17406b'], cam: ['estrelas', 'nuvens'] },              // 2 atuação: céu de nuvens (cloud)
  { c: ['#120f26', '#2e1d4d'], cam: ['estrelas', 'montanhas'] },           // 3 trajetória: montanhas, a estrada
  { c: ['#03120d', '#0a2c22'], cam: ['matrix', 'servidores'] },            // 4 projetos: data center
  { c: ['#04101f', '#0a3040'], cam: ['matrix', 'nuvens'] },                // 5 pipeline
  { c: ['#1a1206', '#40300f'], cam: ['estrelas', 'aurora'] },              // 6 certificações: aurora dourada
  { c: ['#0b1f2a', '#1a4a66'], cam: ['nuvens', 'montanhas'] },             // 7 formação: manhã
  { c: ['#1b0f1e', '#6a2f42'], cam: ['sol', 'cidade'] },                   // 8 contato: amanhecer
  { c: ['#10061c', '#2a0f45'], cam: ['servidores', 'matrix'] }             // 9 sala secreta
];
var ORDEM = ['estrelas', 'aurora', 'sol', 'nuvens', 'montanhas', 'cidade', 'matrix', 'servidores'];
function hexRgb(h){ return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
TEMAS.forEach(function(t){ t.rgb = t.c.map(hexRgb); });
function mix(a, b, u){ return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * u) + ',' + Math.round(a[1] + (b[1] - a[1]) * u) + ',' + Math.round(a[2] + (b[2] - a[2]) * u) + ')'; }
function hash(a, b){ var h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return h - Math.floor(h); }

var estrelas = [], predios = [[], []], nuvens = [], racks = [], colunas = [];
function iniciarEstrelas(){
  var i, x, n = Math.round(W * H / 9000);
  estrelas = [];
  for (i = 0; i < n; i++) estrelas.push({ x: Math.random() * W, y: Math.random() * H, z: rnd(.15, 1), f: Math.random() * 6 });
  predios = [[], []];
  for (var L = 0; L < 2; L++) {
    x = 0;
    while (x < W * 1.5) { var w = rnd(46, 110) * (L ? 1.15 : 0.9), h = H * rnd(0.12, 0.3) * (L ? 1.25 : 0.9); predios[L].push({ x: x, w: w, h: h, id: Math.random() * 99 }); x += w + rnd(0, 14); }
  }
  nuvens = [];
  for (i = 0; i < 9; i++) nuvens.push({ x: Math.random() * (W + 300), y: rnd(0.08, 0.62) * H, u: rnd(5, 11), v: rnd(6, 22), a: rnd(.25, .5) });
  racks = [];
  x = 0; while (x < W * 1.5) { racks.push({ x: x, h: H * rnd(0.3, 0.55), id: Math.random() * 99 }); x += 78; }
  colunas = [];
  for (i = 0; i < Math.floor(W / 24); i++) colunas.push({ x: i * 24 + 6, v: rnd(60, 160), o: Math.random() * 2000, n: Math.round(rnd(6, 14)) });
}

function faseFloat(y){
  var F = M.fases; if (!F.length) return 0;
  var i = 0; for (var k = 0; k < F.length; k++) if (y >= F[k].top) i = k;
  var prox = F[i + 1]; if (!prox) return i;
  var u = (y - F[i].top) / Math.max(1, prox.top - F[i].top);
  return i + clamp((u - 0.65) / 0.35, 0, 1);
}

var CAMADAS = {
  estrelas: function(t, sy, al, cor){
    for (var i = 0; i < estrelas.length; i++) {
      var e = estrelas[i], y = ((e.y - sy * e.z * 0.35) % H + H) % H;
      fx.globalAlpha = al * (0.25 + 0.55 * Math.abs(Math.sin(t / 1000 * e.z + e.f))) * e.z;
      fx.fillStyle = e.z > 0.7 ? cor : '#a2b5c4';
      var sz = e.z > 0.7 ? 3 : 2; fx.fillRect(Math.round(e.x), Math.round(y), sz, sz);
    }
  },
  aurora: function(t, sy, al){
    var cores = ['#e0a84f', '#ff4d7e', '#35d0e5'];
    for (var b = 0; b < 3; b++) {
      fx.fillStyle = cores[b]; fx.globalAlpha = al * 0.045;
      for (var x = 0; x < W; x += 20) {
        var y = H * 0.18 + b * 46 + Math.sin(x * 0.006 + t * 0.0004 * (b + 1) + b * 2) * 60 + Math.sin(x * 0.015 + t * 0.0009) * 18;
        fx.fillRect(x, y, 20, 150 + b * 30);
      }
    }
  },
  sol: function(t, sy, al){
    var cxs = W * 0.74, cys = H * 0.62 + Math.sin(t / 3000) * 6, r = Math.min(W, H) * 0.2;
    var g = fx.createRadialGradient(cxs, cys, r * 0.2, cxs, cys, r * 2.4);
    g.addColorStop(0, 'rgba(255,190,110,' + 0.8 * al + ')'); g.addColorStop(.35, 'rgba(255,110,120,' + 0.35 * al + ')'); g.addColorStop(1, 'rgba(255,110,120,0)');
    fx.globalAlpha = 1; fx.fillStyle = g; fx.beginPath(); fx.arc(cxs, cys, r * 2.4, 0, 7); fx.fill();
    fx.globalAlpha = al; fx.fillStyle = '#ffb36b'; fx.beginPath(); fx.arc(cxs, cys, r, 0, 7); fx.fill();
  },
  nuvens: function(t, sy, al){
    fx.fillStyle = '#a9c4ea';
    for (var i = 0; i < nuvens.length; i++) {
      var n = nuvens[i], u = n.u, x = ((n.x + t / 1000 * n.v) % (W + 300)) - 150, y = ((n.y - sy * 0.06) % H + H) % H;
      fx.globalAlpha = al * n.a * 0.55;
      fx.fillRect(x + u, y, u * 6, u); fx.fillRect(x, y + u, u * 8, u * 2); fx.fillRect(x + u * 2, y - u, u * 3, u); fx.fillRect(x + u * 3, y + u * 3, u * 4, u * 0.7);
    }
  },
  montanhas: function(t, sy, al){
    var cores = ['#0e1630', '#080d20'];
    for (var L = 0; L < 2; L++) {
      fx.fillStyle = cores[L]; fx.globalAlpha = al * (L ? 1 : 0.8);
      var off = sy * (0.04 + L * 0.07), base = H * (0.78 - L * 0.1) + (L ? 14 : 0);
      fx.beginPath(); fx.moveTo(0, H);
      for (var x = 0; x <= W + 20; x += 20) fx.lineTo(x, base - (Math.sin((x + off) * 0.008 + L * 3) * 0.5 + 0.5) * H * 0.16 - Math.sin((x + off) * 0.023) * 16);
      fx.lineTo(W, H); fx.closePath(); fx.fill();
    }
  },
  cidade: function(t, sy, al){
    for (var L = 0; L < 2; L++) {
      var tot = W * 1.5 + 120, off = (sy * (0.05 + L * 0.09)) % tot;
      for (var rep = 0; rep < 2; rep++) {
        for (var i = 0; i < predios[L].length; i++) {
          var b = predios[L][i], x = b.x - off + rep * tot;
          if (x > W || x + b.w < 0) continue;
          fx.globalAlpha = al * (L ? 0.95 : 0.7); fx.fillStyle = L ? '#070d1a' : '#0b1527'; fx.fillRect(x, H - b.h, b.w, b.h);
          var cols = Math.floor(b.w / 14), rows = Math.floor(b.h / 20);
          for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) {
            var h = hash(b.id + c, r);
            if (h < 0.62) continue;
            var pisca = h > 0.97 && Math.sin(t / 700 + h * 50) > 0;
            fx.globalAlpha = al * (pisca ? 0.2 : (L ? 0.75 : 0.45));
            fx.fillStyle = h > 0.9 ? '#e0a84f' : '#35d0e5';
            fx.fillRect(x + 5 + c * 14, H - b.h + 8 + r * 20, 5, 7);
          }
        }
      }
    }
  },
  servidores: function(t, sy, al){
    var tot = W * 1.5 + 80, off = (sy * 0.08) % tot;
    for (var rep = 0; rep < 2; rep++) for (var i = 0; i < racks.length; i++) {
      var r = racks[i], x = r.x - off + rep * tot; if (x > W || x < -70) continue;
      fx.globalAlpha = al * 0.95; fx.fillStyle = '#071a1a'; fx.fillRect(x, H - r.h, 58, r.h);
      fx.fillStyle = '#12303a'; fx.fillRect(x, H - r.h, 58, 3); fx.fillRect(x, H - r.h, 3, r.h); fx.fillRect(x + 55, H - r.h, 3, r.h);
      for (var j = 0; j < Math.floor(r.h / 14); j++) {
        var h = hash(r.id + j, 3), on = Math.sin(t / (300 + h * 900) + h * 20) > -0.2;
        fx.globalAlpha = al * (on ? 0.9 : 0.15);
        fx.fillStyle = h > 0.85 ? '#ff4d7e' : (h > 0.6 ? '#e0a84f' : '#34d399');
        fx.fillRect(x + 8, H - r.h + 10 + j * 14, 4, 4); fx.fillRect(x + 16, H - r.h + 10 + j * 14, 4, 4);
        fx.globalAlpha = al * 0.25; fx.fillStyle = '#12303a'; fx.fillRect(x + 26, H - r.h + 10 + j * 14, 24, 4);
      }
    }
  },
  matrix: function(t, sy, al){
    fx.font = '14px ui-monospace, Consolas, monospace'; fx.textAlign = 'left'; fx.textBaseline = 'top';
    var CH = '01ABCDEF{}<>/=;';
    for (var i = 0; i < colunas.length; i++) {
      var c = colunas[i], ciclo = H + c.n * 16, y0 = ((t / 1000 * c.v + c.o) % ciclo);
      for (var k = 0; k < c.n; k++) {
        var y = y0 - k * 16; if (y < -16 || y > H) continue;
        fx.globalAlpha = al * (1 - k / c.n) * 0.38;
        fx.fillStyle = k === 0 ? '#c9ffe6' : '#34d399';
        fx.fillText(CH.charAt(Math.floor(hash(i, k + Math.floor(t / 180)) * CH.length)), c.x, y);
      }
    }
  }
};

function desenharFundo(t){
  fx.setTransform(DPR, 0, 0, DPR, 0, 0);
  var sy = window.scrollY, f = clamp(faseFloat(sy + H * 0.5), 0, TEMAS.length - 1);
  var a = Math.min(Math.floor(f), TEMAS.length - 1), u = f - a, b = Math.min(a + 1, TEMAS.length - 1);
  var g = fx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix(TEMAS[a].rgb[0], TEMAS[b].rgb[0], u)); g.addColorStop(1, mix(TEMAS[a].rgb[1], TEMAS[b].rgb[1], u));
  fx.globalAlpha = 1; fx.fillStyle = g; fx.fillRect(0, 0, W, H);
  var pesos = {};
  TEMAS[a].cam.forEach(function(n){ pesos[n] = (pesos[n] || 0) + (1 - u); });
  TEMAS[b].cam.forEach(function(n){ pesos[n] = (pesos[n] || 0) + u; });
  var cor = (a === 4 || b === 4) ? '#34d399' : '#35d0e5';
  ORDEM.forEach(function(n){ if (pesos[n] > 0.02) CAMADAS[n](t, sy, Math.min(1, pesos[n]), cor); });
  fx.globalAlpha = 1;
}

/* ==========================================================
   IDIOMA · PT / EN
   ========================================================== */
function aplicarIdioma(){
  var en = I18N.lang === 'en';
  root.lang = en ? 'en' : 'pt-BR';
  document.title = en ? 'Leandro Oliveira Moraes, portfolio' : 'Leandro Oliveira Moraes, portfólio';
  $$('[data-en]').forEach(function(el){
    if (el.hasAttribute('data-letras')) {
      var novo = en ? el.dataset.en : el.dataset.pt;
      if (novo !== undefined) { el.textContent = novo; separarLetras(el); }
      return;
    }
    if (el.dataset.pt === undefined) el.dataset.pt = el.innerHTML;
    el.innerHTML = en ? el.dataset.en : el.dataset.pt;
  });
  var b = $('#btnIdioma'); if (b) b.textContent = en ? 'PT' : 'EN';
  rotulos();
  M.medir();
  if (modo !== 'menu') remedir();
}
function alternarIdioma(){ I18N.set(I18N.lang === 'en' ? 'pt' : 'en'); aplicarIdioma(); }

function alternarSom(){
  var on = som.alternar(), b = $('#btnSom');
  if (b) b.style.opacity = on ? 1 : 0.4;
  if (E && modo !== 'menu') dizer(on ? 'som ligado' : 'som desligado', 1.2);
}

/* ==========================================================
   FLUXO · menu, pausa, fim, ranking, conquistas, skins, terminal
   ========================================================== */
var painel = $('#painel');
function abrirPainel(html){ painel.innerHTML = tr(html); painel.hidden = false; }
function fecharPainel(){ painel.hidden = true; painel.innerHTML = ''; }

function rotulos(){ $$('.rotulo-jogar').forEach(function(el){ el.textContent = tr(modo === 'menu' ? '▶ Jogar' : '■ Sair do jogo'); }); }

function novaPartida(tipo){
  E = novoEstado();
  E.speed = tipo === 'speed';
  M.medir();
  ajustarTamanho();
  E.ents = M.criarEntidades();
  M.posicionar(E.ents);
  E.boss = criarBoss();
  E.ents.forEach(function(e){
    if (e.oculto) return;
    if (e.tipo === 'bit') E.bitsTotal++;
    if (e.tipo === 'skill') E.skillsTotal++;
    if (e.tipo === 'trofeu') E.trofeusTotal++;
    if (e.tipo === 'etapa') E.etapasTotal++;
    if (e.tipo === 'badge') E.badgesTotal++;
  });
  p.vidas = 3; p.invuln = 0; p.vx = p.vy = 0; p.oculto = false; p.socando = 0; p.giro = 0; p.chao = null; p.ignorar = null; p.dashT = 0;
  var pl = M.fases[0].pouso;
  p.x = pl ? pl.x + pl.w * 0.62 : 60; p.y = pl ? pl.y - p.h - 2 : 0;
  $$('.cartao.pisado, .cartao.verde').forEach(function(el){ el.classList.remove('pisado', 'verde'); });
}

function jogar(tipo){
  if (modo !== 'menu') { sair(); return; }
  som.acordar();
  tipoPartida = tipo || 'normal';
  window.scrollTo(0, 0);
  root.classList.add('modo-jogo');
  novaPartida(tipoPartida);
  limparInput();
  cam = 0; manualAte = 0;
  modo = 'jogando';
  banner('FASE 0', 'INÍCIO', 2, '#35d0e5');
  if (E.speed) dizer('SPEEDRUN: derrote o Bug Gigante o mais rápido possível', 4);
  rotulos();
  som.musica.iniciar('normal');
}

function sair(){
  fecharPainel(); modo = 'menu'; limparInput();
  root.classList.remove('modo-jogo');
  som.musica.parar();
  if (E && E.pisadoEl) E.pisadoEl.classList.remove('pisado');
  $$('.l.pisada').forEach(function(l){ l.classList.remove('pisada'); });
  $$('.fase-ativa').forEach(function(el){ el.classList.remove('fase-ativa'); });
  $$('.cartao.verde').forEach(function(el){ el.classList.remove('verde'); });
  rotulos();
}

function painelPausa(){
  abrirPainel('<div class="caixa"><h2>PAUSA</h2><p>Setas andam · espaço pula (2× no ar) · ↓ desce, no ar dá soco · X Rei Gun · Shift dash.</p>' +
    '<div class="acoes"><button class="botao-pixel" data-acao="continuar">Continuar</button>' +
    '<button class="botao-linha" data-acao="conquistas">🏅 Conquistas</button><button class="botao-linha" data-acao="skins">🎭 Skins</button>' +
    '<button class="botao-linha" data-acao="sair">Sair do jogo</button></div></div>');
}
function pausar(){
  if (modo !== 'jogando') return;
  if (E.speed) { dizer('sem pausa no speedrun', 1.6); return; }
  modo = 'pausado'; limparInput(); painelPausa();
}
function continuar(){ if (modo !== 'pausado') return; fecharPainel(); modo = 'jogando'; limparInput(); }

/* ---------- ranking ---------- */
function lerLista(chave){ try { return JSON.parse(localStorage.getItem(chave) || '[]'); } catch (e) { return []; } }
function gravarLista(chave, l){ try { localStorage.setItem(chave, JSON.stringify(l)); } catch (e) {} }
function htmlRank(tipo){
  var l = lerLista(tipo === 'speed' ? 'pv-leandro-speed' : 'pv-leandro-rank');
  if (!l.length) return '<p>Ninguém no ranking ainda. Seja o primeiro!</p>';
  return '<ol class="rank">' + l.map(function(r){
    return '<li><b>' + esc(r.n) + '</b><span>' + (tipo === 'speed' ? esc(r.t) : String(r.p).padStart(6, '0') + ' pts · ' + esc(r.t)) + '</span></li>';
  }).join('') + '</ol>';
}
function abrirRanking(){
  abrirPainel('<div class="caixa"><h2>RANKING</h2><h3>RANKING DE PONTOS</h3>' + htmlRank('normal') + '<h3>RANKING SPEEDRUN</h3>' + htmlRank('speed') +
    '<div class="acoes"><button class="botao-pixel" data-acao="fechar">Fechar</button></div></div>');
}
function salvarRank(){
  var el = $('#nome'), nome = ((el && el.value) || '').trim().slice(0, 12) || 'JOGADOR';
  if (E.speed) {
    var l = lerLista('pv-leandro-speed'); l.push({ n: nome, s: E.crono, t: tempoMs(E.crono) });
    l.sort(function(a, b){ return a.s - b.s; }); gravarLista('pv-leandro-speed', l.slice(0, 5));
  } else {
    var l2 = lerLista('pv-leandro-rank'); l2.push({ n: nome, p: E.pontos, t: tempo(E.crono) });
    l2.sort(function(a, b){ return b.p - a.p; }); gravarLista('pv-leandro-rank', l2.slice(0, 5));
  }
  E.salvou = true; painelFim();
}

/* ---------- fim de jogo ---------- */
function painelFim(){
  function item(r, v){ return '<div><dt>' + r + '</dt><dd>' + v + '</dd></div>'; }
  abrirPainel('<div class="caixa"><h2>FIM DE JOGO</h2><p>Você chegou ao contato. Obrigado por jogar!</p><dl>' +
    item('PONTOS', E.pontos) + item('TEMPO', E.speed ? tempoMs(E.crono) : tempo(E.crono)) +
    item('BITS', E.bits + '/' + E.bitsTotal) + item('SKILLS', E.skills.length + '/' + E.skillsTotal) +
    item('TROFÉUS', E.trofeus.length + '/' + E.trofeusTotal) + item('BUGS', E.bugs) + item('MORTES', E.mortes) +
    item('SEGREDO', E.segredo ? 'achou' : '?') + '</dl>' +
    (E.salvou ? '' : '<div class="salvar"><input id="nome" maxlength="12" placeholder="seu nome" autocomplete="off"><button class="botao-pixel" data-acao="salvar">Salvar</button></div>') +
    (E.speed ? '<h3>RANKING SPEEDRUN</h3>' + htmlRank('speed') : htmlRank('normal')) +
    '<div class="acoes"><button class="botao-pixel" data-acao="explorar">Continuar</button>' +
    '<button class="botao-linha" data-acao="reiniciar">Jogar de novo</button>' +
    '<button class="botao-linha" data-acao="sair">Sair</button></div></div>');
  var nm = $('#nome'); if (nm) nm.focus();
}
function terminar(){
  E.terminou = true; modo = 'fim'; limparInput(); som.tocar('trofeu'); som.musica.parar();
  ganhar('zerou');
  if (E.mortes === 0) ganhar('sem_morrer');
  if (E.speed && E.crono < 300) ganhar('speedrun');
  painelFim();
}

/* ---------- conquistas e skins ---------- */
function fecharSub(){ if (modo === 'pausado') painelPausa(); else fecharPainel(); }
function abrirConquistas(){
  var C_ = PV.conquistas;
  abrirPainel('<div class="caixa larga"><h2>CONQUISTAS</h2><p>' + C_.total() + '/' + C_.lista.length + '</p><div class="conqs">' +
    C_.lista.map(function(c){
      var ok = C_.tem(c.id);
      return '<div class="conq' + (ok ? ' ok' : '') + '"><b>' + (ok ? '🏅 ' : '🔒 ') + esc(I18N.t({ pt: c.pt, en: c.en })) + '</b><span>' + esc(I18N.t({ pt: c.dpt, en: c.den })) + '</span></div>';
    }).join('') + '</div><div class="acoes"><button class="botao-pixel" data-acao="fechar">Fechar</button></div></div>');
}
function abrirSkins(){
  var atual = PV.skins.atual().id;
  abrirPainel('<div class="caixa larga"><h2>SKINS</h2><p>Escolha seu personagem</p><div class="conqs">' +
    PV.skins.lista.map(function(s){
      var lib = PV.skins.liberada(s), req = s.req ? PV.conquistas.achar(s.req) : null;
      return '<div class="conq' + (lib ? ' ok' : '') + '"><b>' + esc(I18N.t({ pt: s.pt, en: s.en })) + '</b><span>' +
        (lib ? (atual === s.id ? tr('em uso') : '<button class="botao-linha mini2" data-acao="skin" data-id="' + s.id + '">Usar</button>') :
          '🔒 ' + tr('desbloqueie: ') + esc(I18N.t({ pt: req.pt, en: req.en }))) + '</span></div>';
    }).join('') + '</div><div class="acoes"><button class="botao-pixel" data-acao="fechar">Fechar</button></div></div>');
}

/* ---------- terminal secreto ---------- */
var termAntes = null;
function termEscrever(linhas, cls){
  var out = $('#termOut'); if (!out) return;
  linhas.forEach(function(l){ var d = document.createElement('div'); if (cls) d.className = cls; d.textContent = l; out.appendChild(d); });
  out.scrollTop = out.scrollHeight;
}
function abrirTerminal(){
  if (!painel.hidden) return;
  if (E && E.speed) { dizer('sem terminal no speedrun', 1.6); return; }
  if (modo !== 'menu' && modo !== 'jogando') return;
  termAntes = modo;
  if (modo === 'jogando') { modo = 'pausado'; limparInput(); }
  painel.innerHTML = '<div class="caixa term"><div id="termOut"></div><div class="termLinha"><span>$</span><input id="termIn" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>';
  painel.hidden = false;
  termEscrever(['leandro-portfolio v1.0 · ' + (I18N.lang === 'en' ? "type 'help'" : "digite 'help'"), '']);
  var inp2 = $('#termIn'); if (inp2) inp2.focus();
}
function fecharTerminal(){
  fecharPainel();
  if (termAntes === 'jogando') { modo = 'jogando'; limparInput(); }
  termAntes = null;
}
function termEnviar(){
  var el = $('#termIn'); if (!el) return;
  var cmd = el.value; el.value = '';
  termEscrever(['$ ' + cmd], 'cmd');
  var r = PV.terminal.run(cmd, I18N.lang);
  if (r.limpar) { $('#termOut').innerHTML = ''; return; }
  if (r.sair) { fecharTerminal(); return; }
  termEscrever(r.l);
  if (r.conq && E) ganhar('terminal');
  else if (r.conq && !E) { PV.conquistas.desbloquear('terminal'); }
}

/* ---------- eventos ---------- */
document.addEventListener('click', function(ev){
  var b = ev.target.closest('[data-acao]'); if (!b) return;
  var a = b.dataset.acao;
  if (a === 'jogar') jogar('normal');
  else if (a === 'speedrun') jogar('speed');
  else if (a === 'continuar') continuar();
  else if (a === 'sair') sair();
  else if (a === 'explorar') { fecharPainel(); modo = 'jogando'; som.musica.iniciar('normal'); }
  else if (a === 'reiniciar') { sair(); jogar(tipoPartida); }
  else if (a === 'salvar') salvarRank();
  else if (a === 'ranking') abrirRanking();
  else if (a === 'conquistas') abrirConquistas();
  else if (a === 'skins') abrirSkins();
  else if (a === 'skin') { if (PV.skins.usar(b.dataset.id)) abrirSkins(); }
  else if (a === 'idioma') alternarIdioma();
  else if (a === 'som') alternarSom();
  else if (a === 'fechar') fecharSub();
});

addEventListener('keydown', function(e){
  if (e.target && e.target.tagName === 'INPUT') {
    if (e.target.id === 'termIn') {
      if (e.code === 'Enter') { e.preventDefault(); termEnviar(); }
      else if (e.code === 'Escape') { e.preventDefault(); fecharTerminal(); }
      else if (e.key && e.key.length === 1) som.tocar('tecla');
    } else if (e.code === 'Enter') { e.preventDefault(); var sv = $('[data-acao="salvar"]'); if (sv) sv.click(); }
    return;
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if ((e.code === 'Backquote' || e.key === '`') && painel.hidden) { e.preventDefault(); abrirTerminal(); return; }
  if (modo === 'menu') {
    if (e.code === 'Escape' && !painel.hidden) { fecharPainel(); return; }
    if (e.code === 'Enter' && painel.hidden && !e.target.closest('a,button,input')) { e.preventDefault(); jogar('normal'); }
    return;
  }
  if (TECLAS[e.code]) { e.preventDefault(); if (!e.repeat || TECLAS[e.code] !== 'pulo') apertar(TECLAS[e.code]); }
  if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); modo === 'pausado' ? continuar() : pausar(); }
  if (e.code === 'Enter' && modo === 'pausado') continuar();
  if (e.code === 'KeyM') alternarSom();
});
addEventListener('keyup', function(e){ if (TECLAS[e.code]) soltar(TECLAS[e.code]); });
addEventListener('blur', function(){ limparInput(); if (modo === 'jogando' && !(E && E.speed)) pausar(); });
document.addEventListener('visibilitychange', function(){ if (document.hidden && modo === 'jogando' && !(E && E.speed)) pausar(); });
['wheel', 'touchmove'].forEach(function(n){ addEventListener(n, function(){ if (modo === 'jogando') manualAte = performance.now() + 1400; }, { passive: true }); });

$$('#pad button').forEach(function(b){
  var a = b.dataset.k;
  b.addEventListener('pointerdown', function(e){ e.preventDefault(); if (modo === 'jogando') apertar(a); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(function(n){ b.addEventListener(n, function(){ soltar(a); }); });
});

/* ---------- laço ---------- */
var ultimo = performance.now(), medidoEm = 0;
function laco(agora){
  requestAnimationFrame(laco);
  var dt = Math.min((agora - ultimo) / 1000, 1 / 30); ultimo = agora;
  desenharFundo(agora);
  if (modo !== 'menu' && E) {
    if (modo !== 'pausado' && modo !== 'fim') passo(dt);
    else if (modo === 'fim') { E.t += dt; atualizarEfeitos(dt); }
    if (agora - medidoEm > 700 && modo === 'jogando') {
      medidoEm = agora;
      if (root.scrollHeight !== M.H || root.clientWidth !== M.W) remedir();
    }
  }
  desenhar();
}

function remedir(){
  M.medir(); ajustarTamanho();
  if (E) { M.posicionar(E.ents); p.chao = null; p.ignorar = null; }
}

addEventListener('resize', function(){ redimensionarCanvas(); if (modo !== 'menu') remedir(); });

/* ---------- site fora do jogo: progresso, link ativo e revelação ao rolar ---------- */
(function(){
  var barra = $('#progresso'), links = $$('.nav-links a'), secoes = links.map(function(l){ return $(l.getAttribute('href')); }), agendado = false;
  function aoRolar(){
    agendado = false;
    var y = window.scrollY, alt = root.scrollHeight - window.innerHeight, atual = -1;
    if (barra) barra.style.width = (alt > 0 ? (y / alt) * 100 : 0) + '%';
    for (var i = 0; i < secoes.length; i++) if (secoes[i] && secoes[i].getBoundingClientRect().top <= window.innerHeight * 0.35) atual = i;
    links.forEach(function(l, i){ l.classList.toggle('ativo', i === atual); });
  }
  addEventListener('scroll', function(){ if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  aoRolar();
  if (reduzido || !('IntersectionObserver' in window)) return;
  var obs = new IntersectionObserver(function(es){
    es.forEach(function(e){
      if (!e.isIntersecting) return;
      var el = e.target; el.classList.add('dentro'); obs.unobserve(el);
      setTimeout(function(){ el.classList.remove('rev', 'dentro'); }, 900);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  $$('.rotulo, .cartao, .heroi-texto, .heroi-acoes, .heroi-extras, .controles, .lead, .nota, .codigo, .contatos, .rack').forEach(function(el){ el.classList.add('rev'); obs.observe(el); });
})();

/* ---------- início ---------- */
M.preparar();
redimensionarCanvas();
aplicarIdioma();
var bs = $('#btnSom'); if (bs) bs.style.opacity = som.ligado() ? 1 : 0.4;
if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ M.medir(); if (modo !== 'menu') remedir(); });
window.addEventListener('load', function(){ M.medir(); });
requestAnimationFrame(laco);

})();
