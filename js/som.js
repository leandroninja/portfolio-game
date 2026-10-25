/* ==========================================================
   SOM · efeitos e música chiptune, tudo por osciladores
   (nenhum arquivo de áudio)
   ========================================================== */
window.PV = window.PV || {};

PV.som = (function(){
  'use strict';
  var ac = null, ligado = true;
  try { if (localStorage.getItem('pv-mudo') === '1') ligado = false; } catch (e) {}

  function ctx(){
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function osc(f, d, tipo, vol, t0, ate){
    var a = ctx(); if (!a) return;
    var o = a.createOscillator(), g = a.createGain();
    o.type = tipo || 'square';
    o.frequency.setValueAtTime(f, t0);
    if (ate) o.frequency.exponentialRampToValueAtTime(Math.max(30, ate), t0 + d);
    g.gain.setValueAtTime(vol || 0.05, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0 + d + 0.03);
  }
  function nota(f, d, tipo, vol, atraso, ate){
    var a = ctx(); if (!a || !ligado) return;
    osc(f, d, tipo, vol, a.currentTime + (atraso || 0), ate);
  }

  var T = {
    pulo: function(){ nota(300, .12, 'square', .05, 0, 620); },
    pulo2: function(){ nota(460, .14, 'square', .05, 0, 940); },
    pouso: function(){ nota(120, .09, 'triangle', .08, 0, 60); },
    bit: function(n){ nota(660 * Math.pow(1.06, Math.min(n || 0, 8)), .08, 'square', .04); },
    skill: function(){ [523, 659, 784, 1047].forEach(function(f, i){ nota(f, .13, 'square', .05, i * .07); }); },
    trofeu: function(){ [523, 659, 784, 1047, 1319].forEach(function(f, i){ nota(f, .18, 'square', .05, i * .09); }); },
    cafe: function(){ nota(400, .1, 'triangle', .07, 0, 800); nota(800, .15, 'triangle', .07, .09); },
    esmaga: function(c){ nota(220 + Math.min(c || 0, 6) * 60, .12, 'sawtooth', .06, 0, 60); },
    dano: function(){ nota(240, .3, 'sawtooth', .07, 0, 50); },
    socoIni: function(){ nota(520, .1, 'square', .04, 0, 200); },
    soco: function(){ nota(90, .22, 'sawtooth', .1, 0, 40); },
    morte: function(){ nota(300, .6, 'sawtooth', .08, 0, 40); },
    carrega: function(c){ nota(180 + (c || 0) * 700, .09, 'sine', .05); },
    tiro: function(c){ nota(900, .2, 'square', .05, 0, 180); nota(130, .3 + (c || 0) * .35, 'sawtooth', .1, 0, 45); },
    dash: function(){ nota(500, .13, 'sawtooth', .05, 0, 1200); },
    boss: function(){ nota(120, .3, 'square', .08, 0, 70); },
    escudo: function(){ nota(300, .15, 'triangle', .07, 0, 900); nota(600, .2, 'triangle', .06, .1, 1200); },
    conquista: function(){ [659, 880, 1175].forEach(function(f, i){ nota(f, .16, 'square', .05, i * .08); }); },
    portal: function(){ nota(200, .5, 'sine', .08, 0, 1500); nota(1500, .3, 'sine', .05, .25, 300); },
    etapa: function(){ nota(440, .1, 'square', .05); nota(660, .15, 'square', .05, .08); },
    tecla: function(){ nota(1200, .02, 'square', .015); },
    fase: function(){ [392, 523, 659].forEach(function(f, i){ nota(f, .14, 'square', .045, i * .08); }); }
  };

  /* ---------- música: arpejo em Lá menor, baixo e bateria ---------- */
  var ACORDES = [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [-5, -2, 2]];     // Am, F, G, Em (semitons a partir do Lá3)
  var PADRAO = [0, 1, 2, 1, 0, 1, 2, 1];
  var mus = { ativa: false, timer: null, passo: 0, prox: 0, modo: 'normal', ruido: null };
  function freq(n){ return 220 * Math.pow(2, n / 12); }
  function bufRuido(a){
    if (!mus.ruido) {
      var b = a.createBuffer(1, Math.floor(a.sampleRate * 0.05), a.sampleRate), d = b.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      mus.ruido = b;
    }
    return mus.ruido;
  }
  function hat(a, t, vol){
    var s = a.createBufferSource(), g = a.createGain();
    s.buffer = bufRuido(a); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    s.connect(g); g.connect(a.destination); s.start(t);
  }
  function tocarPasso(a, t, i, dur){
    var ac_ = ACORDES[Math.floor(i / 8)], k = PADRAO[i % 8], tr = mus.modo === 'boss' ? 2 : 0;
    osc(freq(ac_[k] + 12 + tr), dur * 1.4, 'square', 0.016, t);
    if (i % 2 === 0) osc(freq(ac_[0] - 12 + tr), dur * 1.8, 'triangle', 0.034, t);
    if (i % 4 === 0) osc(120, 0.09, 'triangle', 0.05, t, 45);
    if (i % 4 === 2) hat(a, t, 0.018);
    if (mus.modo === 'boss' && i % 2 === 1) hat(a, t, 0.012);
  }
  function agendar(){
    var a = ctx(); if (!a || !mus.ativa) return;
    var dur = mus.modo === 'boss' ? 0.11 : 0.15;
    if (mus.prox < a.currentTime) mus.prox = a.currentTime + 0.05;
    while (mus.prox < a.currentTime + 0.25) {
      if (ligado) tocarPasso(a, mus.prox, mus.passo, dur);
      mus.prox += dur; mus.passo = (mus.passo + 1) % 32;
    }
  }

  return {
    tocar: function(n, a){ if (T[n]) T[n](a); },
    alternar: function(){
      ligado = !ligado;
      try { localStorage.setItem('pv-mudo', ligado ? '0' : '1'); } catch (e) {}
      return ligado;
    },
    ligado: function(){ return ligado; },
    acordar: ctx,
    musica: {
      iniciar: function(modo){
        mus.modo = modo || 'normal';
        if (mus.ativa) return;
        var a = ctx(); if (!a) return;
        mus.ativa = true; mus.passo = 0; mus.prox = a.currentTime + 0.1;
        mus.timer = setInterval(agendar, 50);
      },
      parar: function(){ mus.ativa = false; if (mus.timer) { clearInterval(mus.timer); mus.timer = null; } },
      modo: function(m){ mus.modo = m; }
    }
  };
})();
