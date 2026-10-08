'use strict';

/**
 * VigenciaRepository
 *
 * Contrato de persistência para a entidade Vigencia.
 *
 * Responsabilidades:
 * - localizar uma vigência por identificador;
 * - localizar vigências associadas a uma regra/versionamento;
 * - listar vigências;
 * - persistir uma vigência;
 * - excluir uma vigência.
 *
 * Regras de domínio como:
 * - data inicial obrigatória;
 * - data final posterior à inicial;
 * - sobreposição de vigências;
 * - determinação da vigência aplicável;
 *
 * devem permanecer na camada de domínio.
 */
class VigenciaRepository {
  /**
   * @param {object} [storage]
   *
   * O storage deve fornecer:
   * - findById(id)
   * - findByRegraVersionadaId(regraVersionadaId)
   * - findAll()
   * - save(vigencia)
   * - delete(id)
   */
  constructor(storage = null) {
    this.storage = storage;
  }

  /**
   * Busca uma vigência pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<object|null>}
   */
  async findById(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError(
        'O id da vigência é obrigatório.'
      );
    }

    return this.storage.findById(id);
  }

  /**
   * Busca as vigências associadas a uma regra versionada.
   *
   * @param {string|number} regraVersionadaId
   * @returns {Promise<Array>}
   */
  async findByRegraVersionadaId(regraVersionadaId) {
    this.#ensureStorage();

    if (
      regraVersionadaId === null ||
      regraVersionadaId === undefined
    ) {
      throw new TypeError(
        'O id da regra versionada é obrigatório.'
      );
    }

    const vigencias =
      await this.storage.findByRegraVersionadaId(
        regraVersionadaId
      );

    if (!Array.isArray(vigencias)) {
      throw new TypeError(
        'VigenciaRepository.findByRegraVersionadaId() deve retornar um array.'
      );
    }

    return vigencias;
  }

  /**
   * Retorna todas as vigências.
   *
   * @returns {Promise<Array>}
   */
  async findAll() {
    this.#ensureStorage();

    const vigencias = await this.storage.findAll();

    if (!Array.isArray(vigencias)) {
      throw new TypeError(
        'VigenciaRepository.findAll() deve retornar um array.'
      );
    }

    return vigencias;
  }

  /**
   * Persiste uma vigência.
   *
   * @param {object} vigencia
   * @returns {Promise<object>}
   */
  async save(vigencia) {
    this.#ensureStorage();

    if (vigencia === null || vigencia === undefined) {
      throw new TypeError(
        'A vigência é obrigatória.'
      );
    }

    if (typeof vigencia !== 'object') {
      throw new TypeError(
        'A vigência deve ser um objeto.'
      );
    }

    return this.storage.save(vigencia);
  }

  /**
   * Exclui uma vigência pelo identificador.
   *
   * @param {string|number} id
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    this.#ensureStorage();

    if (id === null || id === undefined) {
      throw new TypeError(
        'O id da vigência é obrigatório.'
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
        'VigenciaRepository requer uma implementação de armazenamento.'
      );
    }

    const requiredMethods = [
      'findById',
      'findByRegraVersionadaId',
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

module.exports = VigenciaRepository;