// Dados dos fluxogramas — carregado antes de app.js.
// Usamos JS (em vez de fetch de JSON) para funcionar aberto direto via file://.
window.FLUXOGRAMAS = {
  catalogo: [
    {
      id: "dpf",
      nome: "Destituição do Poder Familiar",
      fundamentos: [
        { id: "rito-geral", nome: "Rito geral — ECA arts. 155 a 163", fluxo: "dpf-rito-geral" }
      ]
    },
    {
      id: "acolhimento",
      nome: "Acolhimento Institucional",
      fundamentos: [
        { id: "rito-geral", nome: "Rito geral — ECA arts. 90 a 101 e 19", fluxo: "acolhimento-rito-geral" }
      ]
    },
    {
      id: "renuncia",
      nome: "Renúncia do Poder Familiar",
      fundamentos: [
        { id: "entrega", nome: "Entrega voluntária — ECA art. 19-A", fluxo: "renuncia-entrega-voluntaria" }
      ]
    }
  ],

  fluxos: {
    "dpf-rito-geral": {
      id: "dpf-rito-geral",
      processo: "Destituição do Poder Familiar",
      fundamento: "Rito geral — ECA arts. 155 a 163",
      base_legal: ["ECA arts. 155–163", "CC art. 1.638", "ECA arts. 22 e 24"],
      etapas: [
        { id: "inicial", titulo: "Petição inicial", tipo: "acao", artigo: "ECA arts. 155 e 156", prazo: null, responsavel: "MP ou interessado", obs: "Ação proposta pelo Ministério Público ou por quem tenha legítimo interesse." },
        { id: "liminar", titulo: "Suspensão do poder familiar?", tipo: "decisao", artigo: "ECA art. 157", prazo: null, responsavel: "Juiz", obs: "Pode ser deferida liminar ou incidentalmente, se houver grave risco à criança ou ao adolescente." },
        { id: "estudo", titulo: "Estudo social / perícia", tipo: "acao", artigo: "ECA art. 161, §1º", prazo: null, responsavel: "Equipe interprofissional", obs: "Avaliação por equipe interprofissional ou por peritos nomeados." },
        { id: "citacao", titulo: "Citação", tipo: "prazo", artigo: "ECA art. 158", prazo: "10 dias para resposta", responsavel: "Juiz / oficial de justiça", obs: "O requerido é citado para, no prazo de 10 dias, oferecer resposta escrita." },
        { id: "resposta", titulo: "Houve resposta?", tipo: "decisao", artigo: "ECA art. 161", prazo: null, responsavel: "Juiz", obs: "Com ou sem resposta, abre-se vista ao Ministério Público." },
        { id: "mp5", titulo: "Vista ao MP (revelia)", tipo: "prazo", artigo: "ECA art. 161", prazo: "5 dias", responsavel: "Ministério Público", obs: "Sem resposta: vista ao MP por 5 dias e decisão." },
        { id: "mpaudiencia", titulo: "Vista ao MP", tipo: "acao", artigo: "ECA art. 162", prazo: null, responsavel: "Ministério Público", obs: "Com resposta: vista ao MP e designação de audiência." },
        { id: "oitiva", titulo: "Oitiva dos pais", tipo: "acao", artigo: "ECA art. 161, §4º", prazo: null, responsavel: "Juiz", obs: "Oitiva dos pais, se identificados e localizados." },
        { id: "audiencia", titulo: "Audiência de instrução e julgamento", tipo: "acao", artigo: "ECA art. 162", prazo: null, responsavel: "Juiz", obs: "Produção de provas e instrução do feito." },
        { id: "sentenca", titulo: "Sentença", tipo: "decisao", artigo: "ECA art. 163", prazo: "procedimento em até 120 dias", responsavel: "Juiz", obs: "Procedimento concluído no prazo máximo de 120 dias." },
        { id: "averbacao", titulo: "Averbação no registro", tipo: "acao", artigo: "ECA art. 163, parágrafo único", prazo: null, responsavel: "Cartório", obs: "A sentença de destituição é averbada à margem do registro de nascimento." },
        { id: "recurso", titulo: "Recursos", tipo: "prazo", artigo: "ECA arts. 198 e 199-A a 199-E", prazo: "10 dias", responsavel: "Partes / MP", obs: "Recursos em face da sentença." }
      ],
      ligacoes: [
        { de: "inicial", para: "liminar" },
        { de: "liminar", para: "estudo" },
        { de: "estudo", para: "citacao" },
        { de: "citacao", para: "resposta" },
        { de: "resposta", para: "mp5", rotulo: "não" },
        { de: "resposta", para: "mpaudiencia", rotulo: "sim" },
        { de: "mp5", para: "sentenca" },
        { de: "mpaudiencia", para: "oitiva" },
        { de: "oitiva", para: "audiencia" },
        { de: "audiencia", para: "sentenca" },
        { de: "sentenca", para: "averbacao" },
        { de: "averbacao", para: "recurso" }
      ],
      fontes: ["Lei 8.069/1990 (ECA)", "Lei 10.406/2002 (Código Civil)"],
      revisado_por: "",
      revisado_em: ""
    },

    "acolhimento-rito-geral": {
      id: "acolhimento-rito-geral",
      processo: "Acolhimento Institucional",
      fundamento: "Rito geral — ECA arts. 90 a 101 e 19",
      base_legal: ["ECA arts. 98, 101 e 19", "Lei 13.509/2017"],
      etapas: [
        { id: "risco", titulo: "Ameaça ou violação de direitos", tipo: "decisao", artigo: "ECA art. 98", prazo: null, responsavel: "Conselho Tutelar / MP / Juiz", obs: "Situação de risco que autoriza a medida protetiva." },
        { id: "medida", titulo: "Medida protetiva de acolhimento", tipo: "acao", artigo: "ECA art. 101, VII", prazo: null, responsavel: "Juiz", obs: "O acolhimento institucional é uma das medidas protetivas previstas." },
        { id: "afastamento", titulo: "Afastamento do convívio familiar", tipo: "decisao", artigo: "ECA art. 101, §§1º e 2º", prazo: null, responsavel: "Juiz", obs: "Decisão fundamentada, ouvido o Ministério Público." },
        { id: "comunicacao", titulo: "Comunicação ao MP", tipo: "acao", artigo: "ECA art. 93, parágrafo único", prazo: null, responsavel: "Juiz / unidade", obs: "Comunicação imediata da medida ao Ministério Público." },
        { id: "guia", titulo: "Guia de acolhimento", tipo: "acao", artigo: "ECA art. 101, §3º", prazo: null, responsavel: "Autoridade judiciária", obs: "Elaboração da guia de acolhimento." },
        { id: "pia", titulo: "Plano Individual de Atendimento (PIA)", tipo: "prazo", artigo: "ECA art. 101, §§4º a 6º", prazo: "15 dias", responsavel: "Equipe interprofissional", obs: "Elaborado no prazo de 15 dias." },
        { id: "reavaliacao", titulo: "Reavaliação da situação", tipo: "prazo", artigo: "ECA art. 19, §1º", prazo: "a cada 3 meses", responsavel: "Equipe / Juiz", obs: "Reavaliação periódica da possibilidade de reintegração familiar." },
        { id: "reintegracao", titulo: "Possível reintegração familiar?", tipo: "decisao", artigo: "ECA art. 19, §3º", prazo: null, responsavel: "Juiz", obs: "Prioridade de reintegração à família de origem ou extensa." },
        { id: "familia", titulo: "Reintegração familiar", tipo: "fim", artigo: "ECA art. 19, §3º", prazo: null, responsavel: "Equipe", obs: "Acompanhamento após o retorno à família." },
        { id: "prazo18", titulo: "Prazo máximo de acolhimento", tipo: "prazo", artigo: "ECA art. 19, §2º", prazo: "18 meses", responsavel: "Equipe / Juiz", obs: "Prazo máximo de 18 meses (Lei 13.509/2017)." },
        { id: "substituta", titulo: "Família substituta / destituição", tipo: "acao", artigo: "ECA arts. 101, §§7º e 8º; 155", prazo: null, responsavel: "Juiz / MP", obs: "Colocação em família substituta ou destituição do poder familiar." }
      ],
      ligacoes: [
        { de: "risco", para: "medida" },
        { de: "medida", para: "afastamento" },
        { de: "afastamento", para: "comunicacao" },
        { de: "comunicacao", para: "guia" },
        { de: "guia", para: "pia" },
        { de: "pia", para: "reavaliacao" },
        { de: "reavaliacao", para: "reintegracao" },
        { de: "reintegracao", para: "familia", rotulo: "sim" },
        { de: "reintegracao", para: "prazo18", rotulo: "não" },
        { de: "prazo18", para: "substituta" }
      ],
      fontes: ["Lei 8.069/1990 (ECA)", "Lei 13.509/2017"],
      revisado_por: "",
      revisado_em: ""
    },

    "renuncia-entrega-voluntaria": {
      id: "renuncia-entrega-voluntaria",
      processo: "Renúncia do Poder Familiar",
      fundamento: "Entrega voluntária — ECA art. 19-A",
      base_legal: ["ECA art. 19-A", "ECA arts. 155–163", "Lei 13.509/2017"],
      etapas: [
        { id: "manifestacao", titulo: "Manifestação de entrega p/ adoção", tipo: "acao", artigo: "ECA art. 19-A, caput", prazo: null, responsavel: "Gestante ou genitor", obs: "Manifestação livre de entrega do filho para adoção." },
        { id: "encaminhamento", titulo: "Encaminhamento à Justiça da Infância", tipo: "acao", artigo: "ECA art. 19-A, §1º", prazo: null, responsavel: "Serviço de saúde / assistência", obs: "Sem constrangimento e com garantia de sigilo." },
        { id: "audiencia", titulo: "Audiência (equipe + MP)", tipo: "acao", artigo: "ECA art. 19-A, §§4º, 8º e 9º", prazo: null, responsavel: "Juiz", obs: "Oitiva da gestante/mãe com equipe interprofissional e Ministério Público." },
        { id: "familia_extensa", titulo: "Busca na família extensa", tipo: "acao", artigo: "ECA art. 19-A, §3º; art. 25", prazo: null, responsavel: "Equipe interprofissional", obs: "Verificação de parentes com vínculo de afinidade e afetividade." },
        { id: "renuncia_formal", titulo: "Homologação da renúncia", tipo: "decisao", artigo: "ECA art. 19-A, §5º", prazo: null, responsavel: "Juiz", obs: "Consentimento livre e informado, com assistência do Ministério Público." },
        { id: "acolhimento", titulo: "Acolhimento (se necessário)", tipo: "acao", artigo: "ECA art. 19-A, §6º; art. 101", prazo: null, responsavel: "Juiz", obs: "Acolhimento institucional ou familiar durante o processo." },
        { id: "destituicao", titulo: "Ação de destituição do poder familiar", tipo: "acao", artigo: "ECA arts. 155 a 163", prazo: null, responsavel: "MP", obs: "Ajuizamento da ação para formalizar a destituição." },
        { id: "sentenca", titulo: "Sentença de destituição", tipo: "decisao", artigo: "ECA art. 163", prazo: "procedimento em até 120 dias", responsavel: "Juiz", obs: "Sentença que decreta a perda do poder familiar." },
        { id: "cadastro", titulo: "Inclusão no cadastro de adoção", tipo: "acao", artigo: "ECA arts. 19-A, §10; 50", prazo: null, responsavel: "Juiz", obs: "Criança/adolescente apto à colocação em família substituta." },
        { id: "adocao", titulo: "Colocação em família substituta", tipo: "fim", artigo: "ECA arts. 39 e seguintes", prazo: null, responsavel: "Juiz", obs: "Adoção ou guarda, conforme o caso." }
      ],
      ligacoes: [
        { de: "manifestacao", para: "encaminhamento" },
        { de: "encaminhamento", para: "audiencia" },
        { de: "audiencia", para: "familia_extensa" },
        { de: "familia_extensa", para: "renuncia_formal" },
        { de: "renuncia_formal", para: "acolhimento" },
        { de: "acolhimento", para: "destituicao" },
        { de: "destituicao", para: "sentenca" },
        { de: "sentenca", para: "cadastro" },
        { de: "cadastro", para: "adocao" }
      ],
      fontes: ["Lei 8.069/1990 (ECA)", "Lei 13.509/2017"],
      revisado_por: "",
      revisado_em: ""
    }
  }
};
