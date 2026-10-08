'use strict';

/**
 * CompetenciaRepository
 *
 * Contrato de persistência para a entidade Competencia.
 *
 * O repositório não contém regras de cálculo ou regras tributárias.
 * Sua responsabilidade é somente intermediar o acesso à persistência.
 *
 * A implementação concreta de storage pode utilizar:
 * - SQLite
 * - PostgreSQL
 * - outro banco de dados
 * - armazenamento em memória para testes
 */
class CompetenciaRepository {
  /**
   * @param {object} [storage]
   * Implementação de armazenamento.
   *
   * Deve fornecer:
   * - findById(id)
   * - findByAnoMes(ano, mes)
   * - findAll()
   * - save(competencia)
   * - delete(id)
   */
  constructor(storage = null) {
    this.storage = storage;
  }

  /**
   * Busca uma competência pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError('O id da competência é obrigatório.');
    }

    return this.storage.findById(id);
  }

  /**
   * Busca uma competência pelo ano e mês.
   *
   * @param {number} ano
   * @param {number} mes
   * @returns {Promise<object|null>}
   */
  async findByAnoMes(ano, mes) {
    this.#ensureStorage();

    if (!Number.isInteger(ano)) {
      throw new TypeError('O ano da competência deve ser um número inteiro.');
    }

    if (!Number.isInteger(mes)) {
      throw new TypeError('O mês da competência deve ser um número inteiro.');
    }

    if (mes < 1 || mes > 12) {
      throw new RangeError(
        'O mês da competência deve estar entre 1 e 12.'
      );
    }

    return this.storage.findByAnoMes(ano, mes);
  }

  /**
   * Retorna todas as competências.
   *
   * @returns {Promise<Array>}
   */
  async findAll() {
    this.#ensureStorage();

    const competencias = await this.storage.findAll();

    if (!Array.isArray(competencias)) {
      throw new TypeError(
        'CompetenciaRepository.findAll() deve retornar um array.'
      );
    }

    return competencias;
  }

  /**
   * Persiste uma competência.
   *
   * @param {object} competencia
   * @returns {Promise<object>}
   */
  async save(competencia) {
    this.#ensureStorage();

    if (competencia === null || competencia === undefined) {
      throw new TypeError('A competência é obrigatória.');
    }

    if (typeof competencia !== 'object') {
      throw new TypeError('A competência deve ser um objeto.');
    }

    return this.storage.save(competencia);
  }

  /**
   * Exclui uma competência pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError('O id da competência é obrigatório.');
    }

    return this.storage.delete(id);
  }

  /**
   * Garante que uma implementação válida de storage foi configurada.
   *
   * @private
   */
  #ensureStorage() {
    if (!this.storage) {
      throw new Error(
        'CompetenciaRepository requer uma implementação de armazenamento.'
      );
    }

    const requiredMethods = [
      'findById',
      'findByAnoMes',
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

module.exports = CompetenciaRepository;