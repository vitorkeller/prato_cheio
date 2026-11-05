import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { criarApp } from '../src/app.js';
import { migrar, limparBanco, encerrar } from '../src/db.js';

const app = criarApp();
const doador = { doador_nome: 'Maria da Silva', doador_telefone: '47999990000' };

// Este teste já passa e não depende do banco:
// prova que a aplicação sobe e que o CI está funcionando.
describe('a aplicação sobe', () => {
	it('responde na verificação de saúde', async () => {
		const res = await request(app).get('/api/saude');
		expect(res.status).toBe(200);
		expect(res.body.ok).toBe(true);
	});
});

// ---------------------------------------------------------------------------
// Backlog de testes do walking skeleton.
// Cada `it.todo` é um critério de aceite ainda não implementado — o CI não
// falha por causa deles. À medida que o grupo implementa, troque `it.todo`
// por um `it` de verdade (veja o exemplo comentado no fim do arquivo).
//
// Os testes abaixo usam o banco — que na Unidade 1 é SQLite em memória:
// nada a instalar, nada a subir.
// ---------------------------------------------------------------------------

describe('publicar e listar doações', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	// Dado que um doador publicou uma doação
	// Quando uma ONG consulta as doações disponíveis
	// Então a doação aparece na lista
	it('mostra a doação publicada na lista de disponíveis', async () => {
		await request(app)
		.post('/api/doacoes')
		.send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01', ...doador });

		const res = await request(app).get('/api/doacoes');
		expect(res.status).toBe(200);
		expect(res.body).toHaveLength(1);
		expect(res.body[0].tipo).toBe('Sopa');
	});

	// Dado que o doador deixou tipo, quantidade ou validade em branco
	// Quando ele tenta enviar o formulário
	// Então a API recusa e nenhuma doação é criada
	it('recusa doação sem os campos obrigatórios', async () => {
		const res = await request(app)
		.post('/api/doacoes')
		.send({ tipo: 'Sopa' });

		expect(res.status).toBe(400);

		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});
});

describe('identificação do doador (história 2, fatia 1)', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	// Dado que o doador preencheu tipo, quantidade e validade, mas não informou nome nem telefone
	// Quando ele tenta publicar a doação
	// Então a API recusa com a mensagem da Regra 1 e nenhuma doação é criada
	it('recusa a publicação sem nome e telefone do doador', async () => {
		// Dado
		const semDoador = { tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' };

		// Quando
		const res = await request(app).post('/api/doacoes').send(semDoador);

		// Então
		expect(res.status).toBe(400);
		expect(res.body.erro).toBe('Nome e telefone do doador são obrigatórios');
		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});
});

describe('história 2 — doador identificado (critérios de aceite)', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	const doacao = { tipo: 'Pão', quantidade: '5kg', validade: '2026-08-02' };

	// Dado que o doador informou tipo, quantidade, validade, nome e telefone
	// Quando ele envia o formulário de publicação
	// Então a doação é criada como "disponivel" com o nome e o telefone gravados
	it('grava nome e telefone do doador ao publicar com os dados completos', async () => {
		// Dado
		const dados = { ...doacao, ...doador };

		// Quando
		const res = await request(app).post('/api/doacoes').send(dados);

		// Então
		expect(res.status).toBe(201);
		expect(res.body.status).toBe('disponivel');
		expect(res.body.doador_nome).toBe('Maria da Silva');
		expect(res.body.doador_telefone).toBe('47999990000');
	});

	// Dado que um doador identificado publicou uma doação
	// Quando uma ONG consulta as doações disponíveis
	// Então nome e telefone do doador aparecem na lista
	it('mostra nome e telefone do doador na lista de doações disponíveis', async () => {
		// Dado
		await request(app).post('/api/doacoes').send({ ...doacao, ...doador });

		// Quando
		const lista = await request(app).get('/api/doacoes');

		// Então
		expect(lista.body).toHaveLength(1);
		expect(lista.body[0].doador_nome).toBe('Maria da Silva');
		expect(lista.body[0].doador_telefone).toBe('47999990000');
	});

	// Dado que o doador informou o nome, mas deixou o telefone em branco
	// Quando ele tenta publicar
	// Então a API recusa com a mensagem da Regra 1 e nenhuma doação é criada
	it('recusa a publicação com nome mas sem telefone do doador', async () => {
		// Dado
		const dados = { ...doacao, doador_nome: 'Maria da Silva' };

		// Quando
		const res = await request(app).post('/api/doacoes').send(dados);

		// Então
		expect(res.status).toBe(400);
		expect(res.body.erro).toBe('Nome e telefone do doador são obrigatórios');
		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});

	// Dado que o doador informou o telefone, mas deixou o nome em branco
	// Quando ele tenta publicar
	// Então a API recusa com a mensagem da Regra 1 e nenhuma doação é criada
	it('recusa a publicação com telefone mas sem nome do doador', async () => {
		// Dado
		const dados = { ...doacao, doador_telefone: '47999990000' };

		// Quando
		const res = await request(app).post('/api/doacoes').send(dados);

		// Então
		expect(res.status).toBe(400);
		expect(res.body.erro).toBe('Nome e telefone do doador são obrigatórios');
		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});

	// --- Casos limite (B2): cenários que o critério original não previa ---

	// Dado que o doador preencheu nome e telefone só com espaços
	// Quando ele tenta publicar
	// Então a API recusa como se estivessem em branco e nenhuma doação é criada
	it('recusa nome e telefone preenchidos só com espaços em branco', async () => {
		// Dado
		const dados = { ...doacao, doador_nome: '   ', doador_telefone: '   ' };

		// Quando
		const res = await request(app).post('/api/doacoes').send(dados);

		// Então
		expect(res.status).toBe(400);
		expect(res.body.erro).toBe('Nome e telefone do doador são obrigatórios');
		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});

	// Dado que uma doação com doador identificado foi publicada
	// Quando uma ONG a aceita
	// Então a resposta do aceite continua trazendo nome e telefone do doador
	it('mantém nome e telefone do doador depois que a ONG aceita a doação', async () => {
		// Dado
		const criada = await request(app).post('/api/doacoes').send({ ...doacao, ...doador });

		// Quando
		const res = await request(app)
			.post(`/api/doacoes/${criada.body.id}/aceitar`)
			.send({ ong: 'ONG Esperança' });

		// Então
		expect(res.status).toBe(200);
		expect(res.body.status).toBe('aceita');
		expect(res.body.doador_nome).toBe('Maria da Silva');
		expect(res.body.doador_telefone).toBe('47999990000');
	});
});

describe('aceitar uma doação', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	// Dado que existe uma doação publicada com status "disponível"
	// Quando uma ONG aceita essa doação
	// Então a doação passa para o status "aceita"
	it('marca a doação como aceita pela ONG', async () => {
		const criada = await request(app)
		.post('/api/doacoes')
		.send({ tipo: 'Pão', quantidade: '5kg', validade: '2026-08-02', ...doador });

		const res = await request(app)
		.post(`/api/doacoes/${criada.body.id}/aceitar`)
		.send({ ong: 'ONG Esperança' });

		expect(res.status).toBe(200);
		expect(res.body.status).toBe('aceita');
		expect(res.body.ong).toBe('ONG Esperança');
	});

	it('remove a doação da lista de disponíveis depois de aceita', async () => {
		const criada = await request(app)
		.post('/api/doacoes')
		.send({ tipo: 'Leite', quantidade: '20L', validade: '2026-08-03', ...doador });

		await request(app)
		.post(`/api/doacoes/${criada.body.id}/aceitar`)
		.send({ ong: 'ONG Esperança' });

		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});

	// Dado que uma doação já foi aceita por uma ONG
	// Quando uma segunda ONG tenta aceitar a mesma doação
	// Então o sistema recusa a segunda tentativa
	it('recusa aceitar uma doação que já foi aceita por outra ONG', async () => {
		const criada = await request(app)
		.post('/api/doacoes')
		.send({ tipo: 'Arroz', quantidade: '30kg', validade: '2026-08-04', ...doador });

		await request(app)
		.post(`/api/doacoes/${criada.body.id}/aceitar`)
		.send({ ong: 'ONG Esperança' });

		const segundaTentativa = await request(app)
		.post(`/api/doacoes/${criada.body.id}/aceitar`)
		.send({ ong: 'ONG Solidária' });

		expect(segundaTentativa.status).toBe(400);
	});
});

describe('proteção contra apagar banco fora do ambiente de teste', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	// Dado que o banco em uso não é o de teste
	// Quando a limpeza é chamada
	// Então ela falha e nenhuma doação é apagada
	it('recusa limpar o banco quando DATABASE_FILE não indica um banco de teste', async () => {
		await request(app)
			.post('/api/doacoes')
			.send({ tipo: 'Arroz', quantidade: '50kg', validade: '2026-12-01', ...doador });

		const original = process.env.DATABASE_FILE;
		process.env.DATABASE_FILE = 'dados.sqlite'; // simula a configuração do piloto apontando pro banco real

		await expect(limparBanco()).rejects.toThrow(/não parece um banco de teste/);

		process.env.DATABASE_FILE = original; // restaura ':memory:' (vitest.config.js)

		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(1); // a doação continua lá — limparBanco() não rodou
	});
});

describe('comportamento preservado na migração para PostgreSQL', () => {
	beforeEach(async () => { await migrar(); await limparBanco(); });
	afterAll(async () => { await encerrar(); });

	// Dado que existe uma doação disponível
	// Quando duas ONGs tentam aceitá-la ao mesmo tempo
	// Então só uma vence e a outra é recusada
	it('só uma de duas ONGs que aceitam a mesma doação ao mesmo tempo fica com ela', async () => {
		// Dado
		const criada = await request(app).post('/api/doacoes').send({ tipo: 'Arroz', quantidade: '30kg', validade: '2026-08-04', ...doador });

		// Quando
		const respostas = await Promise.all([
			request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG Esperança' }),
			request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG Solidária' })
		]);

		// Então
		expect(respostas.map((r) => r.status).sort()).toEqual([200, 400]);
		const perdedora = respostas.find((r) => r.status === 400);
		expect(perdedora.body.erro).toBe('Doação já foi aceita por outra ONG');
		const lista = await request(app).get('/api/doacoes');
		expect(lista.body).toHaveLength(0);
	});

	// Dado que não existe doação com o id informado (id que não é número)
	// Quando uma ONG tenta aceitá-la
	// Então a API recusa com "Doação não encontrada" (e não com erro do banco)
	it('recusa aceitar uma doação cujo id não é um número com "Doação não encontrada"', async () => {
		// Dado / Quando
		const res = await request(app).post('/api/doacoes/abc/aceitar').send({ ong: 'ONG Esperança' });

		// Então
		expect(res.status).toBe(400);
		expect(res.body.erro).toBe('Doação não encontrada');
	});

	// Dado que uma doação foi publicada e depois aceita
	// Quando alguém consulta a doação aceita e a lista de disponíveis
	// Então o instante do aceite vem no formato "AAAA-MM-DD HH:MM:SS" e, antes do aceite, vem vazio
	it('devolve os instantes de publicação e aceite como texto AAAA-MM-DD HH:MM:SS, e o aceite vazio antes de aceitar', async () => {
		// Dado
		const criada = await request(app).post('/api/doacoes').send({ tipo: 'Leite', quantidade: '20L', validade: '2026-08-03', ...doador });
		const formato = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
		const antes = await request(app).get('/api/doacoes');

		// Quando
		const aceita = await request(app).post(`/api/doacoes/${criada.body.id}/aceitar`).send({ ong: 'ONG Esperança' });

		// Então
		expect(antes.body[0].criada_em).toMatch(formato);
		expect(antes.body[0].aceita_em).toBeNull();
		expect(aceita.body.criada_em).toMatch(formato);
		expect(aceita.body.aceita_em).toMatch(formato);
	});
});

/* Exemplo de como transformar um critério de aceite em teste.
   Descomente o beforeEach/afterAll quando começar a usar o banco.

  beforeEach(async () => { await migrar(); await limparBanco(); });
  afterAll(async () => { await encerrar(); });

  Dado que um doador publicou uma doação
  Quando uma ONG consulta as doações disponíveis
  Então a doação aparece na lista

  it('mostra a doação publicada na lista de disponíveis', async () => {
    await request(app)
      .post('/api/doacoes')
      .send({ tipo: 'Sopa', quantidade: '10 porções', validade: '2026-08-01' });

    const res = await request(app).get('/api/doacoes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].tipo).toBe('Sopa');
  });
*/
