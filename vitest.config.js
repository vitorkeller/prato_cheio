// Os testes usam o PostgreSQL de DATABASE_URL (no CI, o serviço `postgres` do workflow;
// local, o contêiner descrito no README). Sem DATABASE_URL, db.js usa o contêiner local.
export default {
  test: {}
};
