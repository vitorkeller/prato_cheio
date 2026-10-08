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
