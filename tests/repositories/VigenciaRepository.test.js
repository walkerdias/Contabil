'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const VigenciaRepository = require('./VigenciaRepository');

function criarStorageMock() {
  return {
    findById: async () => null,
    findByRegraVersionadaId: async () => [],
    findAll: async () => [],
    save: async vigencia => vigencia,
    delete: async () => true
  };
}

test('VigenciaRepository deve ser instanciado com uma implementação de storage', () => {
  const storage = criarStorageMock();

  const repository = new VigenciaRepository(storage);

  assert.ok(repository instanceof VigenciaRepository);
  assert.equal(repository.storage, storage);
});

test('VigenciaRepository deve rejeitar operações sem storage', async () => {
  const repository = new VigenciaRepository();

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'Error',
      message:
        'VigenciaRepository requer uma implementação de armazenamento.'
    }
  );
});

test('findById deve delegar a busca ao storage', async () => {
  const vigencia = {
    id: 1,
    regraVersionadaId: 10,
    inicio: '2026-01-01',
    fim: '2026-06-30'
  };

  const storage = criarStorageMock();

  let recebido;

  storage.findById = async id => {
    recebido = id;
    return vigencia;
  };

  const repository = new VigenciaRepository(storage);

  const resultado = await repository.findById(1);

  assert.equal(recebido, 1);
  assert.deepEqual(resultado, vigencia);
});

test('findById deve rejeitar id ausente', async () => {
  const repository = new VigenciaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.findById(),
    {
      name: 'TypeError',
      message: 'O id da vigência é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findById(null),
    {
      name: 'TypeError',
      message: 'O id da vigência é obrigatório.'
    }
  );
});

test('findByRegraVersionadaId deve retornar as vigências da regra', async () => {
  const vigencias = [
    {
      id: 1,
      regraVersionadaId: 10,
      inicio: '2026-01-01',
      fim: '2026-06-30'
    },
    {
      id: 2,
      regraVersionadaId: 10,
      inicio: '2026-07-01',
      fim: null
    }
  ];

  const storage = criarStorageMock();

  let recebido;

  storage.findByRegraVersionadaId = async regraVersionadaId => {
    recebido = regraVersionadaId;
    return vigencias;
  };

  const repository = new VigenciaRepository(storage);

  const resultado =
    await repository.findByRegraVersionadaId(10);

  assert.equal(recebido, 10);
  assert.deepEqual(resultado, vigencias);
});

test('findByRegraVersionadaId deve preservar múltiplas vigências da mesma regra', async () => {
  const vigencias = [
    {
      id: 10,
      regraVersionadaId: 50,
      inicio: '2026-01-01',
      fim: '2026-03-31'
    },
    {
      id: 11,
      regraVersionadaId: 50,
      inicio: '2026-04-01',
      fim: '2026-06-30'
    },
    {
      id: 12,
      regraVersionadaId: 50,
      inicio: '2026-07-01',
      fim: null
    }
  ];

  const storage = criarStorageMock();

  storage.findByRegraVersionadaId = async () => vigencias;

  const repository = new VigenciaRepository(storage);

  const resultado =
    await repository.findByRegraVersionadaId(50);

  assert.equal(resultado.length, 3);

  assert.equal(resultado[0].id, 10);
  assert.equal(resultado[1].id, 11);
  assert.equal(resultado[2].id, 12);

  assert.equal(resultado[0].inicio, '2026-01-01');
  assert.equal(resultado[1].inicio, '2026-04-01');
  assert.equal(resultado[2].inicio, '2026-07-01');

  assert.equal(resultado[2].fim, null);
});

test('findByRegraVersionadaId deve aceitar id numérico ou textual', async () => {
  const storage = criarStorageMock();

  const chamadas = [];

  storage.findByRegraVersionadaId = async regraVersionadaId => {
    chamadas.push(regraVersionadaId);
    return [];
  };

  const repository = new VigenciaRepository(storage);

  await repository.findByRegraVersionadaId(10);
  await repository.findByRegraVersionadaId('10');

  assert.deepEqual(chamadas, [10, '10']);
});

test('findByRegraVersionadaId deve rejeitar id ausente', async () => {
  const repository = new VigenciaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.findByRegraVersionadaId(),
    {
      name: 'TypeError',
      message:
        'O id da regra versionada é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByRegraVersionadaId(null),
    {
      name: 'TypeError',
      message:
        'O id da regra versionada é obrigatório.'
    }
  );
});

test('findByRegraVersionadaId deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findByRegraVersionadaId = async () => null;

  const repository = new VigenciaRepository(storage);

  await assert.rejects(
    () => repository.findByRegraVersionadaId(10),
    {
      name: 'TypeError',
      message:
        'VigenciaRepository.findByRegraVersionadaId() deve retornar um array.'
    }
  );
});

test('findAll deve retornar todas as vigências', async () => {
  const vigencias = [
    {
      id: 1,
      regraVersionadaId: 10,
      inicio: '2026-01-01',
      fim: '2026-06-30'
    },
    {
      id: 2,
      regraVersionadaId: 11,
      inicio: '2026-07-01',
      fim: null
    }
  ];

  const storage = criarStorageMock();

  storage.findAll = async () => vigencias;

  const repository = new VigenciaRepository(storage);

  const resultado = await repository.findAll();

  assert.deepEqual(resultado, vigencias);
});

test('findAll deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findAll = async () => null;

  const repository = new VigenciaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message:
        'VigenciaRepository.findAll() deve retornar um array.'
    }
  );
});

test('save deve delegar a vigência ao storage', async () => {
  const vigencia = {
    id: 1,
    regraVersionadaId: 10,
    inicio: '2026-01-01',
    fim: '2026-06-30'
  };

  const storage = criarStorageMock();

  let recebido;

  storage.save = async entidade => {
    recebido = entidade;
    return entidade;
  };

  const repository = new VigenciaRepository(storage);

  const resultado = await repository.save(vigencia);

  assert.equal(recebido, vigencia);
  assert.deepEqual(resultado, vigencia);
});

test('save deve rejeitar vigência ausente', async () => {
  const repository = new VigenciaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.save(),
    {
      name: 'TypeError',
      message: 'A vigência é obrigatória.'
    }
  );

  await assert.rejects(
    () => repository.save(null),
    {
      name: 'TypeError',
      message: 'A vigência é obrigatória.'
    }
  );
});

test('save deve rejeitar vigência que não seja objeto', async () => {
  const repository = new VigenciaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.save('vigencia'),
    {
      name: 'TypeError',
      message: 'A vigência deve ser um objeto.'
    }
  );

  await assert.rejects(
    () => repository.save(10),
    {
      name: 'TypeError',
      message: 'A vigência deve ser um objeto.'
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

  const repository = new VigenciaRepository(storage);

  const resultado = await repository.delete(10);

  assert.equal(recebido, 10);
  assert.equal(resultado, true);
});

test('delete deve rejeitar id ausente', async () => {
  const repository = new VigenciaRepository(
    criarStorageMock()
  );

  await assert.rejects(
    () => repository.delete(),
    {
      name: 'TypeError',
      message: 'O id da vigência é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.delete(null),
    {
      name: 'TypeError',
      message: 'O id da vigência é obrigatório.'
    }
  );
});

test('VigenciaRepository deve validar o contrato do storage', async () => {
  const storage = {
    findById: async () => null
  };

  const repository = new VigenciaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message:
        /A implementação de armazenamento deve possuir o método findByRegraVersionadaId/
    }
  );
});

test('VigenciaRepository deve propagar erros do storage', async () => {
  const storage = criarStorageMock();

  storage.findByRegraVersionadaId = async () => {
    throw new Error('Erro de persistência');
  };

  const repository = new VigenciaRepository(storage);

  await assert.rejects(
    () => repository.findByRegraVersionadaId(10),
    {
      name: 'Error',
      message: 'Erro de persistência'
    }
  );
});