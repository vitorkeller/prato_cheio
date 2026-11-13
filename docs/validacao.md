# Validação — Prato Cheio
 
*Trabalho 3 · confronto do produto com os critérios de aceite escritos na Unidade 1*
 
Copie aqui os critérios de aceite do seu `docs/analise.md` e marque um por um. **Um "não atende" bem justificado vale mais que um "sim" sem evidência.**
 
Status usados: `atende`, `parcial`, `não atende`, `não verificável`. "Passo N" refere-se a `docs/demo.md`, o CI é o job `build-e-testes` (`.github/workflows/ci.yml`), que roda a suíte sobre `postgres:16-alpine`.
 
| # | Critério de aceite (da Unidade 1) | Atende? | Evidência |
|:--:|---|:--:|---|
| 1 | **★ História zero.** Dado que existe uma doação publicada com status "disponível", quando uma ONG a aceita, então a doação passa para o status "aceita", registra o instante do aceite e deixa de aparecer na lista de doações disponíveis. | `atende` | Testes `marca a doação como aceita pela ONG`, `remove a doação da lista de disponíveis depois de aceita` e `devolve os instantes de publicação e aceite como texto AAAA-MM-DD HH:MM:SS, e o aceite vazio antes de aceitar`, demo, passos 3–6, CI verde. |
| 2 | **★ História zero.** Dado que uma doação já foi aceita por uma ONG, quando uma segunda ONG tenta aceitar essa mesma doação, então a API recusa a segunda tentativa e a doação permanece aceita apenas pela primeira ONG. | `atende` | Testes `recusa aceitar uma doação que já foi aceita por outra ONG` e `só uma de duas ONGs que aceitam a mesma doação ao mesmo tempo fica com ela`, demo, passo 7 (400 e consulta ao banco mostrando a doação ainda com a primeira ONG). A permanência da 1ª ONG não tem assert automatizado, só a consulta do passo 7. |
| 3 | **História 1.** Dado que o doador informou tipo, quantidade e validade, quando ele envia o formulário de publicação, então a doação é criada com status "disponível" e passa a aparecer na lista de doações disponíveis. | `não atende` | Demo, passo 8 (os três campos sozinhos recebem 400), teste `recusa a publicação sem nome e telefone do doador`. Com nome e telefone a doação é criada e listada (testes `grava nome e telefone do doador ao publicar com os dados completos` e `mostra a doação publicada na lista de disponíveis`, demo, passos 3–4). |
| 4 | **História 1.** Dado que o doador deixou tipo, quantidade ou validade em branco, quando ele tenta enviar o formulário, então a API recusa a publicação (nenhuma doação é criada) e a lista de disponíveis não muda. | `parcial` | Teste `recusa doação sem os campos obrigatórios`. Campo ausente ou vazio é recusado, só espaços não (ver abaixo). |
| 5 | **História 3.** Dado que uma doação foi publicada e depois aceita por uma ONG, quando alguém consulta essa doação, então é possível observar tanto o instante de publicação quanto o instante do aceite. | `parcial` | Teste `devolve os instantes de publicação e aceite como texto AAAA-MM-DD HH:MM:SS, e o aceite vazio antes de aceitar` (resposta do aceite), demo, passo 6 (consulta ao banco). |
| 6 | **História 3.** Dado que uma doação foi publicada e ainda não foi aceita por nenhuma ONG, quando alguém a consulta, então o instante de aceite aparece vazio, sem quebrar a listagem de disponíveis. | `atende` | Mesmo teste do item 5 (`aceita_em` é `null` na listagem), demo, passo 4. |
| 7 | **História 2.** Dado que o doador informou tipo, quantidade, validade, nome e telefone, quando ele envia o formulário de publicação, então a doação é criada com o nome e o telefone gravados e eles aparecem na lista de doações disponíveis. | `parcial` | Pela API: testes `grava nome e telefone do doador ao publicar com os dados completos`, `mostra nome e telefone do doador na lista de doações disponíveis` e `mantém nome e telefone do doador depois que a ONG aceita a doação`, demo, passos 3–4. O formulário da tela não tem esses campos (ver abaixo). |
| 8 | **História 2.** Dado que o doador deixou nome ou telefone em branco, quando ele tenta enviar o formulário, então a API recusa com a mensagem "Nome e telefone do doador são obrigatórios", nenhuma doação é criada e a lista de disponíveis não muda. | `atende` | Testes `recusa a publicação sem nome e telefone do doador`, `recusa a publicação com nome mas sem telefone do doador`, `recusa a publicação com telefone mas sem nome do doador` e `recusa nome e telefone preenchidos só com espaços em branco`, demo, passo 8. A tela não exibe a mensagem ao usuário, mas o critério é sobre a resposta da API. |
 
## Critérios que não atendem — por quê
 
**Item 3 (`não atende`)**
- (a) **O que funciona:** com tipo, quantidade, validade e também nome e telefone do doador, a doação nasce `disponivel` e aparece na lista (passos 3–4).
- (b) **O que falta:** o critério, como escrito, não se cumpre: os três campos sozinhos recebem 400 por falta de nome e telefone. Além disso, o formulário de `public/index.html` tem só esses três campos, então publicar pela tela falha em silêncio (400, sem mensagem).
- (c) **Justificativa:** a Regra 1 (rastreabilidade pela Vigilância) venceu o conflito de prioridade já decidido na Análise ("a segurança ganhou sem conversa") e foi implementada na fatia 1 da história 2, na API. A tela e o texto deste critério não foram atualizados na mesma fatia.
 
**Item 4 (`parcial`)**
- (a) **O que funciona:** tipo, quantidade ou validade ausentes ou vazios (`""`) são recusados com 400, e nenhuma doação é criada.
- (b) **O que falta:** um valor só com espaços (ex.: `"tipo":"   "`) passa e cria a doação (`201`), embora pareça em branco. A tela também não mostra a recusa ao doador.
- (c) **Justificativa:** o tratamento de texto só com espaços (`vazio()` em `src/doacoes.js`) foi escrito no escopo da história 2, só para nome e telefone. Estendê-lo aos outros três campos é correção pequena, adiada para não ampliar aquele PR, está nos próximos passos da Retrospectiva 3.
 
**Item 5 (`parcial`)**
- (a) **O que funciona:** `criada_em` e `aceita_em` são gravados, aparecem na resposta do aceite e no banco (passo 6).
- (b) **O que falta:** não existe rota nem tela para consultar uma doação já aceita (`GET /api/doacoes` lista só as disponíveis), e o tempo entre os dois instantes não é calculado. Hoje só se observa pela resposta do aceite ou direto no banco.
- (c) **Justificativa:** a iteração priorizou a migração, a história 2 e a proteção dos testes. A consulta exige uma rota nova cujo formato ainda não foi decidido.
 
**Item 7 (`parcial`)**
- (a) **O que funciona:** pela API, nome e telefone são gravados, aparecem na lista e permanecem depois do aceite.
- (b) **O que falta:** o formulário da tela não envia nome nem telefone, então "enviar o formulário" não cumpre o critério (mesma causa do item 3).
- (c) **Justificativa:** a fatia 1 da história 2 entregou a regra e a API, a interface ficou para uma fatia posterior.
 
## Mudanças de critério ao longo do semestre
 
Nenhum critério ficou `não verificável`. Houve estas mudanças:
- **Item 3 mudou de significado.** A Regra 1 passou a exigir nome e telefone, então o critério da História 1 deixou de bastar sozinho e hoje não se cumpre como escrito. Aprendemos que um critério de aceite precisa ser revisado quando uma regra nova o afeta, em vez de ficar escrito como estava.
- **Itens 7 e 8 são novos.** Nasceram com a história 2 nesta iteração e não existiam na Unidade 1.
- **Item 5 foi escrito supondo uma "consulta"** que o produto ainda não oferece. A Análise fatiou a história 3 para "só o necessário para medir", e a medição ficou no nível do registro dos instantes.
- **"disponível" × `disponivel`:** o texto dos critérios usa "disponível" com acento, e o valor gravado e testado é `disponivel`, sem acento. É só grafia e não muda o comportamento.
 
## Uso de IA
 
- **O que a IA gerou nesta iteração:**
  - a migração para PostgreSQL (`src/db.js`, `src/repositorio.js`, `vitest.config.js`) e os 3 testes de "comportamento preservado".
  - o código e os testes da história 2 (nome e telefone do doador).
  - uma proposta de teste de proteção de `limparBanco()`.
  - o rascunho de `docs/demo.md`, `docs/validacao.md` e `docs/retrospectivas/3.md`.
- **O que foi verificado:**
  - a suíte inteira (17 testes) rodou em PostgreSQL real e passou.
  - cada passo do `docs/demo.md` foi executado contra a aplicação rodando e os resultados conferem.
  - ao revisar, a verificação achou dois problemas que a IA não tinha dito: o formulário da tela não acompanhou a API (publicar pela tela falha em silêncio) e a checagem de `limparBanco()` aceita qualquer URL com `localhost`.
- **O que a IA errou e o grupo corrigiu:** a primeira versão da validação do doador aceitava nome e telefone só com espaços (`201`). O teste de caso limite falhou e a correção entrou em commit separado.