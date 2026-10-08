# ADR 0001 — Migração do banco de dados de SQLite para PostgreSQL

- **Data:** 2026-10-08
- **Status:** Proposto

## Contexto
A Unidade 1 implementou o walking skeleton sobre SQLite (`node:sqlite`, embutido no Node) porque era zero fricção: o `README.md` exige só "Node.js 22.13 ou superior. Mais nada". Essa não é uma escolha isolada do grupo, o próprio README já registra o compromisso "SQLite agora, PostgreSQL depois": SQLite nas Unidades 1 e 2, PostgreSQL na Unidade 3, com a decisão registrada em ADR na Unidade 2 e a refatoração executada só na Unidade 3.

O motivo técnico para migrar não é "Postgres é melhor", é que SQLite serializa escritas (um único escritor por vez no arquivo `dados.sqlite`). A regra central do caso (história zero, `docs/analise.md`), uma ONG aceitar uma doação e ela sumir para as demais, depende hoje de um único `UPDATE ... WHERE status = 'disponivel'` atômico fazendo esse papel de trava de concorrência. Isso basta com um processo e um escritor, mas a Incerteza 1 da Análise (volume real de doações diárias e taxa de adesão das entidades receptoras) já deixa claro que não sabemos quantos doadores e ONGs vão publicar/aceitar ao mesmo tempo quando o piloto crescer.

Migrar só na Unidade 3, e não agora: a Unidade 2 ainda está fechando decisões de projeto (ver `docs/projeto.md`) sem ter validado a hipótese do formulário de 30s nem o volume real do piloto. Adicionar a operação de um banco externo antes disso seria custo de infraestrutura sem necessidade comprovada ainda, o mesmo raciocínio que já levou o grupo a cortar autenticação e notificação da história zero na Decisão de análise do Trabalho 1. O `src/db.js` foi desenhado para isso: ele expõe `query(sql, valores) → { rows }`, então a troca do banco fica contida ali, sem exigir que `repositorio.js` ou `doacoes.js` mudem quando a migração acontecer.

## Alternativas consideradas
1. **Permanecer em SQLite também na Unidade 3** — prós: zero fricção mantida, nenhum serviço externo, nenhum custo de operação. Contras: não cumpre o compromisso da disciplina (README exige banco relacional "migrado para PostgreSQL" na U3), um único escritor por vez não sustenta múltiplas lojas e ONGs publicando/aceitando ao mesmo tempo, o arquivo único já demonstrou fragilidade operacional (`disk I/O error` em pasta sincronizada, documentado no próprio README).
2. **PostgreSQL instalado localmente em cada máquina** — prós: controle total, roda sem depender de internet. Contras: cada integrante precisa instalar e manter a própria instância, risco de divergência de versão entre as duas máquinas do grupo, e não resolve como o banco sobe no CI.
3. **PostgreSQL via contêiner (Docker), local e no CI** — prós: ambiente idêntico entre as duas máquinas do grupo e o pipeline, o `.github/workflows/ci.yml` já tem um bloco de serviço `postgres:16-alpine` comentado, pronto para isso, descartável e fácil de resetar entre rodadas de teste. Contras: exige Docker instalado e rodando em cada máquina, uma camada de infraestrutura que SQLite não exigia.
4. **PostgreSQL via serviço gerenciado gratuito (Neon, Supabase, Render)** — prós: nenhuma instalação local, banco único acessível por `DATABASE_URL`, nada rodando localmente. Contras: depende de internet e de um provedor externo, o limite de conexões/armazenamento do tier gratuito ainda não foi testado pelo grupo.

## Decisão
Migrar para PostgreSQL subido via contêiner Docker, alternativa 3 — tanto localmente quanto no CI, descomentando o bloco de serviço já presente em `.github/workflows/ci.yml` e apontando `DATABASE_URL` para ele. A interface `query()` de `src/db.js` continua sendo a única superfície alterada.

Por que não as outras: permanecer em SQLite (1) não cumpre o compromisso do README nem resolve a concorrência que motiva a troca. Instalar localmente (2) introduz divergência de ambiente entre as duas máquinas do grupo, o mesmo tipo de risco de "funciona na minha máquina" que já está na tabela de Riscos da Análise. O serviço gerenciado (4) fica registrado como alternativa aceitável se o contêiner se mostrar inviável (ex.: alguém sem Docker disponível), mas não é a escolha inicial por adicionar uma dependência externa sem necessidade comprovada ainda.

## Consequências
- **Positivas:** ambiente idêntico entre as duas máquinas do grupo e o CI (mesma imagem `postgres:16-alpine`), concorrência real entre múltiplos escritores, sustentando a regra central da história zero em escala, cumpre o requisito do README de banco "alcançável por `DATABASE_URL`".
- **Negativas, concreta e quem paga:** cada integrante passa a precisar de Docker instalado e rodando antes de `npm start` funcionar, um requisito de ambiente que SQLite não tinha (SQLite exigia só o Node). Quem paga: qualquer integrante (ou o professor, numa reprodução local) sem Docker instalado perde o "nada para instalar além do Node" que o README promete hoje, e precisa instalar Docker Desktop (ou equivalente) antes de conseguir rodar o projeto.
- **Riscos e o que fazer se der errado:** se a migração mudar comportamento sem ninguém perceber, o sintoma aparece nos testes (ver Critério de validação), o rollback é reverter o commit da migração, como a troca fica contida em `src/db.js`, reverter esse arquivo e a variável de ambiente restaura o comportamento anterior sem tocar `repositorio.js` nem `doacoes.js`.
 
## Rastreabilidade
- Risco 1 da tabela de Riscos (`docs/analise.md`): "Um integrante do grupo não conseguir concluir sua parte... a tempo do prazo", um ambiente padronizado por contêiner reduz divergência de "funciona na minha máquina" entre os dois integrantes.
- Incerteza 1 da Análise (volume real de doações diárias e taxa de adesão), a escolha de PostgreSQL prepara o sistema para volume desconhecido sem comprometer o prazo atual, já que a execução da migração fica para a Unidade 3.
- Regra central / história zero (★, `docs/analise.md`): a trava de concorrência de `aceitar()` hoje depende de um único escritor SQLite, PostgreSQL é o que sustenta essa mesma regra com múltiplos escritores reais.
 
## Critério de validação
O que precisa continuar igual: os critérios de aceite da história zero e das histórias 1 e 3 (`docs/analise.md`, seção "Critérios de aceite"), doação publicada aparece disponível, some da lista ao ser aceita, uma segunda tentativa de aceite é recusada, campos obrigatórios ausentes são recusados, e o instante de aceite fica visível.
 
Comando que mostra isso: `npm test` precisa continuar reportando os mesmos testes de `tests/doacoes.test.js` passando, sem alterar nenhum assert, rodando contra o PostgreSQL do contêiner (só `DATABASE_URL` e a implementação interna de `src/db.js` mudam). No CI, o critério objetivo é o job `build-e-testes` ficar verde com o bloco de serviço `postgres:16-alpine` (hoje comentado em `.github/workflows/ci.yml`) descomentado e a env `DATABASE_URL` configurada, "testar bastante" não é o critério, o CI verde com o serviço real é.

## Revisão — 08-10-2026
**Mudança de contexto:** ao revisar `src/db.js` contra o diagrama de dados publicado em `docs/projeto.md` para escrever este ADR, encontramos que a coluna `aceita_em`, que o diagrama já modela e que os critérios de aceite da história zero (`docs/analise.md`) exigem ("registra o instante do aceite"), não existe na tabela `doacoes` hoje. É uma divergência entre o que foi documentado e o que o schema real cria.

**O que muda:** a decisão de migrar para PostgreSQL via contêiner (seção Decisão acima) continua de pé, não é revertida. O que muda é o escopo da migração: ela passa a incluir adicionar `aceita_em` ao schema novo, em vez de carregar essa lacuna para o Postgres sem perceber. Status permanece **Proposto**, já que a migração ainda não foi executada.

**Divergência declarada (não corrigida agora):**
- `docs/projeto.md`, seção "Modelo de Dados Principal", modela `aceita_em TEXT` como campo de `doacoes`.
- `src/db.js`, função `migrar()`, cria `doacoes` hoje **sem** essa coluna (só `id, tipo, quantidade, validade, status, ong, criada_em`).
- Consequência prática: o critério de aceite "registra o instante do aceite" não tem onde ser persistido no schema atual. Esta revisão deixa isso registrado, a correção fica para a execução da migração (Unidade 3), para não fazer duas migrações de schema em sequência.
