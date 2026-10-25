/* ==========================================================
   DADOS · idiomas, conquistas, skins e terminal secreto
   ========================================================== */
window.PV = window.PV || {};

/* ---------------- idiomas (PT padrão, EN opcional) ---------------- */
PV.i18n = (function(){
  'use strict';
  var lang = 'pt';
  try {
    var g = localStorage.getItem('pv-lang');
    if (g === 'pt' || g === 'en') lang = g;
    else lang = /^pt/i.test(navigator.language || 'pt') ? 'pt' : 'en';
  } catch (e) {}

  // textos do jogo escritos em PT; aqui ficam as traduções por trecho (os mais longos primeiro)
  var PARES = [
    ['FASE ', 'LEVEL '], ['checkpoint: fase ', 'checkpoint: level '],
    ['INÍCIO', 'START'], ['PERFIL', 'PROFILE'], ['ATUAÇÃO', 'EXPERTISE'], ['TRAJETÓRIA', 'CAREER'], ['PROJETOS', 'PROJECTS'],
    ['CERTIFICAÇÕES', 'CERTIFICATIONS'], ['FORMAÇÃO', 'EDUCATION'], ['CONTATO', 'CONTACT'], ['SALA SECRETA', 'SECRET ROOM'],
    ['← → andam · espaço pula', '← → move · space jumps'],
    ['espaço de novo no ar: pulo duplo', 'space again in the air: double jump'],
    ['X: Rei Gun · segure para carregar, solte para atirar', 'X: Spirit Gun · hold to charge, release to fire'],
    ['Shift: dash (derruba inimigos)', 'Shift: dash (knocks enemies out)'],
    ['o buraco no chão leva à próxima fase (', 'the hole in the floor leads to the next level ('],
    ['o buraco é ', 'the hole is '], ['pra esquerda ←', 'to the left ←'], ['pra direita →', 'to the right →'], ['logo ali', 'right there'],
    ['Skill nova: ', 'New skill: '], ['TROFÉUS', 'TROPHIES'], ['TROFÉU ', 'TROPHY '],
    ['+1 ♥  café', '+1 ♥  coffee'], ['+50  café', '+50  coffee'],
    ['FÚRIA!', 'RAGE!'], ['o bug ficou mais rápido', 'the bug got faster'],
    ['BUG GIGANTE DERROTADO', 'GIANT BUG DEFEATED'], ['BUG GIGANTE', 'GIANT BUG'],
    ['derrote o Bug Gigante: Rei Gun carregado, soco ou pisão', 'defeat the Giant Bug: charged Spirit Gun, punch or stomp'],
    ['P pausa · M som · X rei gun · Shift dash', 'P pause · M sound · X spirit gun · Shift dash'],
    ['PAUSA', 'PAUSED'],
    ['Setas andam · espaço pula (2× no ar) · ↓ desce, no ar dá soco · X Rei Gun · Shift dash.', 'Arrows move · space jumps (2× in the air) · ↓ drops, in the air it punches · X Spirit Gun · Shift dash.'],
    ['Continuar', 'Continue'], ['Sair do jogo', 'Quit game'], ['Sair', 'Quit'], ['Jogar de novo', 'Play again'], ['Jogar', 'Play'],
    ['FIM DE JOGO', 'THE END'], ['Você chegou ao contato. Obrigado por jogar!', 'You reached the contact level. Thanks for playing!'],
    ['PONTOS', 'SCORE'], ['TEMPO', 'TIME'], ['MORTES', 'DEATHS'], ['SEGREDO', 'SECRET'], ['achou', 'found'],
    ['seu nome', 'your name'], ['Salvar', 'Save'], ['Fechar', 'Close'],
    ['Ninguém no ranking ainda. Seja o primeiro!', 'Nobody on the ranking yet. Be the first!'],
    ['RANKING DE PONTOS', 'SCORE RANKING'], ['RANKING SPEEDRUN', 'SPEEDRUN RANKING'],
    ['Conquista: ', 'Achievement: '], ['Skin desbloqueada: ', 'Skin unlocked: '],
    ['CONQUISTAS', 'ACHIEVEMENTS'], ['bloqueada', 'locked'], ['Escolha seu personagem', 'Choose your character'],
    ['em uso', 'in use'], ['Usar', 'Use'], ['desbloqueie: ', 'unlock: '],
    ['ESCUDO', 'SHIELD'], ['escudo Terraform!', 'Terraform shield!'], ['o escudo absorveu o golpe!', 'the shield absorbed the hit!'],
    ['PIPELINE VERDE', 'GREEN PIPELINE'], ['todas as etapas passaram', 'all stages passed'],
    ['SALA DE SERVIDORES', 'SERVER ROOM'], ['saia pelo portal SAÍDA', 'leave through the EXIT portal'], ['SAÍDA', 'EXIT'],
    ['sem pausa no speedrun', 'no pausing in speedrun'], ['sem terminal no speedrun', 'no terminal in speedrun']
  ].sort(function(a, b){ return b[0].length - a[0].length; });

  var cache = {};
  function tr(s){
    if (lang !== 'en' || !s) return s;
    var c = cache[s]; if (c !== undefined) return c;
    var r = s;
    for (var i = 0; i < PARES.length; i++) if (r.indexOf(PARES[i][0]) >= 0) r = r.split(PARES[i][0]).join(PARES[i][1]);
    cache[s] = r; return r;
  }
  return {
    get lang(){ return lang; },
    tr: tr,
    t: function(o){ return o ? (o[lang] || o.pt) : ''; },
    set: function(l){
      lang = l === 'en' ? 'en' : 'pt'; cache = {};
      try { localStorage.setItem('pv-lang', lang); } catch (e) {}
    }
  };
})();

/* ---------------- conquistas ---------------- */
PV.conquistas = (function(){
  'use strict';
  var LISTA = [
    { id: 'combo5', pt: 'Combo x5', en: 'Combo x5', dpt: 'Derrote 5 inimigos sem tocar o chão.', den: 'Defeat 5 enemies without touching the ground.' },
    { id: 'dash', pt: 'Dash mortal', en: 'Deadly dash', dpt: 'Derrote um inimigo com o dash.', den: 'Defeat an enemy with the dash.' },
    { id: 'tiro', pt: 'Rei Gun!', en: 'Spirit Gun!', dpt: 'Dispare um Rei Gun carregado.', den: 'Fire a fully charged Spirit Gun.' },
    { id: 'segredo', pt: 'Achou a sala secreta', en: 'Found the secret room', dpt: 'Descubra o bloco secreto "?".', den: 'Discover the secret "?" block.' },
    { id: 'badges', pt: 'Colecionador de selos', en: 'Seal collector', dpt: 'Pegue os 9 selos da sala de servidores.', den: 'Grab all 9 seals in the server room.' },
    { id: 'pipeline', pt: 'Pipeline verde', en: 'Green pipeline', dpt: 'Passe pelas 4 etapas do pipeline.', den: 'Pass all 4 pipeline stages.' },
    { id: 'escudo', pt: 'Protegido pelo Terraform', en: 'Protected by Terraform', dpt: 'Pegue o escudo Terraform.', den: 'Pick up the Terraform shield.' },
    { id: 'colecionador', pt: 'Todas as skills', en: 'All skills', dpt: 'Colete as 6 skills.', den: 'Collect all 6 skills.' },
    { id: 'boss', pt: 'Caçador de bugs', en: 'Bug hunter', dpt: 'Derrote o Bug Gigante.', den: 'Defeat the Giant Bug.' },
    { id: 'terminal', pt: 'Hacker de terminal', en: 'Terminal hacker', dpt: 'Use o terminal secreto (tecla `).', den: 'Use the secret terminal (` key).' },
    { id: 'zerou', pt: 'Zerou o jogo', en: 'Beat the game', dpt: 'Chegue ao fim do jogo.', den: 'Reach the end of the game.' },
    { id: 'sem_morrer', pt: 'Zerou sem morrer', en: 'No-death run', dpt: 'Termine o jogo sem morrer nenhuma vez.', den: 'Finish the game without dying.' },
    { id: 'speedrun', pt: 'Velocista', en: 'Speedrunner', dpt: 'Termine o speedrun em menos de 5 minutos.', den: 'Finish the speedrun in under 5 minutes.' }
  ];
  var tem = {};
  try { tem = JSON.parse(localStorage.getItem('pv-conq') || '{}') || {}; } catch (e) { tem = {}; }
  return {
    lista: LISTA,
    tem: function(id){ return !!tem[id]; },
    achar: function(id){ for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i]; return null; },
    desbloquear: function(id){
      if (tem[id]) return false;
      tem[id] = 1;
      try { localStorage.setItem('pv-conq', JSON.stringify(tem)); } catch (e) {}
      return true;
    },
    total: function(){ var n = 0; for (var k in tem) if (tem[k]) n++; return n; }
  };
})();

/* ---------------- skins ---------------- */
PV.skins = (function(){
  'use strict';
  var LISTA = [
    { id: 'padrao', pt: 'Padrão', en: 'Default', req: null, oculos: false, pal: {} },
    { id: 'professor', pt: 'Professor', en: 'Professor', req: 'zerou', oculos: true,
      pal: { B: '#7b8394', b: '#5a6170', L: '#c2265a', J: '#2a2f3b', D: '#4a4f5c' } },
    { id: 'devops', pt: 'DevOps (capuz)', en: 'DevOps (hoodie)', req: 'pipeline', oculos: false,
      pal: { D: '#1e293b', B: '#243044', b: '#141b2b', L: '#35d0e5', J: '#0f172a' } }
  ];
  var atual = 'padrao';
  try { atual = localStorage.getItem('pv-skin') || 'padrao'; } catch (e) {}
  function achar(id){ for (var i = 0; i < LISTA.length; i++) if (LISTA[i].id === id) return LISTA[i]; return LISTA[0]; }
  function liberada(s){ return !s.req || PV.conquistas.tem(s.req); }
  return {
    lista: LISTA,
    liberada: liberada,
    atual: function(){ var s = achar(atual); return liberada(s) ? s : LISTA[0]; },
    usar: function(id){
      var s = achar(id); if (!liberada(s)) return false;
      atual = s.id; try { localStorage.setItem('pv-skin', atual); } catch (e) {}
      return true;
    }
  };
})();

/* ---------------- terminal secreto ---------------- */
PV.terminal = (function(){
  'use strict';
  var SKILLS = [['Azure', 95], ['Azure DevOps', 93], ['Terraform', 92], ['Docker', 90], ['Databricks', 90], ['FinOps', 90], ['Kubernetes', 88],
    ['GitHub Actions', 85], ['DevSecOps', 85], ['Azure Data Factory', 85], ['Cloud Security', 85], ['Dynatrace', 85], ['AWS', 82], ['Zero Trust', 82],
    ['Jenkins', 80], ['S3', 80], ['Datadog', 80], ['Fortinet NSE', 78], ['Helm', 75], ['Redshift', 75], ['OpenTelemetry', 75], ['ArgoCD', 70],
    ['GCP', 68], ['Oracle Cloud', 60]];
  var CERTS = ['AZ-400', 'AZ-305', 'AZ-104', 'Databricks Platform Architect', 'Databricks GenAI Fundamentals', 'AWS SAA-C02', 'AWS Cloud Practitioner',
    'GCP DevOps (in progress)', 'Fortinet NSE', 'Linux Foundation DevSecOps', 'Linux Foundation GitOps', 'Linux Foundation Zero Trust', 'OCI Foundations',
    'Intel CloudDevOps', 'Intel FinOps'];
  var PROJ = ['genai-platform-gcp', 'gcp-azure-devops-platform', 'terraform-multicloud-infra', 'devsecops-pipeline-suite', 'databricks-lakehouse-platform',
    'finops-cloud-optimizer', 'harness-platform-complete-demo', 'opentelemetry-sre-platform', 'databricks-ml-platform-three-clouds'];
  function pad(s, n){ s = String(s); while (s.length < n) s += ' '; return s; }

  var AJUDA = {
    pt: ['comandos disponíveis:', '  kubectl get skills      lista minhas habilidades', '  kubectl get certs       lista as certificações',
         '  kubectl get projects    lista os projetos do GitHub', '  kubectl get pods        status do portfólio', '  terraform plan          o que acontece se me contratar',
         '  whoami                  quem sou eu', '  cat contact             como falar comigo', '  clear                   limpa a tela', '  exit                    fecha o terminal'],
    en: ['available commands:', '  kubectl get skills      list my skills', '  kubectl get certs       list certifications',
         '  kubectl get projects    list GitHub projects', '  kubectl get pods        portfolio status', '  terraform plan          what happens if you hire me',
         '  whoami                  who I am', '  cat contact             how to reach me', '  clear                   clear the screen', '  exit                    close the terminal']
  };

  function run(entrada, lang){
    var c = String(entrada || '').trim().toLowerCase().replace(/\s+/g, ' ');
    var en = lang === 'en';
    if (!c) return { l: [] };
    if (c === 'help' || c === 'ajuda' || c === '?') return { l: AJUDA[lang] || AJUDA.pt };
    if (c === 'clear' || c === 'cls') return { l: [], limpar: true };
    if (c === 'exit' || c === 'quit' || c === 'sair') return { l: [], sair: true };
    if (c === 'whoami') return { l: ['leandro-oliveira-moraes', en ? 'Senior DevOps & Multi-Cloud Architect · VR Benefícios · Faculdade ESUDA' : 'Arquiteto Sênior DevOps & Multi-Cloud · VR Benefícios · Faculdade ESUDA'] };
    if (c === 'cat contact' || c === 'contact') return { l: ['email:    leandro.moraes.devops@gmail.com', 'linkedin: linkedin.com/in/leandro-oliveira-26b14768', 'github:   github.com/leandroninja', 'phone:    (81) 99637-7099'] };
    if (c === 'kubectl get skills' || c === 'kubectl get skill') {
      var l = [pad('NAME', 22) + pad('STATUS', 10) + 'LEVEL'];
      SKILLS.forEach(function(s){ l.push(pad(s[0], 22) + pad('Running', 10) + s[1] + '%'); });
      return { l: l, conq: true };
    }
    if (c === 'kubectl get certs' || c === 'kubectl get certifications') {
      var l2 = [pad('NAME', 34) + 'STATUS'];
      CERTS.forEach(function(s){ l2.push(pad(s, 34) + (/progress/.test(s) ? 'Pending' : 'Certified')); });
      return { l: l2, conq: true };
    }
    if (c === 'kubectl get projects' || c === 'kubectl get repos') {
      var l3 = [pad('REPO', 40) + 'STATUS'];
      PROJ.forEach(function(s){ l3.push(pad(s, 40) + 'Deployed'); });
      l3.push(en ? '→ github.com/leandroninja' : '→ github.com/leandroninja');
      return { l: l3, conq: true };
    }
    if (c === 'kubectl get pods') return { l: [pad('NAME', 24) + pad('READY', 8) + pad('STATUS', 10) + 'RESTARTS', pad('portfolio-leandro-1', 24) + pad('1/1', 8) + pad('Running', 10) + '0'], conq: true };
    if (c === 'terraform plan') return { l: ['Terraform will perform the following actions:', '', '  + resource "team_member" "leandro" {', '      role   = "Senior DevOps & Multi-Cloud Architect"', '      status = "ready_to_deploy"', '    }', '', 'Plan: 1 to add, 0 to change, 0 to destroy.', en ? '(approval: your call. contact is one command away: cat contact)' : '(aprovação: com você. o contato está a um comando: cat contact)'] };
    if (c === 'terraform apply') return { l: [en ? 'Apply complete! Resources: 1 added. Welcome aboard.' : 'Apply complete! Resources: 1 added. Bem-vindo(a) a bordo.'] };
    if (/^sudo/.test(c)) return { l: [en ? 'nice try. this incident will be reported.' : 'boa tentativa. este incidente será reportado.'] };
    if (c === 'ls') return { l: ['skills/  certs/  projects/  contact.txt  secret-room/'] };
    if (c === 'ls secret-room' || c === 'cd secret-room') return { l: [en ? 'tip: find the golden "?" block above the badges line in the Certifications level.' : 'dica: ache o bloco "?" dourado acima da linha de badges na fase de Certificações.'] };
    return { l: ['bash: ' + c.split(' ')[0] + ': command not found', en ? "type 'help' to see the commands" : "digite 'help' para ver os comandos"] };
  }
  return { run: run, ajuda: function(lang){ return AJUDA[lang] || AJUDA.pt; } };
})();
