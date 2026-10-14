# ADR 0002 — Expiração automática da reserva de uma doação aceita (Regra 3)

- **Data:** 2026-10-13
- **Status:** Proposto

## Contexto
A Regra 3 da Análise (`docs/analise.md`) diz: se a ONG aceitar e não confirmar a retirada em 120 minutos, a doação volta para "disponível" e a ONG perde a reserva. A origem dessa regra é classificada como "ausente" no documento de Análise, o caso não diz o que acontece quando uma ONG aceita e não busca, e Marta e as ONGs do piloto ainda precisam ratificá-la; até lá vale a regra inventada pelo grupo. Mesmo sem ratificação, o comportamento precisa ser decidido agora: sem expiração, uma doação aceita e nunca retirada fica reservada indefinidamente, piorando exatamente o problema central do caso (comida boa que ninguém chega a buscar).

## Alternativas consideradas
1. **Job periódico que varre o banco e reverte doações vencidas** — prós: o status no banco reflete a realidade a qualquer momento, mesmo sem ninguém consultar. Contras: precisa de um processo separado rodando continuamente (ou um scheduler externo), que `src/server.js` não tem hoje; mais difícil de testar (precisa simular passagem de tempo e o job rodando).
2. **Verificação sob demanda, calculada no momento em que alguém lista as disponíveis** — prós: reaproveita a consulta que já existe em `repositorio.listarDisponiveis()`, sem infraestrutura nova; mais fácil de testar (é só mais uma condição no teste que já existe). Contras: a doação só "volta" a aparecer disponível no instante em que alguém de fato consulta a lista.

## Decisão
Verificação sob demanda (alternativa 2): `repositorio.listarDisponiveis()` passa a considerar disponível tanto `status = 'disponivel'` quanto `status = 'aceita'` com `aceita_em` há mais de 120 minutos. Por que não a alternativa 1: o projeto não tem nenhum processo de longa duração hoje, `npm start` sobe só o servidor HTTP, e a tabela de trade-offs em `docs/projeto.md` mostra que a verificação sob demanda custa zero de infraestrutura nova, o que pesa mais do que a desatualização momentânea do campo `status` gravado no banco.

## Consequências
- **Positivas:** nenhuma infraestrutura nova; reaproveita o teste e a consulta já existentes; mais fácil de cobrir com teste determinístico (manipular `aceita_em` diretamente no banco em vez de esperar 120 minutos de verdade).
- **Negativas, concreta e quem paga:** quem consultar a tabela `doacoes` diretamente (ex.: um futuro dump para a Vigilância, ADR 0001) vai ver doações com `status = 'aceita'` há mais de 120 minutos, mesmo que a API já as trate como disponíveis. Quem paga: qualquer integração futura que leia a tabela direto (dump, relatório) precisa reaplicar essa mesma regra de 120 minutos.
- **Riscos e o que fazer se der errado:** se o prazo de 120 minutos mudar (quando Marta e as ONGs ratificarem um valor diferente), só `repositorio.listarDisponiveis()` muda, nenhuma outra parte do sistema depende desse número hoje.

## Rastreabilidade
Regra 3 da Análise (`docs/analise.md`, "Regras de negócio"), origem "ausente", pendente de ratificação por Marta e pelas ONGs do piloto; Decisão de projeto nº 1 (`docs/projeto.md`, "Decisões de projeto").

## Critério de validação
O que precisa continuar igual: nenhuma doação "disponível" some da listagem, e nenhuma doação aceita há menos de 120 minutos aparece como disponível. Comando que mostra isso: um teste que cria uma doação, força `aceita_em` para mais de 120 minutos atrás diretamente no banco de teste, e confirma que `GET /api/doacoes` volta a listá-la, ainda não implementado; fica como próximo passo antes da entrega.