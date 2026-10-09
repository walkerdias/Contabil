"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const RegraResolver = require("./RegraResolver");

/**
 * Cria uma competência simples para os testes.
 *
 * O resolver utiliza a competência por contrato, portanto
 * uma string é suficiente para identificar o período.
 */
function criarCompetencia(ano, mes) {
  return `${ano}-${String(mes).padStart(2, "0")}`;
}

/**
 * Cria uma regra versionada simulada para testar o resolver
 * independentemente da implementação das demais classes.
 *
 * Vigência inclusiva: início <= competência <= fim.
 */
function criarRegra({
  codigo,
  versao,
  inicio,
  fim = null,
}) {
  return {
    codigo,
    versao,

    estaVigenteEm(competencia) {
      const periodo = competencia.toString();

      return (
        periodo >= inicio &&
        (fim === null || periodo <= fim)
      );
    },
  };
}

test("resolve a versão correta da regra para a competência", () => {
  const regra2025 = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2025-01",
    fim: "2025-12",
  });

  const regra2026 = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 2,
    inicio: "2026-01",
    fim: "2026-12",
  });

  const regra2027 = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 3,
    inicio: "2027-01",
  });

  const resolver = new RegraResolver([
    regra2025,
    regra2026,
    regra2027,
  ]);

  const resultado = resolver.resolver(
    "SIMP_NAC_P1",
    criarCompetencia(2026, 6)
  );

  assert.equal(resultado, regra2026);
  assert.equal(resultado.versao, 2);
});

test("lança erro quando não existe regra vigente", () => {
  const regra = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2025-01",
    fim: "2025-12",
  });

  const resolver = new RegraResolver([regra]);

  assert.throws(
    () =>
      resolver.resolver(
        "SIMP_NAC_P1",
        criarCompetencia(2026, 1)
      ),
    /Nenhuma regra vigente encontrada/
  );
});

test("retorna null quando tentarResolver não encontra regra", () => {
  const regra = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2025-01",
    fim: "2025-12",
  });

  const resolver = new RegraResolver([regra]);

  const resultado = resolver.tentarResolver(
    "SIMP_NAC_P1",
    criarCompetencia(2026, 1)
  );

  assert.equal(resultado, null);
});

test("lança erro quando existem versões sobrepostas", () => {
  const regraV1 = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2026-01",
    fim: "2026-12",
  });

  const regraV2 = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 2,
    inicio: "2026-06",
  });

  const resolver = new RegraResolver([
    regraV1,
    regraV2,
  ]);

  assert.throws(
    () =>
      resolver.resolver(
        "SIMP_NAC_P1",
        criarCompetencia(2026, 8)
      ),
    /Mais de uma versão.*está vigente/
  );
});

test("rejeita competência ausente ou nula", () => {
  const regra = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2025-01",
  });

  const resolver = new RegraResolver([regra]);

  assert.throws(
    () => resolver.resolver("SIMP_NAC_P1", null),
    /competencia é obrigatória/
  );

  assert.throws(
    () => resolver.resolver("SIMP_NAC_P1", undefined),
    /competencia é obrigatória/
  );
});

test("rejeita código inválido ou vazio", () => {
  const resolver = new RegraResolver([]);

  assert.throws(
    () => resolver.resolver("", "2026-01"),
    /codigo deve ser uma string não vazia/
  );

  assert.throws(
    () => resolver.resolver("   ", "2026-01"),
    /codigo deve ser uma string não vazia/
  );

  assert.throws(
    () => resolver.resolver(null, "2026-01"),
    /codigo deve ser uma string não vazia/
  );
});

test("rejeita competência sem regra com contrato de vigência", () => {
  const regra = {
    codigo: "SIMP_NAC_P1",
    versao: 1,
  };

  const resolver = new RegraResolver([regra]);

  assert.throws(
    () =>
      resolver.resolver(
        "SIMP_NAC_P1",
        criarCompetencia(2026, 1)
      ),
    /A regra deve implementar estaVigenteEm/
  );
});

test("resolve todas as regras aplicáveis à competência", () => {
  const regraSimples = criarRegra({
    codigo: "SIMP_NAC_P1",
    versao: 1,
    inicio: "2026-01",
  });

  const regraLucroPresumido = criarRegra({
    codigo: "LP",
    versao: 1,
    inicio: "2026-01",
  });

  const regraExpirada = criarRegra({
    codigo: "REGRA_ANTIGA",
    versao: 1,
    inicio: "2025-01",
    fim: "2025-12",
  });

  const resolver = new RegraResolver([
    regraSimples,
    regraLucroPresumido,
    regraExpirada,
  ]);

  const resultado = resolver.resolverTodas(
    criarCompetencia(2026, 6)
  );

  assert.equal(resultado.length, 2);
  assert.ok(resultado.includes(regraSimples));
  assert.ok(resultado.includes(regraLucroPresumido));
  assert.ok(!resultado.includes(regraExpirada));
});

test("rejeita sobreposição também em tentarResolver", () => {
  const regraV1 = criarRegra({
    codigo: "LP",
    versao: 1,
    inicio: "2026-01",
  });

  const regraV2 = criarRegra({
    codigo: "LP",
    versao: 2,
    inicio: "2026-06",
  });

  const resolver = new RegraResolver([
    regraV1,
    regraV2,
  ]);

  assert.throws(
    () =>
      resolver.tentarResolver(
        "LP",
        criarCompetencia(2026, 8)
      ),
    /Mais de uma versão.*está vigente/
  );
});

test("aceita coleção vazia e informa ausência de regra", () => {
  const resolver = new RegraResolver([]);

  assert.throws(
    () =>
      resolver.resolver(
        "SIMP_NAC_P1",
        criarCompetencia(2026, 1)
      ),
    /Nenhuma regra vigente encontrada/
  );

  assert.deepEqual(
    resolver.resolverTodas(criarCompetencia(2026, 1)),
    []
  );
});

test("rejeita coleção de regras que não seja um array", () => {
  assert.throws(
    () => new RegraResolver(null),
    /regras deve ser um array/
  );

  assert.throws(
    () => new RegraResolver({}),
    /regras deve ser um array/
  );
});