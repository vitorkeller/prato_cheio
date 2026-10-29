// Regras de negócio das doações.
// TODO (grupo): implementar conforme as histórias e os critérios de aceite da Unidade 1.
import * as repo from './repositorio.js';

// História zero — "um doador publica uma doação".
// Critério: tipo, quantidade e validade são obrigatórios.
export async function criarDoacao({ tipo, quantidade, validade, doador_nome, doador_telefone }) {
	if (!tipo || !quantidade || !validade) {
		throw new Error('Tipo, quantidade e validade são obrigatórios');
	}
	// História 2 / Regra 1 (docs/analise.md): toda doação identifica o doador.
	// Texto só com espaços conta como em branco.
	if (vazio(doador_nome) || vazio(doador_telefone)) {
		throw new Error('Nome e telefone do doador são obrigatórios');
	}
	return repo.inserir({
		tipo,
		quantidade,
		validade,
		doador_nome: String(doador_nome).trim(),
		doador_telefone: String(doador_telefone).trim()
	});
}

function vazio(valor) {
	return valor == null || String(valor).trim() === '';
}

// História zero — "uma ONG vê as doações disponíveis".
export async function listarDisponiveis() {
  	return repo.listarDisponiveis();
}

// História zero — "uma ONG aceita uma doação".
// Regra do caso: uma doação aceita não fica disponível para outra ONG.
export async function aceitar(id, ong) {
	const existe = await repo.buscarPorId(id);
	if (!existe) {
		throw new Error('Doação não encontrada');
	}
	const atualizada = await repo.aceitar(id, ong);
	if (!atualizada) {
		throw new Error('Doação já foi aceita por outra ONG');
	}
	return atualizada;
}
