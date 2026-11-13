# Roteiro da demo — Prato Cheio
 
*Trabalho 3 · 3 minutos · outra pessoa precisa conseguir reproduzir só lendo isto*
 
## Antes de começar
 
A partir de um clone limpo. Requisitos: Node.js 22.13+ e Docker.
 
```bash
git clone https://github.com/vitorkeller/prato_cheio.git
cd prato_cheio
docker run -d --name prato-cheio-pg \
  -e POSTGRES_USER=pratocheio -e POSTGRES_PASSWORD=pratocheio -e POSTGRES_DB=pratocheio \
  -p 5432:5432 postgres:16-alpine
docker exec prato-cheio-pg pg_isready -U pratocheio   # repita até aparecer "accepting connections"
npm install       # só na primeira vez
npm run db:migrar # cria o schema no PostgreSQL
npm start         # sobe em http://localhost:3000
```
 
Variáveis de ambiente (opcionais): `DATABASE_URL` (padrão `postgres://pratocheio:pratocheio@localhost:5432/pratocheio`, o contêiner acima) e `PORT` (padrão 3000). Não há seeds: o banco começa vazio.
Se o contêiner já existir, use `docker start prato-cheio-pg`. Para zerar tudo: `docker rm -f prato-cheio-pg` e repita os comandos.
 
## Roteiro (3 minutos)
 
| Tempo | O que mostrar | O que se prova |
|---|---|---|
| 0:00–0:20 | **Problema:** doadores e ONGs se falam por grupos de WhatsApp sem histórico, e a ONG descobre tarde demais que há comida disponível; o Prato Cheio lista na hora o que está disponível e deixa só uma ONG ficar com cada doação. | por que o produto existe |
| 0:20–1:50 | **História principal (fluxo feliz):** o doador publica uma doação identificando-se (passos 3–4), a ONG a vê na tela e a aceita, e ela some da lista (passos 5–6). | o produto executa ponta a ponta |
| 1:50–2:30 | **Caso de erro tratado:** segunda ONG tentando aceitar a mesma doação, publicação sem nome e telefone do doador e doação inexistente (passos 7–9). Os três erros saem no mesmo formato (400 + `{ "erro": ... }`). | o limite foi pensado |
| 2:30–3:00 | **O que falta e por quê:** ver passo 12. | vocês sabem onde estão |
 
## Passo a passo reproduzível
 
Pré-condição: aplicação rodando e banco vazio (clone limpo). Os comandos `curl` usam `http://localhost:3000`.
 
1. **Ação:** `curl -i http://localhost:3000/api/saude`
   **Resultado esperado:** `HTTP/1.1 200` e corpo `{"ok":true}`.
2. **Ação:** abrir `http://localhost:3000` no navegador (de preferência em modo celular no DevTools).
   **Resultado esperado:** a página mostra "Publicar doação" e, abaixo, "Doações disponíveis" com "Nenhuma doação disponível.". Não use o formulário da tela para publicar (ver passo 12).
3. **Ação (o doador publica):** `curl -i -X POST http://localhost:3000/api/doacoes -H "Content-Type: application/json" -d '{"tipo":"Sopa","quantidade":"10 porções","validade":"2026-12-01","doador_nome":"Maria da Silva","doador_telefone":"47 99999-0000"}'`
   **Resultado esperado:** `HTTP/1.1 201` e um JSON com `"id":1`, `"status":"disponivel"`, `"ong":null`, `"aceita_em":null`, `"doador_nome":"Maria da Silva"`, `"doador_telefone":"47 99999-0000"` e `criada_em` no formato `AAAA-MM-DD HH:MM:SS`.
4. **Ação:** `curl -s http://localhost:3000/api/doacoes`
   **Resultado esperado:** `200` e um array com 1 objeto, o mesmo do passo 3 (a doação aparece na lista de disponíveis, com nome e telefone do doador).
5. **Ação (a ONG aceita):** recarregar a página do navegador e clicar em **Aceitar** na doação `Sopa — 10 porções (até 2026-12-01)`.
   **Resultado esperado:** antes do clique a doação aparece com o botão **Aceitar**; depois, a lista volta a mostrar "Nenhuma doação disponível." (a interface aceita em nome de `Minha ONG`).
6. **Ação:** `docker exec prato-cheio-pg psql -U pratocheio -d pratocheio -c "SELECT id, status, ong, criada_em, aceita_em FROM doacoes"`
   **Resultado esperado:** uma linha: `1 | aceita | Minha ONG |` com `criada_em` e `aceita_em` preenchidos.
7. **Ação (erro 1, segunda ONG):** `curl -i -X POST http://localhost:3000/api/doacoes/1/aceitar -H "Content-Type: application/json" -d '{"ong":"ONG Solidária"}'`
   **Resultado esperado:** `HTTP/1.1 400` e `{"erro":"Doação já foi aceita por outra ONG"}`. Repetir a consulta do passo 6: a doação segue `aceita` por `Minha ONG`.
8. **Ação (erro 2, doador não identificado):** `curl -i -X POST http://localhost:3000/api/doacoes -H "Content-Type: application/json" -d '{"tipo":"Pão","quantidade":"5kg","validade":"2026-12-01"}'`
   **Resultado esperado:** `HTTP/1.1 400` e `{"erro":"Nome e telefone do doador são obrigatórios"}`. Em `curl -s http://localhost:3000/api/doacoes` a lista continua `[]`.
9. **Ação (erro 3, doação inexistente):** `curl -i -X POST http://localhost:3000/api/doacoes/999/aceitar -H "Content-Type: application/json" -d '{"ong":"ONG Esperança"}'`
   **Resultado esperado:** `HTTP/1.1 400` e `{"erro":"Doação não encontrada"}`. O mesmo ocorre com `/api/doacoes/abc/aceitar`.
10. **Ação:** abrir `src/app.js`.
    **Resultado esperado:** as três rotas de `/api/doacoes` usam `comTratamento(...)` e nenhuma tem `try/catch` próprio. É por isso que os erros dos passos 7, 8 e 9 têm o mesmo formato.
11. **Ação:** `npm test` (atenção: apaga as doações do banco, então rode por último).
    **Resultado esperado:** `Tests  17 passed (17)`.
12. **Ação (fala final, sem comando):** dizer o que ainda falta, com base nos critérios `não atende` e `parcial` de `docs/validacao.md`.
    **Resultado esperado:** citar:
    - o formulário da tela ainda não tem nome e telefone do doador nem mostra mensagens de erro: publicar pela tela hoje falha em silêncio (é por isso que o passo 3 usa a API);
    - não existe rota nem tela para consultar uma doação já aceita, então o tempo publicação→aceite que a Marta quer ver ainda não é calculado;
    - nome completo e telefone válido ainda não são validados (só "não vazio"), e tipo, quantidade e validade só com espaços ainda são aceitos;
    - o voluntário ainda não confirma a retirada (história 4), o tipo ainda é texto livre (Regra 2) e a reserva não expira em 120 min (Regra 3);
    - a proteção de `limparBanco()` ainda não impede apagar um banco real que esteja em `localhost`.
 
## Testado por
 
Outro integrante executou este roteiro sem ajuda: Vitor Arthur Keller - Data: 12/11/2026 - Nada precisou ser alterado.

tem menu de contexto