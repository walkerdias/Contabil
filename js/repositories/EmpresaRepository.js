'use strict';

/**
 * EmpresaRepository
 *
 * Contrato de persistência para a entidade Empresa.
 *
 * O domínio não deve conhecer detalhes de banco de dados.
 * A implementação concreta pode utilizar SQLite, PostgreSQL,
 * memória ou qualquer outro mecanismo de persistência.
 */
class EmpresaRepository {
  /**
   * @param {object} [storage]
   * Implementação opcional de armazenamento.
   *
   * O objeto pode fornecer:
   * - findById(id)
   * - findByCnpj(cnpj)
   * - findAll()
   * - save(empresa)
   * - delete(id)
   */
  constructor(storage = null) {
    this.storage = storage;
  }

  /**
   * Busca uma empresa pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError('O id da empresa é obrigatório.');
    }

    return this.storage.findById(id);
  }

  /**
   * Busca uma empresa pelo CNPJ.
   *
   * @param {string} cnpj
   * @returns {Promise<object|null>}
   */
  async findByCnpj(cnpj) {
    this.#ensureStorage();

    if (typeof cnpj !== 'string' || cnpj.trim() === '') {
      throw new TypeError('O CNPJ da empresa é obrigatório.');
    }

    return this.storage.findByCnpj(cnpj);
  }

  /**
   * Retorna todas as empresas.
   *
   * @returns {Promise<Array>}
   */
  async findAll() {
    this.#ensureStorage();

    const empresas = await this.storage.findAll();

    if (!Array.isArray(empresas)) {
      throw new TypeError(
        'EmpresaRepository.findAll() deve retornar um array.'
      );
    }

    return empresas;
  }

  /**
   * Persiste uma empresa.
   *
   * @param {object} empresa
   * @returns {Promise<object>}
   */
  async save(empresa) {
    this.#ensureStorage();

    if (empresa === null || empresa === undefined) {
      throw new TypeError('A empresa é obrigatória.');
    }

    if (typeof empresa !== 'object') {
      throw new TypeError('A empresa deve ser um objeto.');
    }

    return this.storage.save(empresa);
  }

  /**
   * Exclui uma empresa pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError('O id da empresa é obrigatório.');
    }

    return this.storage.delete(id);
  }

  /**
   * Garante que uma implementação de armazenamento foi configurada.
   *
   * @private
   */
  #ensureStorage() {
    if (!this.storage) {
      throw new Error(
        'EmpresaRepository requer uma implementação de armazenamento.'
      );
    }

    const requiredMethods = [
      'findById',
      'findByCnpj',
      'findAll',
      'save',
      'delete'
    ];

    for (const method of requiredMethods) {
      if (typeof this.storage[method] !== 'function') {
        throw new TypeError(
          `A implementação de armazenamento deve possuir o método ${method}().`
        );
      }
    }
  }
}

module.exports = EmpresaRepository;