# O Labirinto Burocrático

RPG educativo em pixel art sobre a Teoria da Burocracia de Max Weber. Você entra na NetFeliz e precisa aprovar uma compra, organizar documentos e reagir a mudanças durante o expediente.

## Como rodar

**Sem instalar nada:** abra `index.html` no Edge, Chrome ou Firefox atualizado. Mantenha todas as pastas do projeto juntas. O jogo funciona sem conexão depois de copiar o projeto para o computador.

**Com servidor local**, usando Node.js 22 ou superior:

```sh
npm start
```

Abra **http://localhost:8080**. Não é necessário executar `npm install`: não há dependências de execução. `Ctrl+C` encerra o servidor. Para publicar em uma hospedagem estática, mantenha a estrutura de pastas e use `index.html` como entrada.

## Docker e Easypanel

O projeto já inclui um `Dockerfile` pronto para a Easypanel. A imagem usa Nginx, expõe a porta **80** e possui verificação de saúde em `/`. Não há banco de dados, volume ou variável de ambiente obrigatória: o progresso do jogador é salvo no navegador.

Na Easypanel, crie um serviço **App**, conecte este repositório e selecione **Dockerfile** como método de build. Use a porta interna `80`, vincule seu domínio e faça o deploy. A plataforma deve apontar o health check para `/`.

Para validar localmente em uma máquina com Docker:

```sh
docker compose up --build
```

Abra `http://localhost:8080`. Para encerrar, execute `docker compose down`.

## Como jogar

- Clique no mapa e use **WASD/setas** para andar, **E/Enter** para conversar ou clique no chão para caminhar. Há controles de toque no celular.
- Use **Visitar setor**, o mapa de setores ou a lista de aprovações para chegar diretamente ao responsável. Todos esses controles funcionam com Tab e Enter.
- Nos diálogos, peça orientação ou apresente o documento para análise. Ler, conversar, mover e anexar documentos não consome ações.
- Abra **Minha pasta** para consultar campos, comparar revisões e anexar documentos. Anexe o parecer financeiro antes da Diretoria; a minuta e, quando necessária, a delegação antes da aprovação final.
- Uma mudança pode invalidar pareceres dependentes dos dados alterados. Revalide o que ficou pendente e anexe a versão atual. Uma aprovação revalidada não concede a recompensa novamente.
- Na Diretoria, pedir um favor abre um aviso. Reconsiderar é gratuito; insistir registra favorecimento e aplica a penalização.

## Modos e regras

| Modo        |      Ações | Vidas | Imprevistos |
| ----------- | ---------: | ----: | ----------: |
| Tranquilo   | Sem limite |     3 |           0 |
| Desafiador  |         18 |     3 |           3 |
| Sob pressão |         13 |     3 |           3 |

Cada assinatura correta e cada conferência de ocorrência custa uma ação. Planos informam seu próprio custo. Revisar manualmente o pedido custa uma ação nos modos com prazo. Um erro confirmado custa uma vida, até 25 pontos e até duas ações restantes; não há saldo negativo. Consultar um setor antes da hora apenas mostra as pendências: a penalização ocorre ao insistir sem os requisitos.

A aprovação final pode usar a última ação. O cronômetro é informativo e pausa em janelas e abas ocultas. Os imprevistos aparecem após a primeira, terceira e quinta recompensas de etapa:

1. Queda do sistema ou aumento da demanda.
2. Corte de orçamento ou urgência documentada.
3. Troca de fornecedor ou ausência da direção.

As oito combinações permitem vencer em Sob pressão com os planos eficientes. Planos demorados podem esgotar o prazo mesmo sem erros. Pontuação máxima: **690** com eventos, **600** em Tranquilo.

## Visual, pasta e salvamento

O escritório usa câmera que acompanha o jogador, sprites de 32 × 48 pixels em quatro direções, decoração por setor, profundidade, sombras de contato e iluminação limitada pelas paredes. Em **Visual**, escolha iluminação noturna ou modo econômico. A preferência de movimento reduzido do sistema é respeitada. O som sintetizado é opcional.

Os documentos mantêm versões anteriores e referências à revisão exata de cada anexo. A pasta permite filtrar, fixar um documento no painel, comparar alterações, registrar novas quantidades e exportar um JSON do expediente. A exportação serve para consulta e cópia; esta versão não oferece importação manual.

O progresso fica no navegador, usando IndexedDB e armazenamento local como alternativa. O estado do salvamento aparece abaixo do mapa. Partidas antigas são migradas sem apagar a chave original. Uma atualização recebida de outra aba bloqueia novas alterações até recarregar.

O jogo continua se o navegador negar armazenamento, mas nesse caso fechar a página pode perder o progresso. Arquivo local e servidor possuem armazenamentos distintos; trocar endereço, navegador ou computador não transfere automaticamente a partida.

## Organização do código

| Pasta             | Responsabilidade                                            |
| ----------------- | ----------------------------------------------------------- |
| `content/`        | Pessoas, conceitos, requisitos, eventos e grafo de diálogos |
| `domain/`         | Regras puras, documentos, aprovações e contratos de dados   |
| `application/`    | Sessão, comandos, coordenação de salvamento e navegação     |
| `infrastructure/` | Armazenamento, migração e áudio                             |
| `rendering/`      | Mundo, colisão, câmera, cenário e iluminação                |
| `ui/`             | Janelas, inventário, HUD e apresentação dos diálogos        |
| `assets/`         | Atlas original e retratos dos personagens                   |
| `tests/`          | Regras, integração, geometria e compatibilidade             |
| `tools/`          | Servidor local, gerador de sprites e teste em navegador     |

`game.js` inicia a aplicação. `engine.js` oferece uma fachada para o domínio. O código legado existe apenas para validar e migrar partidas anteriores.

Consulte [a arquitetura implementada](docs/ARQUITETURA.md) e [o documento de direção de arte](docs/Labirinto_Burocratico_Direcao_de_Arte_e_Arquitetura.docx).

## Verificação

```sh
npm test
```

Os testes cobrem todas as combinações de eventos, revisões seletivas, prevenção de recompensas repetidas, anexos, idempotência, autoridade, vidas, prazo, migração, armazenamento indisponível, conflitos entre abas, caminhos e bloqueio da luz por paredes. O GitHub Actions executa a suíte em cada push e pull request.

Para testar no Edge/Chrome real, inicie uma instância isolada com depuração remota na porta 9224 e execute `npm run test:browser`. O script usa o protocolo CDP, percorre os diálogos pela interface, recarrega a partida, verifica telas de 1440, 390 e 320 pixels e salva imagens em `.tmp/visual-qa`. Use somente um perfil dedicado de testes: o roteiro inicia novas partidas nesse perfil. Variáveis opcionais: `CDP_PORT` e `GAME_URL`.

## Escopo e relação com Weber

O fluxo apresenta formalização, hierarquia, divisão do trabalho, impessoalidade, especialização e autoridade racional-legal. É uma simplificação didática: o Jurídico analisa por competência e não representa necessariamente um nível hierárquico superior à Diretoria. Lentidão e formalismo excessivo, isoladamente, não definem a teoria.

A versão entregue é um jogo individual executado no navegador e publicável como site estático. Contas, sincronização entre dispositivos, multiplayer e ranking com validação no servidor exigem uma etapa de backend. Os arquivos locais não são uma proteção contra alguém que controle o próprio navegador.

Referência conceitual: Max Weber, _Economia e sociedade_, discussão sobre dominação legal e administração burocrática. A equipe deve completar a referência com os dados da edição efetivamente consultada. Personagens, regras da NetFeliz e ocorrências são fictícios.
