// Camada de dados do Prato Cheio — acesso ao banco.
// TODO (grupo): implementar as quatro funções abaixo usando query().
// A conexão e o schema já estão prontos em src/db.js.
//
// Marcador de parâmetro é `?` (SQL parametrizado evita injeção):
//   const { rows } = await query('SELECT * FROM doacoes WHERE id = ?', [id]);
import { query } from './db.js';

// Insere a doação e devolve a linha criada.
export async function inserir({ tipo, quantidade, validade, doador_nome, doador_telefone }) {
	const { rows } = await query(
		`INSERT INTO doacoes (tipo, quantidade, validade, doador_nome, doador_telefone)
		VALUES ($1, $2, $3, $4, $5) RETURNING *`,
		[tipo, quantidade, validade, doador_nome, doador_telefone]
	);
	return rows[0];
}

// Devolve apenas as doações com status 'disponivel'.
export async function listarDisponiveis() {
	const { rows } = await query(
		`SELECT * FROM doacoes WHERE status = 'disponivel' ORDER BY criada_em ASC`
	);
	return rows;
}

// O PostgreSQL recusa com erro um id que não cabe em INTEGER ("abc", 99999999999);
// o SQLite apenas não achava a linha. Mantemos o comportamento antigo: id inválido = não existe.
const ID_MAXIMO = 2147483647;
function idValido(id) {
	return /^\d+$/.test(String(id)) && Number(id) <= ID_MAXIMO;
}

// Busca uma doação pelo id (devolve undefined se não existir).
export async function buscarPorId(id) {
	if (!idValido(id)) return undefined;
	const { rows } = await query(`SELECT * FROM doacoes WHERE id = $1`, [id]);
	return rows[0];
}

// Marca a doação como aceita pela ONG e devolve a linha atualizada.
// A trava de concorrência é o `AND status = 'disponivel'`: o banco só deixa uma ONG vencer.
export async function aceitar(id, ong) {
	const { rows } = await query(
		`UPDATE doacoes
			SET status = 'aceita', ong = $1, aceita_em = NOW()
		WHERE id = $2 AND status = 'disponivel'
		RETURNING *`,
		[ong, id]
	);
	return rows[0];
}
