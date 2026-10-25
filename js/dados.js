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
    ['GIRE O CELULAR', 'ROTATE YOUR PHONE'], ['para jogar melhor', 'for a better experience'],
    ['CENTRAL DE INCIDENTES', 'INCIDENT CENTER'], ['INCIDENTE ', 'INCIDENT '], ['SLA estourado: ', 'SLA breached: '],
    ['PLANTÃO ENCERRADO', 'ON-CALL ENDED'], ['plantão iniciado', 'on-call started'], ['atenda os alertas antes do SLA', 'answer the alerts before the SLA'],
    ['resolvido em ', 'resolved in '], ['TOUR GUIADO', 'GUIDED TOUR'], ['toque ou aperte uma tecla para assumir o controle', 'tap or press a key to take control'],
    ['você assumiu o controle', 'you took control'], ['Tour concluído! Agora é com você: derrote o Bug Gigante', 'Tour complete! Now it is your turn: defeat the Giant Bug'],
    ['fim da linha! Há salas secretas escondidas: procure os blocos ? e !', 'end of the line! Secret rooms are hidden: look for the ? and ! blocks'],
    ['MUNDO IBM CLOUD', 'IBM CLOUD WORLD'], ['MUNDO AZURE', 'AZURE WORLD'], ['MUNDO ORACLE', 'ORACLE WORLD'], ['MUNDO AWS', 'AWS WORLD'], ['MUNDO GCP', 'GCP WORLD'],
    ['MESTRE MULTI-CLOUD', 'MULTI-CLOUD MASTER'], ['SELOS MULTI-CLOUD ', 'MULTI-CLOUD SEALS '], ['SELOS', 'SEALS'], ['os 5 selos coletados', 'all 5 seals collected'],
    ['monte a Landing Zone na ordem: 1 → 4', 'build the Landing Zone in order: 1 → 4'], ['monte a Landing Zone', 'build the Landing Zone'],
    ['LANDING ZONE PRONTA', 'LANDING ZONE READY'], ['todas as peças no lugar', 'every piece in place'], ['ordem errada: primeiro ', 'wrong order: first '], [' · próximo: ', ' · next: '],
    ['BLACK FRIDAY VENCIDA', 'BLACK FRIDAY SURVIVED'], ['todas as ondas', 'all waves cleared'], ['tráfego chegando', 'traffic incoming'], ['ONDA ', 'WAVE '],
    [' · tráfego ', ' · traffic '], [' · ajudantes ', ' · helpers '], ['Black Friday: pegue as instâncias EC2 para chamar ajudantes', 'Black Friday: grab EC2 instances to call helpers'],
    ['+ EC2 (ajudante)', '+ EC2 (helper)'], ['pipeline RAG', 'RAG pipeline'], ['RAG COMPLETO', 'RAG COMPLETE'], ['todos os trechos entregues', 'all chunks delivered'],
    ['trechos corrompidos!', 'chunks corrupted!'], [' · carregando ', ' · carrying '], ['trecho(s)', 'chunk(s)'],
    ['junte os trechos e leve ao altar Vertex AI; cuidado com as alucinações', 'gather the chunks and take them to the Vertex AI altar; beware of hallucinations'],
    ['janela de manutenção', 'maintenance window'], ['MANUTENÇÃO CONCLUÍDA', 'MAINTENANCE DONE'], ['tablespaces coletados', 'tablespaces collected'],
    ['as plataformas somem em ciclos: colete os tablespaces', 'platforms vanish in cycles: collect the tablespaces'],
    ['orçamento de erros', 'error budget'], ['ORÇAMENTO DE ERROS ', 'ERROR BUDGET '], ['dentro do orçamento de erros', 'within the error budget'], ['SLO CUMPRIDO', 'SLO MET'],
    ['SLO VIOLADO', 'SLO BREACHED'], ['recomeçando o percurso', 'restarting the course'], ['SRE: você tem 3 falhas de orçamento. Chegue ao SLO!', 'SRE: you have 3 failures of budget. Reach the SLO!'],
    ['falha! orçamento restante: ', 'failure! budget left: '], ['sala final', 'final room'],
    ['você dominou as 5 clouds! pegue os selos e saia pelo portal', 'you mastered all 5 clouds! grab the seals and take the portal'],
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
    { id: 'azure', pt: 'Landing Zone no ar', en: 'Landing Zone is live', dpt: 'Monte a Landing Zone no mundo Azure.', den: 'Build the Landing Zone in the Azure world.' },
    { id: 'aws', pt: 'Sobreviveu à Black Friday', en: 'Survived Black Friday', dpt: 'Vença as 3 ondas no mundo AWS.', den: 'Beat the 3 waves in the AWS world.' },
    { id: 'gcp', pt: 'RAG entregue', en: 'RAG delivered', dpt: 'Entregue todos os trechos no mundo GCP.', den: 'Deliver every chunk in the GCP world.' },
    { id: 'oracle', pt: 'Manutenção em dia', en: 'Maintenance on schedule', dpt: 'Colete os tablespaces no mundo Oracle.', den: 'Collect the tablespaces in the Oracle world.' },
    { id: 'ibm', pt: 'SLO cumprido', en: 'SLO met', dpt: 'Chegue ao SLO dentro do orçamento de erros (IBM Cloud).', den: 'Reach the SLO within the error budget (IBM Cloud).' },
    { id: 'multicloud', pt: 'Mestre Multi-Cloud', en: 'Multi-Cloud master', dpt: 'Complete os 5 mundos das clouds.', den: 'Complete all 5 cloud worlds.' },
    { id: 'plantao', pt: 'Plantonista', en: 'On-call engineer', dpt: 'Termine o plantão na Central de Incidentes.', den: 'Finish the shift in the Incident Center.' },
    { id: 'incidentes', pt: 'Plantão perfeito', en: 'Perfect on-call', dpt: 'Resolva os 6 alertas dentro do SLA.', den: 'Resolve all 6 alerts within the SLA.' },
    { id: 'finops', pt: 'FinOps em ação', en: 'FinOps in action', dpt: 'Derrote a fatura de cloud.', den: 'Defeat the cloud bill.' },
    { id: 'tour', pt: 'Turista', en: 'Tourist', dpt: 'Assista ao tour guiado até o fim.', den: 'Watch the guided tour to the end.' },
    { id: 'curriculo', pt: 'Recrutador atento', en: 'Attentive recruiter', dpt: 'Baixe o currículo em PDF.', den: 'Download the résumé PDF.' },
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
      pal: { D: '#1e293b', B: '#243044', b: '#141b2b', L: '#35d0e5', J: '#0f172a' } },
    { id: 'sre', pt: 'Plantonista SRE', en: 'SRE on-call', req: 'incidentes', oculos: false,
      pal: { B: '#8a1f2d', b: '#5c1420', L: '#ffcc00', J: '#222a3a', D: '#1a1a22' } },
    { id: 'cloud', pt: 'Arquiteto Cloud', en: 'Cloud architect', req: 'colecionador', oculos: true,
      pal: { B: '#e8eef7', b: '#aab8cf', L: '#1f6feb', J: '#34476f', D: '#2a2018' } },
    { id: 'espirito', pt: 'Espírito verde', en: 'Green spirit', req: 'tiro', oculos: false,
      pal: { B: '#2f9e44', b: '#1f6b2e', L: '#ffffff', J: '#1b2b4a', D: '#0b0b10' } },
    { id: 'dourado', pt: 'Campeão dourado', en: 'Golden champion', req: 'sem_morrer', oculos: false,
      pal: { B: '#e0a84f', b: '#a8741f', L: '#fff0c4', J: '#5a3d12', D: '#2a2018' } },
    { id: 'multicloud', pt: 'Multi-Cloud', en: 'Multi-Cloud', req: 'multicloud', oculos: false,
      pal: { B: '#0f62fe', b: '#0a3da8', L: '#ff9900', J: '#c74634', D: '#2a2018' } }
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

/* ---------- tour guiado: fala de cada fase ---------- */
PV.tour = [
  { pt: 'Oi! Eu sou o Leandro, Arquiteto Sênior DevOps e Multi-Cloud. Vou te mostrar meu portfólio. Pode soltar o controle!', en: 'Hi! I am Leandro, a Senior DevOps & Multi-Cloud Architect. Let me show you my portfolio. Sit back!' },
  { pt: 'Mais de 8 anos em infraestrutura crítica, 5 clouds e mais de 30 certificações. Hoje lidero a infraestrutura da plataforma de dados na VR Benefícios.', en: '8+ years in mission-critical infrastructure, 5 clouds and 30+ certifications. Today I lead the data platform infrastructure at VR Benefícios.' },
  { pt: 'No dia a dia: Azure, AWS, GCP, Terraform, Kubernetes, Databricks, DevSecOps e FinOps.', en: 'Day to day: Azure, AWS, GCP, Terraform, Kubernetes, Databricks, DevSecOps and FinOps.' },
  { pt: 'Comecei na docência e na coordenação de TI, passei pela Accenture e hoje atuo na VR Benefícios, além de lecionar na pós-graduação da Faculdade ESUDA.', en: 'I started in teaching and IT coordination, went through Accenture and now work at VR Benefícios, besides teaching postgraduate courses at Faculdade ESUDA.' },
  { pt: 'Nove projetos no GitHub: plataformas multi-cloud, DevSecOps, Databricks, FinOps e observabilidade com OpenTelemetry.', en: 'Nine projects on GitHub: multi-cloud platforms, DevSecOps, Databricks, FinOps and observability with OpenTelemetry.' },
  { pt: 'Um pipeline com segurança em cada etapa: build, test, scan e deploy.', en: 'A pipeline with security at every stage: build, test, scan and deploy.' },
  { pt: 'Microsoft, Databricks, AWS, Linux Foundation, Fortinet, OCI e Intel, com mais de 50 badges.', en: 'Microsoft, Databricks, AWS, Linux Foundation, Fortinet, OCI and Intel, with 50+ badges.' },
  { pt: 'Bacharel em Sistemas de Informação, MBA em Big Data, especializações em IA e Segurança da Informação e mestrado em andamento.', en: "Bachelor's in Information Systems, MBA in Big Data, specializations in AI and Information Security, and a master's in progress." },
  { pt: 'Foi um prazer! Fale comigo por e-mail, LinkedIn ou GitHub, ou baixe meu currículo. Agora é com você!', en: 'It was a pleasure! Reach me by email, LinkedIn or GitHub, or download my résumé. Now it is your turn!' }
];

/* ---------- contador de eventos (só funciona se o GoatCounter estiver ativo) ---------- */
PV.contar = function(nome){
  try { var g = window.goatcounter; if (g && g.count) g.count({ path: 'evento/' + nome, title: nome, event: true }); } catch (e) {}
};
