(function (root) {
  "use strict";
  const concepts = [
    {
      name: "Formalização",
      description:
        "Procedimentos e registros escritos tornam as decisões verificáveis e previsíveis. Um pedido precisa dos dados e formulários exigidos.",
      example: "Preencher o requerimento antes de recolher assinaturas.",
    },
    {
      name: "Hierarquia",
      description:
        "Os cargos se organizam em níveis de autoridade e supervisão. Cada decisão deve respeitar as competências e o fluxo definido.",
      example: "Obter a conferência do supervisor antes da análise gerencial.",
    },
    {
      name: "Divisão do trabalho",
      description:
        "As tarefas são distribuídas entre cargos e setores, com responsabilidades definidas.",
      example: "Encaminhar a análise de orçamento ao setor financeiro.",
    },
    {
      name: "Impessoalidade",
      description:
        "As regras se aplicam de forma objetiva. Amizade e preferências pessoais não substituem critérios institucionais.",
      example: "Respeitar a fila de análise mesmo conhecendo a diretora.",
    },
    {
      name: "Especialização",
      description:
        "A atuação em cada função exige conhecimentos e competências adequados à tarefa.",
      example:
        "Solicitar a análise das cláusulas a quem tem competência jurídica.",
    },
    {
      name: "Autoridade racional-legal",
      description:
        "A autoridade decorre das normas e do cargo, dentro de limites definidos, e não apenas do prestígio pessoal.",
      example:
        "A aprovação final cabe à direção-geral ou a quem tenha delegação formal válida.",
    },
  ];
  const stages = [
    {
      role: "Protocolo",
      person: "Ana",
      color: "#be7751",
      title: "Inicie o requerimento",
      objective:
        "Converse com Ana no Protocolo e registre o pedido de compra de computadores.",
      question:
        "Bem-vindo! Para comprar cinco computadores, precisamos abrir o requerimento. Qual é a melhor forma de iniciar?",
      choices: [
        "Registrar finalidade, quantidade e justificativa no formulário oficial.",
        "Enviar somente um recado de voz: todo mundo já sabe do que precisamos.",
        "Pedir a assinatura e preencher os dados depois.",
      ],
      correct: 0,
      success:
        "Requerimento 001 registrado. A supervisão pode conferir seu pedido.",
      mistake:
        "Sem os dados obrigatórios, o pedido não pode ser conferido. O registro escrito permite verificar o que foi solicitado.",
      signature: "Ana · Registro conferido",
    },
    {
      role: "Supervisão",
      person: "Bruno",
      color: "#5c86a0",
      title: "Respeite o fluxo",
      objective:
        "Leve o requerimento à Supervisão para conferir a primeira etapa.",
      question:
        "O formulário está completo. Um colega sugere ir direto à direção-geral para ganhar tempo. Como você procede?",
      choices: [
        "Pular a gerência, porque o pedido parece urgente.",
        "Pedir que qualquer colega assine pela gerência.",
        "Obter a conferência da supervisão e seguir para a gerência.",
      ],
      correct: 2,
      success:
        "Conferência concluída. Encaminhe o pedido à gerência para a análise de orçamento.",
      mistake:
        "A urgência não elimina as competências dos cargos. Neste fluxo, a supervisão precisa conferir o pedido antes da gerência.",
      signature: "Bruno · Conferência inicial",
    },
    {
      role: "Gerência",
      person: "Carla",
      color: "#9a785c",
      title: "Encontre a função certa",
      objective:
        "Procure Carla na Gerência para encaminhar a análise financeira.",
      question:
        "A compra precisa de uma análise de disponibilidade orçamentária. Qual setor deve executar essa tarefa?",
      choices: [
        "O Jurídico, porque pode decidir sobre qualquer assunto.",
        "O Financeiro, responsável pela análise do orçamento.",
        "A Recepção, porque é o primeiro setor do escritório.",
      ],
      correct: 1,
      success:
        "A gerência recebeu o parecer financeiro: há orçamento. A direção pode analisar a prioridade do pedido.",
      mistake:
        "A análise de orçamento é uma responsabilidade do Financeiro. Distribuir tarefas por função evita sobreposição e encaminhamentos errados.",
      signature: "Carla · Orçamento validado",
    },
    {
      role: "Diretoria",
      person: "Diego",
      color: "#6a8d68",
      title: "Escolha sem favoritismo",
      objective:
        "Converse com Diego na Diretoria e respeite os critérios de atendimento.",
      question:
        "Diego é seu amigo e oferece colocar seu pedido na frente de solicitações mais antigas, sem critério previsto. O que você faz?",
      choices: [
        "Aceitar: amizades devem facilitar a aprovação.",
        "Usar o nome de Diego para pressionar os outros setores.",
        "Seguir a ordem de análise e os critérios institucionais.",
      ],
      correct: 2,
      success:
        "Seu pedido foi analisado conforme os critérios da organização. Siga para a análise jurídica.",
      mistake:
        "Uma relação pessoal não justifica preferência. Prioridades podem existir, mas precisam seguir critérios institucionais.",
      signature: "Diego · Prioridade analisada",
    },
    {
      role: "Jurídico",
      person: "Elisa",
      color: "#9675a3",
      title: "Busque a competência",
      objective:
        "Leve a minuta da compra ao Jurídico para análise especializada.",
      question:
        "Elisa está em reunião. Uma cláusula do contrato precisa ser analisada. Um colega sem formação na área se oferece para assinar. Qual saída é adequada?",
      choices: [
        "Consultar o profissional habilitado e formalmente designado para substituir Elisa.",
        "Aceitar a assinatura do colega, pois ele já trabalha aqui há muito tempo.",
        "Ignorar a análise da cláusula para não atrasar o processo.",
      ],
      correct: 0,
      success:
        "A substituta habilitada e designada conferiu as cláusulas e registrou o parecer. O pedido pode seguir para aprovação final.",
      mistake:
        "Tempo de serviço não substitui competência técnica. Uma análise especializada exige um profissional habilitado e designado.",
      signature: "Jurídico · Parecer registrado",
    },
    {
      role: "Direção-geral",
      person: "Felipe",
      color: "#4c7c7c",
      title: "Conclua a aprovação",
      objective: "Apresente o documento completo a Felipe na Direção-geral.",
      question:
        "Todas as análises estão prontas. Um fundador aposentado visita a empresa e oferece a aprovação final. Quem pode aprovar segundo as regras deste pedido?",
      choices: [
        "O fundador aposentado, por ser a pessoa mais respeitada.",
        "A direção-geral ou uma pessoa com delegação formal válida para essa decisão.",
        "Qualquer pessoa que tenha participado das etapas anteriores.",
      ],
      correct: 1,
      success:
        "Compra aprovada! Você completou o fluxo com registros, responsabilidades e autoridade definidos.",
      mistake:
        "Prestígio pessoal não confere automaticamente autoridade. A competência para decidir deve estar prevista nas normas ou em delegação válida.",
      signature: "Felipe · Aprovação final",
    },
  ];
  const events = [
    {
      id: "offline",
      title: "O sistema saiu do ar",
      tag: "FALHA OPERACIONAL",
      description:
        "O servidor de protocolo caiu. O registro existe, mas os próximos setores precisam de uma cópia verificável. A contingência da NetFeliz permite tramitação manual numerada.",
      target: 0,
      task: "Recupere a cópia do requerimento no Protocolo.",
      choices: [
        {
          label: "Ativar o protocolo manual e juntar a cópia numerada.",
          cost: 1,
        },
        {
          label: "Aguardar a recuperação do servidor e emitir a cópia digital.",
          cost: 3,
        },
        {
          label: "Recriar o pedido de memória, sem conferir o registro.",
          wrong: true,
        },
      ],
      question:
        "Ana encontrou a cópia. Qual conferência permite retomar a tramitação?",
      checks: [
        "Número, dados e registro da contingência correspondem ao pedido original.",
        "A cópia tem uma aparência profissional.",
        "Basta escrever “urgente” no cabeçalho.",
      ],
      correct: 0,
      resolution:
        "Cópia autenticada internamente e anexada. O fluxo pode continuar.",
    },
    {
      id: "demand",
      title: "A equipe cresceu",
      tag: "MUDANÇA DE ESCOPO",
      description:
        "Duas pessoas entrarão na equipe. Agora são necessários sete computadores. A solicitação antiga prevê cinco; o orçamento ainda será analisado.",
      target: 0,
      task: "Retorne ao Protocolo para atualizar a quantidade e a justificativa.",
      choices: [
        {
          label:
            "Registrar uma revisão para sete computadores e justificar a nova demanda.",
          cost: 1,
        },
        {
          label:
            "Reunir primeiro os dados das novas vagas e registrar a revisão completa.",
          cost: 2,
        },
        {
          label:
            "Alterar apenas a quantidade, mantendo a versão antiga do documento.",
          wrong: true,
        },
      ],
      question: "O que precisa constar na revisão antes da análise financeira?",
      checks: [
        "Apenas o total final, sem histórico.",
        "Sete unidades, justificativa e identificação da nova versão.",
        "A promessa verbal de que a equipe vai crescer.",
      ],
      correct: 1,
      resolution:
        "Escopo atualizado: sete computadores. As próximas análises usarão a nova versão.",
      effect: "quantity",
    },
    {
      id: "budget",
      title: "O orçamento encolheu",
      tag: "CORTE DE VERBA",
      description:
        "Uma despesa emergencial reduziu em 20% a verba disponível. O parecer anterior precisa ser revisto antes da compra. A quantidade solicitada deve ser mantida.",
      target: 2,
      task: "Volte à Gerência para revalidar o orçamento com o Financeiro.",
      choices: [
        {
          label:
            "Comparar modelos mais econômicos que atendam às especificações mínimas.",
          cost: 1,
        },
        {
          label:
            "Solicitar uma suplementação formal de verba, com análise adicional.",
          cost: 3,
        },
        {
          label: "Usar o parecer antigo e deixar a diferença para depois.",
          wrong: true,
        },
      ],
      question: "Qual evidência substitui o parecer financeiro anterior?",
      checks: [
        "A confirmação informal de um colega.",
        "A cotação antiga com a data corrigida.",
        "Uma análise atualizada de custo, requisitos e verba disponível.",
      ],
      correct: 2,
      resolution:
        "Novo parecer financeiro anexado. A compra volta a caber no orçamento autorizado.",
    },
    {
      id: "priority",
      title: "Uma urgência entrou na fila",
      tag: "REPLANEJAMENTO",
      description:
        "O atendimento ao público ficou sem computadores. Há uma regra interna de prioridade para serviços interrompidos. A Diretoria pede evidências antes de reorganizar os pedidos.",
      target: 3,
      task: "Leve a justificativa de prioridade à Diretoria.",
      choices: [
        {
          label:
            "Documentar o impacto no serviço e aplicar o critério de prioridade previsto.",
          cost: 1,
        },
        {
          label: "Manter a posição atual e aguardar a análise ordinária.",
          cost: 3,
        },
        {
          label:
            "Pedir a Diego para adiantar o processo porque vocês são amigos.",
          wrong: true,
        },
      ],
      question: "Como a Diretoria deve registrar a decisão sobre a fila?",
      checks: [
        "Identificando o impacto e o critério institucional aplicado.",
        "Escrevendo apenas “a pedido de um amigo”.",
        "Retirando os registros dos outros pedidos.",
      ],
      correct: 0,
      resolution:
        "Prioridade analisada com critérios objetivos. O novo encaminhamento foi registrado.",
    },
    {
      id: "supplier",
      title: "O fornecedor desistiu",
      tag: "TROCA DE FORNECEDOR",
      description:
        "Depois do parecer jurídico, o fornecedor informou que não poderá entregar. Uma alternativa está disponível, mas o contrato e as condições de entrega mudaram.",
      target: 4,
      task: "Retorne ao Jurídico para revisar a minuta do novo fornecedor.",
      choices: [
        {
          label:
            "Conferir a alternativa habilitada e submeter as novas cláusulas ao Jurídico.",
          cost: 2,
        },
        {
          label:
            "Reabrir a comparação de fornecedores antes de revisar a minuta.",
          cost: 3,
        },
        {
          label: "Trocar o nome do fornecedor e aproveitar o parecer antigo.",
          wrong: true,
        },
      ],
      question: "Qual documento deve acompanhar a aprovação final?",
      checks: [
        "O contrato anterior com uma anotação informal.",
        "A nova minuta e o parecer sobre suas condições de entrega e contratação.",
        "Somente o contato do novo vendedor.",
      ],
      correct: 1,
      resolution:
        "Fornecedor substituto e nova minuta conferidos. A aprovação usará as condições revisadas.",
      effect: "supplier",
    },
    {
      id: "delegation",
      title: "A direção precisou viajar",
      tag: "AUSÊNCIA INESPERADA",
      description:
        "Felipe saiu para uma reunião externa. Há uma delegação formal registrada, mas você precisa conferir o substituto, a validade e o limite de valor antes da decisão final.",
      target: 1,
      task: "Consulte a Supervisão para validar a delegação da direção.",
      choices: [
        {
          label:
            "Solicitar a conferência da delegação e encaminhar ao substituto competente.",
          cost: 1,
        },
        {
          label:
            "Aguardar o retorno de Felipe para manter o encaminhamento original.",
          cost: 3,
        },
        {
          label: "Entregar a aprovação à pessoa com mais tempo de empresa.",
          wrong: true,
        },
      ],
      question: "Bruno trouxe o registro. O que deve ser validado?",
      checks: [
        "A popularidade do substituto entre os colegas.",
        "Somente a assinatura de quem imprimiu o registro.",
        "Cargo, validade, limites e competência para esta decisão.",
      ],
      correct: 2,
      resolution:
        "Competência conferida. O encaminhamento final está regularizado.",
    },
  ];
  const modes = {
    classic: { label: "Tranquilo", limit: 0 },
    normal: { label: "Desafiador", limit: 18 },
    intense: { label: "Sob pressão", limit: 13 },
  };
  function fresh(options = {}) {
    const mode = Object.hasOwn(modes, options.mode) ? options.mode : "normal";
    const random = options.random || Math.random;
    return {
      version: 2,
      mode,
      stage: 0,
      score: 0,
      lives: 3,
      mistakes: [],
      elapsed: 0,
      status: "playing",
      turns: modes[mode].limit,
      eventPlan:
        mode === "classic"
          ? []
          : [0, 2, 4].map((i) => i + (random() < 0.5 ? 0 : 1)),
      eventIndex: 0,
      pending: null,
      history: [],
      quantity: 5,
      supplier: "Fornecedor original",
    };
  }
  function restore(raw) {
    if (!raw || ![1, 2].includes(raw.version)) return null;
    if (raw.version === 1)
      return restore({ ...fresh({ mode: "classic" }), ...raw, version: 2 });
    if (
      !Object.hasOwn(modes, raw.mode) ||
      !Number.isInteger(raw.stage) ||
      raw.stage < 0 ||
      raw.stage > 6 ||
      !Number.isInteger(raw.score) ||
      raw.score < 0 ||
      raw.score > 690 ||
      !Number.isInteger(raw.lives) ||
      raw.lives < 0 ||
      raw.lives > 3 ||
      !Number.isFinite(raw.elapsed) ||
      raw.elapsed < 0 ||
      !Array.isArray(raw.mistakes) ||
      raw.mistakes.length > 3 ||
      raw.mistakes.some(
        (m) =>
          !m ||
          !Number.isInteger(m.stage) ||
          m.stage < 0 ||
          m.stage > 5 ||
          !["choice", "order", "event"].includes(m.type),
      )
    )
      return null;
    if (
      !Number.isInteger(raw.turns) ||
      raw.turns < 0 ||
      raw.turns > modes[raw.mode].limit ||
      !Array.isArray(raw.eventPlan) ||
      raw.eventPlan.length !== (raw.mode === "classic" ? 0 : 3) ||
      raw.eventPlan.some(
        (id, i) => !Number.isInteger(id) || id < i * 2 || id > i * 2 + 1,
      ) ||
      !Number.isInteger(raw.eventIndex) ||
      raw.eventIndex < 0 ||
      raw.eventIndex > raw.eventPlan.length ||
      !Array.isArray(raw.history) ||
      raw.history.length !== raw.eventIndex ||
      raw.history.some(
        (h, i) => !h || h.id !== raw.eventPlan[i] || ![0, 1].includes(h.choice),
      )
    )
      return null;
    const due =
      raw.mode !== "classic" &&
      raw.eventIndex < 3 &&
      raw.stage >= [1, 3, 5][raw.eventIndex];
    if (
      due !== Boolean(raw.pending) ||
      (raw.pending &&
        (raw.pending.id !== raw.eventPlan[raw.eventIndex] ||
          !["decision", "rework"].includes(raw.pending.phase) ||
          (raw.pending.phase === "rework"
            ? ![0, 1].includes(raw.pending.choice)
            : raw.pending.choice !== null)))
    )
      return null;
    if (
      (raw.eventIndex && raw.stage < [1, 3, 5][raw.eventIndex - 1]) ||
      (raw.pending && raw.stage !== [1, 3, 5][raw.eventIndex])
    )
      return null;
    const quantity = raw.history.some((h) => events[h.id].effect === "quantity")
      ? 7
      : 5;
    const supplier = raw.history.some((h) => events[h.id].effect === "supplier")
      ? "Fornecedor substituto"
      : "Fornecedor original";
    if (raw.quantity !== quantity || raw.supplier !== supplier) return null;
    const status =
      raw.stage === 6 && raw.lives > 0
        ? "won"
        : raw.lives === 0 || (raw.mode !== "classic" && raw.turns === 0)
          ? "lost"
          : "playing";
    if (
      raw.status !== status ||
      raw.lives !== 3 - raw.mistakes.length ||
      (status === "won" && raw.lives === 0)
    )
      return null;
    return {
      version: 2,
      mode: raw.mode,
      stage: raw.stage,
      score: raw.score,
      lives: raw.lives,
      elapsed: raw.elapsed,
      status,
      mistakes: raw.mistakes.map((m) => ({ stage: m.stage, type: m.type })),
      turns: raw.turns,
      eventPlan: [...raw.eventPlan],
      eventIndex: raw.eventIndex,
      pending: raw.pending
        ? {
            id: raw.pending.id,
            phase: raw.pending.phase,
            choice: raw.pending.choice,
          }
        : null,
      history: raw.history.map((h) => ({ id: h.id, choice: h.choice })),
      quantity,
      supplier,
    };
  }
  function spend(state, cost) {
    if (state.mode !== "classic") {
      state.turns = Math.max(0, state.turns - cost);
      if (!state.turns) state.status = "lost";
    }
  }
  function currentEvent(state) {
    return state.pending ? events[state.pending.id] : null;
  }
  function nextTarget(state) {
    return state.pending ? events[state.pending.id].target : state.stage;
  }
  function eventAnswer(state, choice) {
    const event = currentEvent(state);
    if (
      state.status !== "playing" ||
      !event ||
      !Number.isInteger(choice) ||
      choice < 0 ||
      choice > 2
    )
      return { kind: "ignored" };
    if (state.pending.phase === "decision") {
      const option = event.choices[choice];
      if (option.wrong) return penalize(state, "event");
      state.pending.phase = "rework";
      state.pending.choice = choice;
      spend(state, option.cost);
      return { kind: "planned", lost: state.status === "lost" };
    }
    if (choice !== event.correct) return penalize(state, "event");
    spend(state, 1);
    if (state.status === "lost") return { kind: "expired", lost: true };
    state.history.push({ id: state.pending.id, choice: state.pending.choice });
    state.eventIndex++;
    state.pending = null;
    state.score += 30;
    if (event.effect === "quantity") state.quantity = 7;
    if (event.effect === "supplier") state.supplier = "Fornecedor substituto";
    return { kind: "resolved" };
  }
  function penalize(state, type) {
    state.lives--;
    state.score = Math.max(0, state.score - 25);
    state.mistakes.push({ stage: state.stage, type });
    spend(state, 2);
    if (!state.lives) state.status = "lost";
    return { kind: "wrong", lost: state.status === "lost" };
  }
  function answer(state, target, choice) {
    if (
      state.status !== "playing" ||
      state.pending ||
      target !== state.stage ||
      !Number.isInteger(choice) ||
      choice < 0 ||
      choice >= stages[target].choices.length
    )
      return { kind: "ignored" };
    if (choice !== stages[target].correct) return penalize(state, "choice");
    // The last available action may complete the mission.
    if (state.mode !== "classic" && state.turns === 1 && state.stage === 5)
      state.turns--;
    else spend(state, 1);
    if (state.status === "lost") return { kind: "expired", lost: true };
    state.score += 100;
    state.stage++;
    if (state.mode !== "classic" && state.stage === [1, 3, 5][state.eventIndex])
      state.pending = {
        id: state.eventPlan[state.eventIndex],
        phase: "decision",
        choice: null,
      };
    if (state.stage === stages.length) state.status = "won";
    return { kind: "correct", won: state.status === "won" };
  }
  function skip(state, target) {
    if (
      state.status !== "playing" ||
      state.pending ||
      !Number.isInteger(target) ||
      target <= state.stage ||
      target >= stages.length
    )
      return { kind: "ignored" };
    return penalize(state, "order");
  }
  const api = {
    concepts,
    stages,
    events,
    modes,
    fresh,
    restore,
    answer,
    skip,
    eventAnswer,
    currentEvent,
    nextTarget,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LegacyBureaucracy = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
