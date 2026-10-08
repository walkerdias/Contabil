'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const EmpresaRepository = require('./EmpresaRepository');

function criarStorageMock() {
  return {
    findById: async () => null,
    findByCnpj: async () => null,
    findAll: async () => [],
    save: async empresa => empresa,
    delete: async () => true
  };
}

test('EmpresaRepository deve ser instanciado com uma implementação de storage', () => {
  const storage = criarStorageMock();

  const repository = new EmpresaRepository(storage);

  assert.ok(repository instanceof EmpresaRepository);
  assert.equal(repository.storage, storage);
});

test('EmpresaRepository deve rejeitar operações sem storage', async () => {
  const repository = new EmpresaRepository();

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'Error',
      message: 'EmpresaRepository requer uma implementação de armazenamento.'
    }
  );
});

test('findById deve delegar a busca ao storage', async () => {
  const empresa = {
    id: 1,
    cnpj: '12345678000199',
    razaoSocial: 'Empresa Teste Ltda.'
  };

  const storage = criarStorageMock();

  let recebido;

  storage.findById = async id => {
    recebido = id;
    return empresa;
  };

  const repository = new EmpresaRepository(storage);

  const resultado = await repository.findById(1);

  assert.equal(recebido, 1);
  assert.deepEqual(resultado, empresa);
});

test('findById deve rejeitar id ausente', async () => {
  const repository = new EmpresaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findById(),
    {
      name: 'TypeError',
      message: 'O id da empresa é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findById(null),
    {
      name: 'TypeError',
      message: 'O id da empresa é obrigatório.'
    }
  );
});

test('findByCnpj deve delegar a busca ao storage', async () => {
  const empresa = {
    id: 1,
    cnpj: '12345678000199',
    razaoSocial: 'Empresa Teste Ltda.'
  };

  const storage = criarStorageMock();

  let recebido;

  storage.findByCnpj = async cnpj => {
    recebido = cnpj;
    return empresa;
  };

  const repository = new EmpresaRepository(storage);

  const resultado = await repository.findByCnpj('12345678000199');

  assert.equal(recebido, '12345678000199');
  assert.deepEqual(resultado, empresa);
});

test('findByCnpj deve rejeitar CNPJ ausente', async () => {
  const repository = new EmpresaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.findByCnpj(),
    {
      name: 'TypeError',
      message: 'O CNPJ da empresa é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCnpj(''),
    {
      name: 'TypeError',
      message: 'O CNPJ da empresa é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCnpj('   '),
    {
      name: 'TypeError',
      message: 'O CNPJ da empresa é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.findByCnpj(null),
    {
      name: 'TypeError',
      message: 'O CNPJ da empresa é obrigatório.'
    }
  );
});

test('findAll deve retornar todas as empresas do storage', async () => {
  const empresas = [
    {
      id: 1,
      cnpj: '12345678000199',
      razaoSocial: 'Empresa A Ltda.'
    },
    {
      id: 2,
      cnpj: '98765432000188',
      razaoSocial: 'Empresa B Ltda.'
    }
  ];

  const storage = criarStorageMock();

  storage.findAll = async () => empresas;

  const repository = new EmpresaRepository(storage);

  const resultado = await repository.findAll();

  assert.deepEqual(resultado, empresas);
});

test('findAll deve rejeitar storage que não retorna array', async () => {
  const storage = criarStorageMock();

  storage.findAll = async () => null;

  const repository = new EmpresaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message: 'EmpresaRepository.findAll() deve retornar um array.'
    }
  );
});

test('save deve delegar a empresa ao storage', async () => {
  const empresa = {
    id: 1,
    cnpj: '12345678000199',
    razaoSocial: 'Empresa Teste Ltda.'
  };

  const storage = criarStorageMock();

  let recebido;

  storage.save = async entidade => {
    recebido = entidade;
    return entidade;
  };

  const repository = new EmpresaRepository(storage);

  const resultado = await repository.save(empresa);

  assert.equal(recebido, empresa);
  assert.deepEqual(resultado, empresa);
});

test('save deve rejeitar empresa ausente', async () => {
  const repository = new EmpresaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.save(),
    {
      name: 'TypeError',
      message: 'A empresa é obrigatória.'
    }
  );

  await assert.rejects(
    () => repository.save(null),
    {
      name: 'TypeError',
      message: 'A empresa é obrigatória.'
    }
  );
});

test('save deve rejeitar empresa que não seja objeto', async () => {
  const repository = new EmpresaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.save('empresa'),
    {
      name: 'TypeError',
      message: 'A empresa deve ser um objeto.'
    }
  );

  await assert.rejects(
    () => repository.save(10),
    {
      name: 'TypeError',
      message: 'A empresa deve ser um objeto.'
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

  const repository = new EmpresaRepository(storage);

  const resultado = await repository.delete(10);

  assert.equal(recebido, 10);
  assert.equal(resultado, true);
});

test('delete deve rejeitar id ausente', async () => {
  const repository = new EmpresaRepository(criarStorageMock());

  await assert.rejects(
    () => repository.delete(),
    {
      name: 'TypeError',
      message: 'O id da empresa é obrigatório.'
    }
  );

  await assert.rejects(
    () => repository.delete(null),
    {
      name: 'TypeError',
      message: 'O id da empresa é obrigatório.'
    }
  );
});

test('EmpresaRepository deve validar a implementação do storage', async () => {
  const storage = {
    findById: async () => null
  };

  const repository = new EmpresaRepository(storage);

  await assert.rejects(
    () => repository.findAll(),
    {
      name: 'TypeError',
      message: /deve possuir o método findByCnpj/
    }
  );
});

test('EmpresaRepository deve propagar erros do storage', async () => {
  const storage = criarStorageMock();

  storage.findById = async () => {
    throw new Error('Erro de persistência');
  };

  const repository = new EmpresaRepository(storage);

  await assert.rejects(
    () => repository.findById(1),
    {
      name: 'Error',
      message: 'Erro de persistência'
    }
  );
});