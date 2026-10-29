## Título do incremento
<!-- Nome pelo valor de uso. Ex.: "Identificar o doador ao publicar uma doação". Nunca "PR 1". -->

## História / decisão relacionada
<!-- História, critério de aceite da fatia e ADR (se houver). -->

## Fatias da história
<!-- Uma por linha, com o critério de cada uma em uma frase. Destaque a fatia deste PR. -->

## Como verificar
<!-- Passos detalhados para o revisor testar. -->

## Uso de IA
<!-- O que a IA gerou, o que foi mantido, o que foi alterado e por quê — ou "não usamos". -->

## Definição de pronto
- [ ] CI verde (aba Checks)
- [ ] Aprovado por integrante que não é o autor (aba Reviews)
- [ ] Cada critério da fatia tem `it` com o nome do critério, sem `it.todo`/`.only`/`.skip` (aba Files changed)
- [ ] Revisor executou "Como verificar" e comentou o resultado (aba Conversation)
- [ ] Se mexeu em `public/`: print da tela do celular anexado