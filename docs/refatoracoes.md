# Refatorações — Prato Cheio
 
*Trabalho 3 · uma seção por refatoração · o que importa é o motivo e a evidência*
 
## Refatoração 1 — Migração de SQLite para PostgreSQL
 
- **Motivo:** decidida no ADR 0001 (`docs/adr/0001-migracao-postgresql.md`): o SQLite serializa escritas, e a regra central do caso (uma ONG aceita e a doação some para as outras) depende de um `UPDATE ... WHERE status = 'disponivel'` atômico. O README já registrava o compromisso "SQLite agora, PostgreSQL depois". Caminho escolhido: PostgreSQL em contêiner Docker, local e no CI (alternativa 3 do ADR).

- **O que mudou:**

  - `src/db.js`: `node:sqlite` virou `pg` (`Pool`). `query()` continua devolvendo `{ rows }`. Schema em dialeto PostgreSQL (`SERIAL`, `TIMESTAMPTZ`, `NOW()`).

  - `src/repositorio.js`: marcadores `?` viraram `$1`, `$2`, ... e `datetime('now')` virou `NOW()`.

  - `.github/workflows/ci.yml`: bloco `services: postgres` e `DATABASE_URL` descomentados. O CI roda a suíte inteira sobre `postgres:16-alpine`.

  - `package.json` e `package-lock.json`: dependência `pg`. `vitest.config.js`: removido o banco em memória.

  - Dois vazamentos de contrato corrigidos em `db.js` e `repositorio.js`, sem tocar nas regras:

    - id que não é número devolvia erro do banco, e voltou a ser "Doação não encontrada";

    - datas voltaram ao formato `AAAA-MM-DD HH:MM:SS` (o `pg` devolveria `Date` e ISO 8601).

- **O que NÃO mudou:** `src/doacoes.js` (regras de negócio), `src/app.js` (rotas), `public/`, as mensagens de erro e os 13 testes existentes (nenhuma linha alterada).

- **Evidência de que o comportamento se manteve:**

  - testes antes da mudança: 13 passando (SQLite em memória)

  - testes depois da mudança: 16 passando (PostgreSQL), sendo os 13 anteriores sem alteração + 3 novos (concorrência de aceite, id inválido, formato das datas)
 
## Refatoração 2 — Tratamento de erro centralizado nas rotas
 
- **Cheiro de código atacado:** código duplicado. As três rotas de `src/app.js` repetiam o mesmo `try { ... } catch (erro) { res.status(400).json({ erro: erro.message }) }`.

- **Qual dor concreta isso resolvia:** cada história nova (confirmar retirada, cancelar doação, mostrar o doador) adiciona uma rota, e cada rota copiaria o bloco. Mudar o formato do erro (por exemplo, trocar 400 por 404/409 onde fizer sentido) exigiria editar todas as rotas e esquecer uma criaria resposta inconsistente.

- **O que mudou:** `src/app.js` ganhou `comTratamento(handler)`, que faz o `try/catch` uma vez. Cada rota passou a conter só o que ela faz. Os status e o formato `{ erro }` são os mesmos de antes.

- **Evidência (testes verdes antes e depois):** 16 passando antes e 16 passando depois, sem alterar nenhum teste.
 
---
 
**Limitações e o que ficou de fora:**

- `limparBanco()` apaga as doações do banco apontado por `DATABASE_URL`. Antes os testes usavam SQLite em memória, então `npm test` não tocava no banco de desenvolvimento. Não separamos um banco de testes porque o CI tem um único banco descartável. Fica como cuidado: rodar os testes só contra banco descartável.

- Os dados do `dados.sqlite` antigo não foram migrados para o PostgreSQL (não há dados de piloto a preservar).

- Todo erro de rota continua sendo 400. Separar 404 (não encontrada) de 409 (já aceita) mudaria o comportamento e exigiria alterar os testes existentes. Fica para quando houver decisão de produto.

- A fração de segundo das datas é descartada para manter o formato antigo.
 