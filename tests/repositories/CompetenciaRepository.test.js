'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const CompetenciaRepository = require('./CompetenciaRepository');

function criarStorageMock() {
  return {
    findById: async () => null,
    findByAnoMes: async () => null,
    findAll: async () => [],
    save: async competencia => competencia,
    delete: async () => true
  };
}

test('CompetenciaRepository deve ser instanciado com uma implementação de storage', () => {
  const storage = criarStorageMock();

  const repository = new CompetenciaRepository(storage);

  assert.ok(repository instanceof CompetenciaRepository);
  assert.equal(repository.storage, storage);
});

test('CompetenciaRepository deve rejeitar operações sem storage', async () => {
  const repository = new CompetenciaRepository();

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'Error',
      message: 'CompetenciaRepository requer uma implementação de armazenamento.'
    }
  );
});

test('findById deve delegar a busca ao storage', async () => {
  const competencia = {
    id: 1,
    ano: 2026,
    mes: 1
  };

  const storage = criarStorageMock();

  let recebido;

  storage.findById = async id => {
    recebido = id;
    return competencia;
  };

  const repository = new CompetenciaRepository(storage);

  const resultado = await repository.findById(1);

  assert.equal(recebido, 1);
  assert.deepEqual(resultado, competencia);
});

test('findById deve rejeitar id ausente', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findById(),
    {
      name: 'TypeError',
      message: 'O id da competência é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findById(null),
    {
      name: 'TypeError',
      message: 'O id da competência é obrigatório.'
    }
  );
});

test('findByAnoMes deve delegar ano e mês ao storage', async () => {
  const competencia = {
    id: 1,
    ano: 2026,
    mes: 1
  };

  const storage = criarStorageMock();

  let anoRecebido;
  let mesRecebido;

  storage.findByAnoMes = async (ano, mes) => {
    anoRecebido = ano;
    mesRecebido = mes;

    return competencia;
  };

  const repository = new CompetenciaRepository(storage);

  const resultado = await repository.findByAnoMes(2026, 1);

  assert.equal(anoRecebido, 2026);
  assert.equal(mesRecebido, 1);
  assert.deepEqual(resultado, competencia);
});

test('findByAnoMes deve aceitar os meses de 1 a 12', async () => {
  const storage = criarStorageMock();

  const chamadas = [];

  storage.findByAnoMes = async (ano, mes) => {
    chamadas.push({ ano, mes });

    return {
      ano,
      mes
    };
  };

  const repository = new CompetenciaRepository(storage);

  await repository.findByAnoMes(2026, 1);
  await repository.findByAnoMes(2026, 12);

  assert.deepEqual(chamadas, [
    {
      ano: 2026,
      mes: 1
    },
    {
      ano: 2026,
      mes: 12
    }
  ]);
});

test('findByAnoMes deve rejeitar ano que não seja inteiro', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findByAnoMes('2026', 1),
    {
      name: 'TypeError',
      message: 'O ano da competência deve ser um número inteiro.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(2026.5, 1),
    {
      name: 'TypeError',
      message: 'O ano da competência deve ser um número inteiro.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(null, 1),
    {
      name: 'TypeError',
      message: 'O ano da competência deve ser um número inteiro.'
    }
  );
});

test('findByAnoMes deve rejeitar mês que não seja inteiro', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findByAnoMes(2026, '1'),
    {
      name: 'TypeError',
      message: 'O mês da competência deve ser um número inteiro.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(2026, 1.5),
    {
      name: 'TypeError',
      message: 'O mês da competência deve ser um número inteiro.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(2026, null),
    {
      name: 'TypeError',
      message: 'O mês da competência deve ser um número inteiro.'
    }
  );
});

test('findByAnoMes deve rejeitar mês menor que 1', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findByAnoMes(2026, 0),
    {
      name: 'RangeError',
      message: 'O mês da competência deve estar entre 1 e 12.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(2026, -1),
    {
      name: 'RangeError',
      message: 'O mês da competência deve estar entre 1 e 12.'
    }
  );
});

test('findByAnoMes deve rejeitar mês maior que 12', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findByAnoMes(2026, 13),
    {
      name: 'RangeError',
      message: 'O mês da competência deve estar entre 1 e 12.'
    }
  );

  await assert.rejects(
    () => repository.findByAnoMes(2026, 99),
    {
      name: 'RangeError',
      message: 'O mês da competência deve estar entre 1 e 12.'
    }
  );
});

test('findAll deve retornar todas as competências do storage', async () => {
  const competencias = [
    {
      id: 1,
      ano: 2026,
      mes: 1
    },
    {
      id: 2,
      ano: 2026,
      mes: 2
    }
  ];

  const storage = criarStorageMock();

  storage.findAll = async () => competencias;

  const repository = new CompetenciaRepository(storage);

  const resultado = await repository.findAll();

  assert.deepEqual(resultado, competencias);
});

test('findAll deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findAll = async () => null;

  const repository = new CompetenciaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message: 'CompetenciaRepository.findAll() deve retornar um array.'
    }
  );
});

test('save deve delegar a competência ao storage', async () => {
  const competencia = {
    id: 1,
    ano: 2026,
    mes: 1
  };

  const storage = criarStorageMock();

  let recebido;

  storage.save = async entidade => {
    recebido = entidade;
    return entidade;
  };

  const repository = new CompetenciaRepository(storage);

  const resultado = await repository.save(competencia);

  assert.equal(recebido, competencia);
  assert.deepEqual(resultado, competencia);
});

test('save deve rejeitar competência ausente', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.save(),
    {
      name: 'TypeError',
      message: 'A competência é obrigatória.'
    }
  );

  await assert.rejects(
    () => repository.save(null),
    {
      name: 'TypeError',
      message: 'A competência é obrigatória.'
    }
  );
});

test('save deve rejeitar competência que não seja objeto', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.save('competencia'),
    {
      name: 'TypeError',
      message: 'A competência deve ser um objeto.'
    }
  );

  await assert.rejects(
    () => repository.save(10),
    {
      name: 'TypeError',
      message: 'A competência deve ser um objeto.'
    }
  );
});

test('delete deve delegar o id ao storage', async () => {
  const storage = criarStorageMock();

  let recebido;

  storage.delete = async id => {
    recebido = id;
    return true;
  };

  const repository = new CompetenciaRepository(storage);

  const resultado = await repository.delete(10);

  assert.equal(recebido, 10);
  assert.equal(resultado, true);
});

test('delete deve rejeitar id ausente', async () => {
  const repository = new CompetenciaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.delete(),
    {
      name: 'TypeError',
      message: 'O id da competência é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.delete(null),
    {
      name: 'TypeError',
      message: 'O id da competência é obrigatório.'
    }
  );
});

test('CompetenciaRepository deve validar a implementação do storage', async () => {
  const storage = {
    findById: async () => null
  };

  const repository = new CompetenciaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message: /deve possuir o método findByAnoMes/
    }
  );
});

test('CompetenciaRepository deve propagar erros do storage', async () => {
  const storage = criarStorageMock();

  storage.findById = async () => {
    throw new Error('Erro de persistência');
  };

  const repository = new CompetenciaRepository(storage);

  await assert.rejects(
    () => repository.findById(1),
    {
      name: 'Error',
      message: 'Erro de persistência'
    }
  );
});