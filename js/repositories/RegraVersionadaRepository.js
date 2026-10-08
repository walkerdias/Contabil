'use strict';

/**
 * RegraVersionadaRepository
 *
 * Contrato de persistência para regras versionadas.
 *
 * Responsabilidades:
 * - localizar uma regra por identificador;
 * - localizar versões pelo código da regra;
 * - listar versões;
 * - persistir uma versão;
 * - excluir uma versão.
 *
 * As regras de negócio relacionadas a:
 * - vigência;
 * - sobreposição de versões;
 * - seleção da versão aplicável;
 * - validação de intervalos;
 *
 * permanecem no domínio e não devem ser implementadas aqui.
 */
class RegraVersionadaRepository {
  /**
   * @param {object} [storage]
   *
   * O storage deve fornecer:
   * - findById(id)
   * - findByCodigo(codigo)
   * - findAll()
   * - save(regraVersionada)
   * - delete(id)
   */
  constructor(storage = null) {
    this.storage = storage;
  }

  /**
   * Busca uma regra versionada pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError(
        'O id da regra versionada é obrigatório.'
      );
    }

    return this.storage.findById(id);
  }

  /**
   * Busca todas as versões associadas a um código de regra.
   *
   * @param {string} codigo
   * @returns {Promise<Array>}
   */
  async findByCodigo(codigo) {
    this.#ensureStorage();

    if (typeof codigo !== 'string' || codigo.trim() === '') {
      throw new TypeError(
        'O código da regra versionada é obrigatório.'
      );
    }

    const resultado = await this.storage.findByCodigo(codigo);

    if (!Array.isArray(resultado)) {
      throw new TypeError(
        'RegraVersionadaRepository.findByCodigo() deve retornar um array.'
      );
    }

    return resultado;
  }

  /**
   * Retorna todas as regras/versionamentos persistidos.
   *
   * @returns {Promise<Array>}
   */
  async findAll() {
    this.#ensureStorage();

    const regras = await this.storage.findAll();

    if (!Array.isArray(regras)) {
      throw new TypeError(
        'RegraVersionadaRepository.findAll() deve retornar um array.'
      );
    }

    return regras;
  }

  /**
   * Persiste uma regra versionada.
   *
   * @param {object} regraVersionada
   * @returns {Promise<object>}
   */
  async save(regraVersionada) {
    this.#ensureStorage();

    if (
      regraVersionada === null ||
      regraVersionada === undefined
    ) {
      throw new TypeError(
        'A regra versionada é obrigatória.'
      );
    }

    if (typeof regraVersionada !== 'object') {
      throw new TypeError(
        'A regra versionada deve ser um objeto.'
      );
    }

    return this.storage.save(regraVersionada);
  }

  /**
   * Exclui uma regra versionada pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError(
        'O id da regra versionada é obrigatório.'
      );
    }

    return this.storage.delete(id);
  }

  /**
   * Garante que o storage possui o contrato esperado.
   *
   * @private
   */
  #ensureStorage() {
    if (!this.storage) {
      throw new Error(
        'RegraVersionadaRepository requer uma implementação de armazenamento.'
      );
    }

    const requiredMethods = [
      'findById',
      'findByCodigo',
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

module.exports = RegraVersionadaRepository;