# Arquitetura implementada · versão 3

Esta versão aplica ao jogo estático a direção de arte e a separação de responsabilidades propostas no DOCX. Mantém Canvas e JavaScript sem dependências de execução. A troca para Phaser, a adoção de Ink e serviços de contas/ranking continuam opções futuras, conforme a necessidade do projeto.

## Caminho de uma decisão

```text
Botão / diálogo → Session.dispatch → Domain.transition
                                      ├─ valida comando e revisão esperada
                                      ├─ calcula evidências e autoridade
                                      ├─ aplica um resultado e seus custos
                                      └─ retorna novo estado e eventos
                    ↓
               HUD + armazenamento + efeitos visuais
```

O domínio não acessa DOM, relógio, Canvas ou armazenamento. `transition(state, envelope)` clona o estado para cada comando aceito e devolve o estado anterior em rejeições. Conteúdo está em catálogos separados, e `domain/contracts.d.ts` documenta os contratos principais sem impor compilação TypeScript.

O envelope contém `commandId`, `expectedRevision` e `action`. Repetir um identificador devolve o recibo anterior sem nova recompensa, custo ou efeito. Uma revisão esperada desatualizada rejeita a operação. Identificadores são gerados por sessão e contador. Comandos inválidos são gratuitos; uma escolha incorreta ou uma insistência explicitamente confirmada gera uma única penalização agregada.

## Documentos e aprovações

Cada documento tem identidade estável, tipo, processo, revisão atual e histórico imutável. Uma mudança cria uma revisão; os registros antigos permanecem consultáveis. Anexos apontam para `{ documentId, revision }`, e anexar novamente a versão corrente é uma operação sem efeito. Somente o requerimento recebe anexos, evitando ciclos.

Uma aprovação registra requisito, responsável, competência, documento, revisão assinada, base e estado. `basisDigest` é uma representação canônica dos campos relevantes e das bases dos pré-requisitos; não é uma assinatura criptográfica. A representação determinística permite comparar dependências sem invalidar um parecer por qualquer alteração visual ou anexo irrelevante.

| Aprovação     | Evidências observadas                                |
| ------------- | ---------------------------------------------------- |
| Protocolo     | Número e registro formal                             |
| Supervisão    | Quantidade, finalidade, justificativa e Protocolo    |
| Gerência      | Quantidade, parecer financeiro e Supervisão          |
| Diretoria     | Prioridade, referência do parecer anexado e Gerência |
| Jurídico      | Condições da minuta e Diretoria                      |
| Direção-geral | Minuta anexada, delegação quando exigida e Jurídico  |

Ao mudar a quantidade, o registro do Protocolo permanece válido; pareceres dependentes da quantidade são marcados para revalidação. Uma troca de fornecedor altera a minuta e exige nova conferência jurídica. As chaves de recompensa persistem depois da invalidação, impedindo pontos repetidos no mesmo marco.

O catálogo de requisitos é percorrido na ordem de dependência. Para ampliar o fluxo, mantenha a ordenação topológica, declare pré-requisitos, defina os campos observados em `documents.basis` e os documentos emitidos em `prepareApproval`. Um novo tipo documental precisa de schema em `validFields` e apresentação na pasta. Não basta adicionar uma sala.

## Diálogos e impessoalidade

Os nós de `content/dialogues.js` têm texto, escolhas, condições declarativas e próximo nó ou intenção. Referências e identificadores são validados no carregamento. Não há código de condição avaliado dinamicamente.

A relação com Diego libera uma abordagem pessoal e modifica o tom de reencontros. Ela não participa da função que concede autoridade. O ramo de favorecimento passa por aviso, reconsideração ou insistência. A reconsideração é gratuita; insistir custa uma vida, até 25 pontos e duas ações disponíveis. Não se cobra novamente por atualizar a tela ou repetir o mesmo comando.

A prioridade formal é explicada como critério documentado. A ocorrência de interrupção de serviço permite aplicar esse critério dentro do fluxo. Aprovar exige os mesmos documentos e pré-requisitos, independentemente da amizade.

## Prazo, vidas e ocorrências

Há três vidas. Cada marco concede 100 pontos uma vez; cada ocorrência concluída concede 30. Assinaturas e conferências custam uma ação; planos variam entre uma e três. A revisão manual custa uma ação. Movimento, orientação, consultas e anexação são gratuitos.

A conclusão verifica primeiro ausência de vidas, depois todos os requisitos e, por fim, prazo esgotado. Assim, a última ação pode aprovar o processo. Se um plano exige mais ações do que restam, o prazo acaba sem executar parcialmente seu efeito. O saldo nunca fica negativo.

Um gerador com semente escolhe um evento de cada par. O plano sorteado integra o salvamento. Cada ocorrência tem decisão e conferência; a conclusão registra o histórico e libera o fluxo. Eventos se baseiam em marcos recompensados pela primeira vez, evitando sorteios repetidos ao revalidar aprovações.

A delegação verifica pessoa, competência, processo, conferência, prazo e limite de valor. A substituta Marina só pode aprovar a decisão final com uma delegação válida e anexada. Os valores e prazos pertencem às regras fictícias da missão.

## Renderização e interação

O mundo mede 960 × 672 pixels. A câmera mostra uma região e acompanha o personagem. Sprites têm quadros de 32 × 48 pixels em quatro direções, margem de atlas e animações de espera, caminhada, conversa, carimbo, entrega e reação. O gerador original usa Pillow; o jogo consome apenas os PNGs já incluídos. Caminhada, espera, conversa e carimbo são conectados às ações desta versão; entrega e reação ficam disponíveis no atlas para novas cenas.

O cenário estático é desenhado uma vez em Canvas auxiliar. Mesas e personagens são ordenados pela posição dos pés. Sombras de contato são independentes da iluminação. Até quatro luzes utilizam gradientes recortados por polígonos de visibilidade calculados contra segmentos das paredes; posições próximas usam cache limitado. O modo econômico dispensa luzes dinâmicas e limita a frequência de desenho. Movimento reduzido desativa oscilações e animações.

A navegação usa colisões de paredes e móveis, teclado relativo ao foco, botões de toque e caminho em grade para cliques. Perder foco, abrir uma janela ou ocultar a aba limpa o movimento. Visitas por botões oferecem uma alternativa completa a quem não usa controle espacial. As janelas nativas de diálogo mantêm foco, rolagem e retorno ao elemento anterior.

## Persistência e compatibilidade

`schemaVersion: 3` e `contentVersion: 3.0.0` identificam o formato. O carregamento valida tipos, documentos, relações de anexos, valores, recompensas, vidas, aprovações, bases e fases de eventos. Estados incompatíveis não são retomados silenciosamente.

O adaptador tenta IndexedDB e mantém alternativa em localStorage. Gravações são enfileiradas; o HUD exibe salvando, salvo ou falha. Há salvamento periódico e uma gravação curta ao ocultar/fechar a página. A sessão mantém o tempo ativo fora das transições de domínio e o inclui na exportação e no salvamento.

Partidas das versões anteriores são validadas pelo motor legado e reconstruídas com evidências equivalentes. A chave anterior permanece intacta. Migração não inventa decisões que o formato antigo não registrou. Uma atualização recebida de outra aba marca conflito e interrompe novos comandos e gravações. Isso reduz conflitos locais; não substitui transações de um servidor em uso concorrente.

## Evolução e limites

O próximo passo para contas e ranking seria receber os mesmos envelopes em um serviço que controla a sessão, calcula custos e salva transações. O navegador enviaria intenções e renderizaria o resultado. Pontuações enviadas pelo cliente não devem ser tomadas como autoridade.

Novas missões podem reutilizar o núcleo, mas ainda precisam de catálogo e regras de evidência. A missão atual é uma compra específica, com schemas explícitos. Os testes devem acompanhar os novos caminhos, especialmente autoridade, orçamento de ações, migrações e combinações de eventos.

`npm test` executa a suíte sem navegador. `npm run test:browser` verifica uma partida real pela interface, salvamento/retomada, favorecimento, revisão da pasta e ausência de rolagem horizontal em telas pequenas. Screenshots de QA ficam fora do Git em `.tmp/visual-qa`.
