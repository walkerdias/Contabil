'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const RegraVersionadaRepository = require('./RegraVersionadaRepository');

function criarStorageMock() {
  return {
    findById: async () => null,
    findByCodigo: async () => [],
    findAll: async () => [],
    save: async regraVersionada => regraVersionada,
    delete: async () => true
  };
}

test('RegraVersionadaRepository deve ser instanciado com uma implementação de storage', () => {
  const storage = criarStorageMock();

  const repository = new RegraVersionadaRepository(storage);

  assert.ok(repository instanceof RegraVersionadaRepository);
  assert.equal(repository.storage, storage);
});

test('RegraVersionadaRepository deve rejeitar operações sem storage', async () => {
  const repository = new RegraVersionadaRepository();

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'Error',
      message:
        'RegraVersionadaRepository requer uma implementação de armazenamento.'
    }
  );
});

test('findById deve delegar a busca ao storage', async () => {
  const regra = {
    id: 1,
    codigo: 'SIMP_NAC_P1',
    versao: 1
  };

  const storage = criarStorageMock();

  let recebido;

  storage.findById = async id => {
    recebido = id;
    return regra;
  };

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.findById(1);

  assert.equal(recebido, 1);
  assert.deepEqual(resultado, regra);
});

test('findById deve rejeitar id ausente', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.findById(),
    {
      name: 'TypeError',
      message: 'O id da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findById(null),
    {
      name: 'TypeError',
      message: 'O id da regra versionada é obrigatório.'
    }
  );
});

test('findByCodigo deve retornar todas as versões do código informado', async () => {
  const versoes = [
    {
      id: 1,
      codigo: 'SIMP_NAC_P1',
      versao: 1
    },
    {
      id: 2,
      codigo: 'SIMP_NAC_P1',
      versao: 2
    },
    {
      id: 3,
      codigo: 'SIMP_NAC_P1',
      versao: 3
    }
  ];

  const storage = criarStorageMock();

  let recebido;

  storage.findByCodigo = async codigo => {
    recebido = codigo;
    return versoes;
  };

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.findByCodigo(
    'SIMP_NAC_P1'
  );

  assert.equal(recebido, 'SIMP_NAC_P1');
  assert.deepEqual(resultado, versoes);
});

test('findByCodigo deve preservar múltiplas versões da mesma regra', async () => {
  const versoes = [
    {
      id: 10,
      codigo: 'LP',
      versao: 1,
      vigenciaInicio: '2026-01-01',
      vigenciaFim: '2026-06-30'
    },
    {
      id: 11,
      codigo: 'LP',
      versao: 2,
      vigenciaInicio: '2026-07-01',
      vigenciaFim: null
    }
  ];

  const storage = criarStorageMock();

  storage.findByCodigo = async () => versoes;

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.findByCodigo('LP');

  assert.equal(resultado.length, 2);

  assert.equal(resultado[0].versao, 1);
  assert.equal(resultado[1].versao, 2);

  assert.equal(
    resultado[0].vigenciaInicio,
    '2026-01-01'
  );

  assert.equal(
    resultado[1].vigenciaInicio,
    '2026-07-01'
  );
});

test('findByCodigo deve rejeitar código ausente', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.findByCodigo(),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCodigo(null),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCodigo(''),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCodigo('   '),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );
});

test('findByCodigo deve rejeitar código que não seja string', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.findByCodigo(123),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCodigo({ codigo: 'LP' }),
    {
      name: 'TypeError',
      message:
        'O código da regra versionada é obrigatório.'
    }
  );
});

test('findByCodigo deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findByCodigo = async () => null;

  const repository = new RegraVersionadaRepository(storage);

  await assert.rejects(
    () => repository.findByCodigo('LP'),
    {
      name: 'TypeError',
      message:
        'RegraVersionadaRepository.findByCodigo() deve retornar um array.'
    }
  );
});

test('findAll deve retornar todas as regras versionadas', async () => {
  const regras = [
    {
      id: 1,
      codigo: 'SIMP_NAC_P1',
      versao: 1
    },
    {
      id: 2,
      codigo: 'SIMP_NAC_P2',
      versao: 1
    },
    {
      id: 3,
      codigo: 'LP',
      versao: 1
    }
  ];

  const storage = criarStorageMock();

  storage.findAll = async () => regras;

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.findAll();

  assert.deepEqual(resultado, regras);
});

test('findAll deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findAll = async () => null;

  const repository = new RegraVersionadaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message:
        'RegraVersionadaRepository.findAll() deve retornar um array.'
    }
  );
});

test('save deve delegar a regra versionada ao storage', async () => {
  const regra = {
    id: 1,
    codigo: 'SIMP_NAC_P1',
    versao: 1,
    vigenciaInicio: '2026-01-01',
    vigenciaFim: null
  };

  const storage = criarStorageMock();

  let recebido;

  storage.save = async regraVersionada => {
    recebido = regraVersionada;
    return regraVersionada;
  };

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.save(regra);

  assert.equal(recebido, regra);
  assert.deepEqual(resultado, regra);
});

test('save deve rejeitar regra versionada ausente', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.save(),
    {
      name: 'TypeError',
      message: 'A regra versionada é obrigatória.'
    }
  );

  await assert.rejects(
    () => repository.save(null),
    {
      name: 'TypeError',
      message: 'A regra versionada é obrigatória.'
    }
  );
});

test('save deve rejeitar regra versionada que não seja objeto', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.save('regra'),
    {
      name: 'TypeError',
      message:
        'A regra versionada deve ser um objeto.'
    }
  );

  await assert.rejects(
    () => repository.save(10),
    {
      name: 'TypeError',
      message:
        'A regra versionada deve ser um objeto.'
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

  const repository = new RegraVersionadaRepository(storage);

  const resultado = await repository.delete(10);

  assert.equal(recebido, 10);
  assert.equal(resultado, true);
});

test('delete deve rejeitar id ausente', async () => {
  const repository = new RegraVersionadaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.delete(),
    {
      name: 'TypeError',
      message:
        'O id da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.delete(null),
    {
      name: 'TypeError',
      message:
        'O id da regra versionada é obrigatório.'
    }
  );
});

test('RegraVersionadaRepository deve validar o contrato do storage', async () => {
  const storage = {
    findById: async () => null
  };

  const repository = new RegraVersionadaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message:
        /A implementação de armazenamento deve possuir o método findByCodigo/
    }
  );
});

test('RegraVersionadaRepository deve propagar erros do storage', async () => {
  const storage = criarStorageMock();

  storage.findByCodigo = async () => {
    throw new Error('Erro de persistência');
  };

  const repository = new RegraVersionadaRepository(storage);

  await assert.rejects(
    () => repository.findByCodigo('LP'),
    {
      name: 'Error',
      message: 'Erro de persistência'
    }
  );
});