# Documento de Análise — Prato Cheio

_Trabalho 1 · máximo 4 páginas · entrega na Aula 5_

## Problema central

Hoje, doadores (restaurantes, padarias, mercados) e ONGs se falam por grupos de WhatsApp, sem organização e sem histórico. Resultado: as ONGs ficam sabendo tarde demais que tem doação disponível, e quando isso acontece com alimento perecível, a comida já estragou antes de alguém buscar. O problema de verdade não é "falta um app", é que não existe um jeito confiável de avisar, na hora certa, que tem comida disponível. Isso gera desperdício de comida boa, menos gente sendo atendida e demora entre a doação ficar pronta e ser coletada.

## Incertezas

1. **Volume real de doações diárias e taxa de adesão de entidades receptoras:** O caso não dá nenhum número sobre isso, e sem saber o volume não dá pra saber nem que tamanho de sistema precisa ser construído.
2. **Confirmação de que o tempo de coleta constitui o gargalo do processo:** É só um palpite da Marta, sem nenhuma medição. Se o problema real for outro (tipo falta de voluntário ou de ONG com espaço pra guardar comida), a ferramenta não resolve nada.
3. **Disposição e frequência de cadastro por parte dos doadores:** Não tem garantia disso, nem de quantas vezes por dia. Isso muda completamente como o cadastro precisa ser desenhado — quanto mais chato de preencher, menos gente usa.
4. **Definição operacional do critério de proximidade logística entre doador e entidade receptora:** O caso fala que ONG perto do doador leva vantagem, mas não explica como isso é decidido: por distância, por bairro, por quem responde primeiro? Sem isso definido, não dá pra desenhar o banco de dados nem a regra de quem "ganha"a doação.
5. **Escopo exato das exigências de rastreabilidade impostas pela vigilância sanitária:** O caso cita "tipo, quantidade e validade"como mínimo, mas isso pode não ser tudo. Se depois aparecer mais exigência, o cadastro e o banco de dados vão ter que ser refeitos.

## Stakeholders

| Stakeholder              | Interesse | Influência | O que espera                                                                          | O que muda na iteração 1                                                                                                                                            |
| ------------------------ | --------- | ---------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Doadores                 | Médio     | Alta       | Doar sem burocracia e com retirada rápida, não quer perder tempo cadastrando produto. | São os primeiros que a gente precisa ouvir sobre o que é díficl de preencher. É por causa deles que o cadastro ficou só com tipo, quantidade e validade, nada mais. |
| ONGs                     | Alto      | Médio      | Saber com antecedência o que vai chegar, pra conseguir planejar as refeições.         | São elas que vão confirmar se só "tipo + quantidade + validade" já é suficiente pra decidir se aceitam, sem precisar ligar perguntando mais coisa.                  |
| Entregadores Voluntários | Médio     | Baixo      | Um sistema simples de usar no celular.                                                | Ficam de fora por enquanto — a história zero vai só até a ONG aceitar a doação, não chega na parte da coleta.                                                       |
| Marta                    | Alto      | Alto       | Crescer e mostrar resultado pra conseguir apoio.                                      | É ela quem decide se o caminho mínimo (publicar → ver → aceitar) é piloto suficiente, e o que fica pra depois.                                                      |
| Vigilância sanitária     | Baixo     | Alta       | Um registro mínimo de cada doação.                                                    | A gente nem conversa com ela ainda, mas os três campos que ela exige já entram sem discussão, porque isso é regra, não é coisa que dá para negociar.                |
| Quem recebe a comida     | Alto      | Nulo       | Receber as doações com frequência.                                                    | Eles não entram em nenhuma conversa nossa nessa iteração, quem fala por eles é a ONG.                                                                               |

## Objetivos de impacto

1. **Diminuir a quantidade de comida boa que é jogada fora.**

- **Como vamos medir:** % das doações publicadas que vencem sem ninguém aceitar por semana no bairro.
- **De onde parte esse número:** No momento ainda não temos nenhum dado para calcular porque isso nunca foi medido. Vamos começar a medir já na primeira semana.
- **Pra onde queremos ir:** Esse número tem que cair, semana após semana, comparado com as semanas anteriores.

2. **Aumentar quantas refeições chegam pra quem precisa.**

- **Como vamos medir:** Quantidade de doações aceitas e realmente coletadas por semana.
- **De onde parte:** Também não sabemos hoje, o caso nem diz quantas ONGs vão entrar. A contagem começa no primeiro dia.
- **Pra onde queremos ir:** esse número deve crescer, semana a semana.

3. **Diminuir o tempo entre a comida ficar disponível e ser coletada.**

- **Como vamos medir:** Tempo médio, em horas, entre a doação ser publicada e ser aceita por alguma ONG.
- **De onde parte:** a Marta acha que esse é o gargalo, mas ninguém mediu isso ainda. Então iremos analisar os dados da primeira semana e se possível colocar as doações para serem aceitas apenas nos bairros publicados.
- **Pra onde queremos ir:** Esse tempo médio precisa cair ao longo das entregas.

## Regras de negócio

**Regra 1 – identificação do doador**

- **Origem:** Derivada (a vigilância não fala "nome e telefone", mas sem isso não dá pra rastrear).
- **Enunciado:** Toda doação publicada precisa ter nome completo e telefone de contato do doador.
- **Como verificar:** Tentar cadastrar sem esses dados, o sistema barra e mostra a mensagem "Nome e telefone do doador são obrigatórios".

**Regra 2 – Tipo de alimento com lista fechada**

- **Origem:** Inventada (a gente padronizou pra facilitar busca).
- **Enunciado:** O campo tipo de alimento é obrigatório e tem que escolher de uma lista: Refeição pronta, Padaria, Hortifruti, Laticínios, etc. Não pode escrever texto livre.
- **Como verificar:** Abrir o formulário de doação e ver que o campo é um dropdown com essas opções. Enviar com "tipo" vazio é recusado.

**Regra 3 – Prazo pra ONG retirar**

- **Origem:** ausente (o caso não diz o que acontece se a ONG aceita e não busca).
- **Enunciado:** Se a ONG aceitar e não confirmar a retirada em 2 horas, a doação volta pra 'disponível' e a ONG perde a reserva.
- **Como verificar:** Simular aceitação, não confirmar retirada e checar que depois de 120 minutos a doação fica livre de novo.
- **Quem decide:** Marta e as ONGs do piloto, até a data de revisão do piloto. Enquanto isso, vale a regra que foi inventada.

## Conflitos de prioridade

**Conflito escolhido:** A vigilância precisa rastrear quem está doando; o doador quer só fazer a boa ação rápido, sem ter que dar seus dados.

**Fala de cada lado:**

- **Vigilância/Sistema:** "Eu preciso do nome e do telefone de quem doou. Se der algum problema com a comida, eu tenho que saber o nome do doador."

- **Doador:** "Poxa, eu só quero entregar a comida e ajudar. Não quero ficar preenchendo cadastro nem dar meu número pessoal."

- **Qual é a briga de verdade:** É a segurança brigando com a praticidade. Para garantir que a comida não vai fazer mal a ninguém, a gente precisa pedir esses dados. O problema é que criar essa barreira de cadastro pode dar preguiça ou desanimar quem só queria fazer uma doação rápida e sem compromisso.

- **O que cada lado perde:** Se o sistema aceitar doação anônima, a gente perde o controle e fica correndo o risco de passar comida pra frente sem saber de onde veio. Por outro lado, se a gente exigir os dados, o doador perde a praticidade, e a gente corre o risco de ele achar burocrático demais e desistir de doar.

- **Qual é o critério pra decidir:** Como a base dessa regra vem da necessidade da vigilância sanitária, não dá para negociar. Rastrear a comida é o mais importante. É melhor a gente correr o risco de perder um ou outro doador por causa do cadastro do que deixar circular comida de origem desconhecida que pode intoxicar alguém.

- **Qual saída a gente usou:** A segurança ganhou sem conversa. A gente simplesmente travou a doação anônima. Se a pessoa tentar publicar sem dar os dados, o sistema não deixa avançar e mostra a mensagem na tela: "Nome e telefone do doador são obrigatórios". Assim a gente garante que nenhuma comida entre no aplicativo sem ter o responsável amarrado a ela.

## Histórias de usuário

| #   | História (Como… quero… para…)                                                                                                                                                                                                                                                                                           | INVEST: o que falha                                                                                                                                                     | Ação corretiva                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ★   | Como ONG receptora, quero aceitar uma doação disponível e vê-la sumir da lista para as demais, para que nenhum voluntário seja mandado atrás de uma doação que outra ONG já garantiu.                                                                                                                                   | Independente: depende de existir doação publicada e listada antes; é o alicerce de tudo, não dá pra reordenar.                                                          | Mantém-se assim mesmo falhando: é a exceção prevista pelo INVEST, o valor desta história é para o time (monta o caminho de entrega ponta a ponta e produz a medição de tempo publicação→aceite que a Aula 2 mostrou não existir), não para um usuário específico. Não caçamos independência artificial aqui. |
| 1   | Como doador (restaurante, padaria ou mercado), quero publicar uma doação em menos de 30 segundos, para não desistir no meio do cadastro e a comida sair da cozinha antes de estragar.                                                                                                                                   | Negociável: a primeira redação já vinha com "formulário com tipo em lista suspensa, quantidade em campo numérico, validade em seletor de data e botão azul 'Publicar'". | Tiramos o desenho de tela de dentro da história e movemos dropdown/datepicker/cor do botão para os critérios de aceite e o protótipo; a história ficou só com o comportamento e o tempo-limite observável.                                                                                                   |
| 2   | Como vigilância sanitária, quero que toda doação publicada tenha nome completo e telefone do doador registrados, para conseguir rastrear a origem se algum alimento fizer mal a alguém.                                                                                                                                 | Testável: a primeira versão dizia só "quero garantir a rastreabilidade das doações", sem nenhuma condição observável.                                                   | Reescrevemos como Dado/Quando/Então usando a Regra 1 já registrada neste documento: dado que o doador tenta publicar sem nome/telefone, quando envia o formulário, então o sistema recusa e mostra "Nome e telefone do doador são obrigatórios".                                                             |
| 3   | Como Marta, quero ver o tempo entre a publicação e o aceite de cada doação, para confirmar se a coleta é mesmo o gargalo antes de mudar qualquer processo.                                                                                                                                                              | Pequena: a primeira versão era "um relatório completo de doações, aceites e voluntários, para gerenciar tudo", com "e" no meio e cara de módulo inteiro.                | Fatiamos e deixamos só a métrica que valida (ou derruba) a hipótese da Marta nesta iteração, tempo entre publicação e aceite. Relatório de voluntários e gestão completa viram backlog da iteração 2, não são descartados.                                                                                   |
| 4   | Como voluntário, quero confirmar que retirei uma doação, para a Marta saber quanto tempo a coleta realmente leva e eu não continuar "responsável" por uma doação que já não está comigo.                                                                                                                                | Valiosa: a primeira versão era "como voluntário, quero confirmar a coleta, para que o sistema registre a coleta": valor do sistema, não de alguém.                      | Achamos quem sente falta de verdade (a Marta, que precisa da medição; e o próprio voluntário, que não quer ficar de posse "fantasma" de uma doação já entregue) e reescrevemos o "para" apontando pra eles.                                                                                                  |
| 5   | _(fatia 1/3 do gigante "Como ONG, quero encontrar e aceitar a doação certa para mim")_ Como ONG receptora, quero ver a lista completa de doações disponíveis (ordem de publicação) com tipo, quantidade e validade, e aceitar com um clique só, para decidir com o mínimo de informação, sem depender de nenhum filtro. | Independente: pelo mesmo motivo da história zero.                                                                                                                       | Mantemos mesmo assim: é a "linha dos mínimos" do método hambúrguer e converge com o núcleo funcional da história zero (★) evidência de que a primeira fatia se escolhe por risco, não por valor. É a base sobre a qual as fatias 2 e 3 se apoiam.                                                            |
| 6   | _(fatia 2/3 do gigante)_ Como ONG receptora, quero filtrar a lista de doações por tipo de alimento, para não perder tempo lendo itens que a minha organização não recebe.                                                                                                                                               | Estimável: não sabemos hoje se a lista fechada de tipos (Regra 2) cobre os casos reais das ONGs do piloto.                                                              | Spike de 1h conversando com 2 ONGs do piloto para confirmar se a lista fechada de tipos já é suficiente, antes de estimar o filtro.                                                                                                                                                                          |
| 7   | _(fatia 3/3 do gigante)_ Como ONG receptora, quero ver um resumo da doação (tipo, quantidade, validade e nome do doador) antes de confirmar o aceite, para não travar por engano uma doação que não vou conseguir buscar.                                                                                               | Negociável: a primeira versão já vinha com "uma modal de confirmação com dois botões, 'Confirmar' verde e 'Cancelar' cinza".                                            | Tiramos a modal e as cores da história e deixamos como critério de aceite; a história descreve só o comportamento (mostrar o resumo antes de travar a reserva).                                                                                                                                              |

**★ História zero — por que ela e o que ficou fora**

_Por que ela:_ a regra de negócio central do caso é que, depois que uma ONG aceita uma doação, ela some para as outras, sem essa regra funcionando de ponta a ponta (publicar → listar → aceitar com trava de concorrência), nenhuma das outras histórias tem base para se apoiar, e a Aula 2 mostrou que hoje não existe nenhuma medição do tempo entre publicação e aceite; a história zero é a única fatia que produz essa linha de base (por isso registra os dois instantes — publicação e aceite —, mesmo que isso signifique acrescentar uma coluna nova no schema além do que os cinco `it.todo` já cobrem).

_O que ficou FORA da fatia, e por quê (risco ou medição, nunca "é difícil"):_

- **Autenticação de doador e de ONG**: não exercita a regra central (aceitar → sair da lista) nem produz nenhuma medição; é atrito adicionado sem reduzir risco.
- **Filtro por proximidade**: o caso só registra que ONG perto do doador "leva vantagem" como fato observado, não como regra decidida (Aula 2); implementar o filtro hoje transformaria um fato em regra de prioridade sem dono definido.
- **Notificação em tempo real**: o orçamento do piloto é próximo de zero e não há canal definido; um canal de notificação sem esse custo validado é risco de estourar a restrição de negócio do caso.
- **Foto da doação**: não está em nenhum dos cinco `it.todo` nem na regra central; não reduz risco de concorrência nem produz medição, é luxo, não walking skeleton.
- **Expiração automática da reserva (Regra 3 — prazo de 120 minutos)**: a Regra 3 está classificada neste documento como "origem: ausente"; Marta e as ONGs do piloto ainda precisam ratificá-la. Implementar antes disso seria decidir uma regra de negócio sem dono.

## Critérios de aceite

**★ História zero — ONG aceita uma doação e ela sai da lista**

- Dado que existe uma doação publicada com status "disponível", quando uma ONG a aceita, então a doação passa para o status "aceita", registra o instante do aceite e deixa de aparecer na lista de doações disponíveis.
- Dado que uma doação já foi aceita por uma ONG, quando uma segunda ONG tenta aceitar essa mesma doação, então a API recusa a segunda tentativa e a doação permanece aceita apenas pela primeira ONG.

**História 1 — Doador publica uma doação em menos de 30 segundos**

- Dado que o doador informou tipo, quantidade e validade, quando ele envia o formulário de publicação, então a doação é criada com status "disponível" e passa a aparecer na lista de doações disponíveis.
- Dado que o doador deixou tipo, quantidade ou validade em branco, quando ele tenta enviar o formulário, então a API recusa a publicação (nenhuma doação é criada) e a lista de disponíveis não muda.

**História 2 — Vigilância sanitária: toda doação identifica o doador (fatia 1: obrigatório e gravado)**

- Dado que o doador informou tipo, quantidade, validade, nome e telefone, quando ele envia o formulário de publicação, então a doação é criada com o nome e o telefone gravados e eles aparecem na lista de doações disponíveis.
- Dado que o doador deixou nome ou telefone em branco, quando ele tenta enviar o formulário, então a API recusa com a mensagem "Nome e telefone do doador são obrigatórios", nenhuma doação é criada e a lista de disponíveis não muda.

**História 3 — Marta vê o tempo entre publicação e aceite**

- Dado que uma doação foi publicada e depois aceita por uma ONG, quando alguém consulta essa doação, então é possível observar tanto o instante de publicação quanto o instante do aceite.
- Dado que uma doação foi publicada e ainda não foi aceita por nenhuma ONG, quando alguém a consulta, então o instante de aceite aparece vazio, sem quebrar a listagem de disponíveis.

## Riscos

_Escala usada: alta / média / baixa._

| Risco                                                                                                                                                           | Probabilidade | Impacto | Mitigação                                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Um integrante do grupo não conseguir concluir sua parte do walking skeleton a tempo do prazo de 03/09.                                                          | Média         | Alta    | Até 28/08, o grupo divide `src/repositorio.js` e `src/doacoes.js` em tarefas por pessoa; cada um abre PR parcial até 31/08, deixando tempo de revisão antes da entrega. |
| O repositório ser clonado dentro de uma pasta sincronizada (OneDrive/Drive/Dropbox), fazendo o SQLite falhar com `disk I/O error` na hora da defesa individual. | Baixa         | Média   | Até 02/09, cada integrante confirma que seu clone local está fora de pastas sincronizadas, rodando `npm test` uma vez antes da Prova 1.                                 |

## Hipótese e experimento

Acreditamos que doadores como restaurantes, padarias e mercados aceitam cadastrar cada doação no aplicativo, mesmo sem nenhuma automação (leitura de nota fiscal, preenchimento automático), desde que o formulário leve menos de 30 segundos para preencher.

Saberemos que estávamos errados se, ao cronometrar o preenchimento do formulário com 3 doadores reais (ou substitutos que representem o perfil), a média do tempo de preenchimento for maior que 60 segundos, ou se 2 dos 3 desistirem no meio do processo.

Como medimos: cronometrando pelo celular, do início do preenchimento até o clique em "publicar", numa sessão presencial ou por vídeo-chamada — usando o walking skeleton já rodando localmente, sem precisar de nada em produção.

## Decisão de análise

- **Problema:** definir o que entra e o que fica fora da fatia mínima (história zero) para o walking skeleton rodar dentro do prazo do Trabalho 1.
- **Alternativas:**
    - **A — História zero + autenticação básica de doador e ONG:** ganha rastreabilidade mais forte de quem publica e quem aceita; perde tempo de desenvolvimento e risco de não fechar o walking skeleton no prazo de 03/09.
    - **B — Apenas a história zero (publicar → listar → aceitar com trava de concorrência), sem autenticação, filtro de proximidade, notificação, foto ou expiração automática da reserva:** ganha uma entrega funcional e testável dentro do prazo; perde completude e segurança, que ficam para as próximas iterações.
- **Decisão e justificativa:** escolhemos a alternativa B. Ela está ligada ao objetivo de impacto "diminuir o tempo entre a comida ficar disponível e ser coletada" — a linha de base (tempo publicação → aceite) só existe se a história zero estiver rodando ponta a ponta —, e ao risco de estourar o prazo do Trabalho 1 já registrado na tabela acima.
- **Riscos e limitações:** sem autenticação, qualquer pessoa pode se passar por doador ou por ONG durante o piloto; sem a expiração automática da reserva (Regra 3), uma doação aceita e não retirada fica presa indefinidamente até alguém resolver manualmente.

## Uso de IA

O que geramos com IA, o que verificamos e o que alteramos.

Este registro é por linha da tabela `## Histórias de usuário`.

**Linha 1 - Doador publica rápido**

- **O que a IA gerou:** a primeira versão veio com a interface pronta dentro da própria história ("formulário com tipo em lista suspensa, quantidade em campo numérico, validade em seletor de data e um botão azul 'Publicar'") e, junto, sugeriu uma regra que ninguém pediu: salvar rascunho automaticamente a cada campo preenchido.
- **O que mudamos e por quê:** tiramos a interface de dentro da história, virou critério de aceite/protótipo e não incorporamos o autosave.
- **Regra que ela inventou e quem decide:** "salvar rascunho automaticamente" não existe no caso e colide com a restrição técnica (conexão instável em campo): se o autosave falhar no meio e o doador achar que já publicou, o dado se perde sem aviso. Quem decide se vale a pena é a **Marta**, junto com os doadores do piloto, não o grupo.

**Linha 3 - Marta / medição**

- **O que a IA gerou:** a primeira versão era "um relatório completo de doações, aceites e voluntários, para gerenciar tudo", e a IA emendou uma regra extra: enviar e-mail semanal automático para a Marta com o resumo.
- **O que mudamos e por quê:** fatiamos a história para o tamanho da métrica que valida a hipótese da Marta nesta iteração (tempo publicação → aceite) e cortamos o envio de e-mail, que virou item de backlog.
- **Regra que ela inventou e quem decide:** frequência e canal de um relatório automático não estão no caso, e o piloto tem orçamento próximo de zero, e-mail automático tem custo de infraestrutura que ninguém validou. Quem decide é a **Marta**.

**Linha 7 - Fatia 3 do gigante (resumo antes de confirmar)**

- **O que a IA gerou:** a primeira versão trazia "uma modal de confirmação com dois botões, 'Confirmar' verde e 'Cancelar' cinza", sem dizer o que acontece se a confirmação falhar no meio do caminho.
- **O que mudamos e por quê:** tiramos a modal e as cores viraram critério de aceite e sinalizamos a lacuna abaixo.
- **O erro de restrição que sumiu:** nenhuma regra de negócio nova apareceu aqui, mas a restrição do caso "roda no navegador do celular do voluntário, com internet ruim" desapareceu do rascunho gerado: a IA assumiu confirmação síncrona e não tratou o que acontece se a requisição não voltar. Como é restrição já dada pelo caso (não regra nova a inventar), não precisa de um "dono" novo para decidir _se_ ela vale, só precisa ser reincorporada. O comportamento exato de retry/mensagem de erro fica como decisão do grupo, validada com a **Marta** na revisão do piloto.
