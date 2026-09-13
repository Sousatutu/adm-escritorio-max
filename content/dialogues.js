(function (root) {
  "use strict";
  const nodes = {
    reception: {
      text: "Posso orientar você ou analisar seu processo. Qual é o próximo passo?",
      choices: [
        {
          id: "guidance",
          label: "Pode me explicar o caminho?",
          next: "guidance",
        },
        {
          id: "formal",
          label: "Apresentar o documento para análise",
          next: "decision",
        },
        {
          id: "favor",
          label: "Pode adiantar por nossa amizade?",
          when: "friend",
          next: "warning",
        },
        {
          id: "priority",
          label: "Existe uma prioridade formal para urgências?",
          when: "director",
          next: "priority",
        },
      ],
    },
    guidance: {
      text: "Cada decisão precisa de evidências e da autoridade competente. Consulte a tarefa da pasta para encontrar a próxima pendência.",
      choices: [
        { id: "back", label: "Entendi. Voltar à conversa", next: "reception" },
      ],
    },
    warning: {
      text: "Nossa amizade não substitui as etapas ou os critérios. Você pode regularizar o processo. Insistir no favor custa uma vida, até 25 pontos e 2 ações.",
      choices: [
        {
          id: "reconsider",
          label: "Vou seguir os critérios. Voltar ao fluxo",
          next: "reception",
        },
        {
          id: "insist",
          label: "Mesmo assim, quero tratamento privilegiado",
          intent: "ATTEMPT_FAVORITISM",
        },
      ],
    },
    refused: {
      text: "O favor foi recusado. A tentativa foi registrada uma vez. Você ainda pode regularizar o pedido e obter a aprovação pelos critérios institucionais.",
      choices: [
        { id: "back", label: "Regularizar o processo", next: "reception" },
      ],
    },
    priority: {
      text: "Uma interrupção de serviço pode justificar prioridade quando prevista e documentada. Amizade não é um critério. Se houver uma ocorrência de serviço interrompido, apresente a evidência no setor.",
      choices: [
        { id: "back", label: "Entendi. Voltar à análise", next: "reception" },
      ],
    },
    decision: { text: "Análise formal", choices: [] },
  };
  function allowed(choice, state, target) {
    return (
      !choice.when ||
      (choice.when === "director" && target === "director") ||
      (choice.when === "friend" &&
        target === "director" &&
        state.relationships.diego >= 1)
    );
  }
  function validate() {
    for (const [id, node] of Object.entries(nodes)) {
      if (
        !node.text ||
        !Array.isArray(node.choices) ||
        new Set(node.choices.map((c) => c.id)).size !== node.choices.length
      )
        throw Error("Diálogo inválido: " + id);
      for (const c of node.choices)
        if (c.next && !nodes[c.next]) throw Error("Nó inexistente");
    }
    return true;
  }
  validate();
  const api = { nodes, allowed, validate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else (root.LB ||= {}).Dialogues = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
