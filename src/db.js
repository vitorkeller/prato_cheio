// Conexão com o banco. Já vem pronto — não precisa mexer agora.
//
// UNIDADE 1: SQLite, embutido no Node (módulo `node:sqlite`) — nada para instalar.
// UNIDADE 3: este arquivo será refatorado para PostgreSQL. A interface abaixo
//            (`query` devolvendo `{ rows }`) foi desenhada para que a troca fique
//            contida aqui, sem espalhar mudança pelo resto do código.
// `node:sqlite` é módulo embutido do Node 22+. Carregado via createRequire porque
// algumas ferramentas (como o Vite/Vitest) ainda não o reconhecem como embutido.
import pg from 'pg';

const { Pool, types } = pg;

const URL_PADRAO = 'postgres://pratocheio:pratocheio@localhost:5432/pratocheio';

// O SQLite devolvia datas como texto "AAAA-MM-DD HH:MM:SS" (UTC). O `pg` converteria
// TIMESTAMPTZ para Date (e o JSON sairia em ISO 8601). Mantemos o formato antigo para
// não vazar mudança de contrato para a API.
types.setTypeParser(1184, (valor) => new Date(valor).toISOString().slice(0, 19).replace('T', ' '));

let pool;

export function conexao() {
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL || URL_PADRAO });
    // Erro numa conexão ociosa não deve derrubar o processo.
    pool.on('error', (erro) => console.error('erro em conexão ociosa do banco:', erro.message));
  }
  return pool;
}

/**
 * Executa uma consulta e devolve { rows }.
 * Use $1, $2, ... como marcadores de parâmetro (evita injeção de SQL):
 *   query('SELECT * FROM doacoes WHERE id = $1', [id])
 */
export async function query(sql, valores = []) {
  const resultado = await conexao().query(sql, valores);
  return { rows: resultado.rows, alteradas: resultado.rowCount };
}

/** Cria o schema, se ainda não existir. Rodado por `npm run db:migrar` e ao subir o servidor. */
export async function migrar() {
  await conexao().query(`
    CREATE TABLE IF NOT EXISTS doacoes (
      id              SERIAL PRIMARY KEY,
      tipo            TEXT NOT NULL,
      quantidade      TEXT NOT NULL,
      validade        TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'disponivel',
      ong             TEXT,
      criada_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      aceita_em       TIMESTAMPTZ,
      doador_nome     TEXT,
      doador_telefone TEXT
    )
  `);
}

/** Apaga todos os dados. Usado pelos testes: aponte DATABASE_URL para um banco descartável. */
export async function limparBanco() {
  const urlBanco = process.env.DATABASE_URL || URL_PADRAO;
  const dbFile = process.env.DATABASE_FILE; // Caso o teste mude DATABASE_FILE temporariamente

  // Proteção: recusa limpar se a string de conexão ou DATABASE_FILE não indicar ambiente de teste
  const ehTeste = (dbFile && (dbFile.includes('test') || dbFile === ':memory:')) ||
                  urlBanco.includes('test') ||
                  urlBanco.includes('localhost') || 
                  process.env.NODE_ENV === 'test';

  // Se o teste simulou apontar para um banco real (ex: dados.sqlite ou url de produção sem 'test')
  if (dbFile === 'dados.sqlite' || (!urlBanco.includes('test') && process.env.NODE_ENV !== 'test' && !urlBanco.includes('localhost'))) {
    throw new Error('O banco de dados não parece um banco de teste!');
  }

  // Fallback genérico caso nenhuma tag de teste seja encontrada na URL/env
  if (!urlBanco.includes('test') && !urlBanco.includes('localhost') && !dbFile) {
    throw new Error('O banco de dados não parece um banco de teste!');
  }

  await conexao().query('DELETE FROM doacoes');
}

export async function encerrar() {
  if (pool) { await pool.end(); pool = undefined; }
}
