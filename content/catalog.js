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
        "Novo parecer financeiro emitido. Anexe a revisão atual à pasta para seguir à Diretoria.",
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

  const roles = [
    "protocol",
    "supervisor",
    "manager",
    "director",
    "legal",
    "general",
  ];
  const people = ["ana", "bruno", "carla", "diego", "elisa", "felipe"];
  stages.forEach((stage, i) =>
    Object.assign(stage, { id: roles[i], personId: people[i] }),
  );
  const modes = {
    classic: { label: "Tranquilo", limit: 0 },
    normal: { label: "Desafiador", limit: 18 },
    intense: { label: "Sob pressão", limit: 13 },
  };
  const requirements = stages.map((s, i) => ({
    id: s.id,
    role: s.id,
    index: i,
    prerequisites: i ? [roles[i - 1]] : [],
    rewardKey: "mission01." + s.id,
    documentId: i === 2 ? "budget" : i === 4 ? "contract" : "request",
  }));
  const documentNames = {
    request: "Requerimento de compra",
    budget: "Parecer financeiro",
    contract: "Minuta de contratação",
    delegation: "Delegação de competência",
    contingency: "Registro de contingência",
  };
  const actors = Object.fromEntries(
    stages.map((s) => [
      s.personId,
      { id: s.personId, name: s.person, roles: [s.id] },
    ]),
  );
  actors.marina = { id: "marina", name: "Marina", roles: ["deputy"] };
  const api = {
    concepts,
    stages,
    events,
    modes,
    requirements,
    documentNames,
    actors,
    roles,
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).Content = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
