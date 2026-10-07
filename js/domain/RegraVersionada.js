/**
 * Representa uma regra de negócio versionada no domínio.
 *
 * Uma regra pode possuir várias versões, cada uma associada
 * a uma vigência específica.
 */
class RegraVersionada {
  /**
   * @param {Object} params
   * @param {string} params.codigo
   * @param {string} params.nome
   * @param {Array<Object>} [params.versoes=[]]
   */
  constructor({ codigo, nome, versoes = [] }) {
    if (!codigo || typeof codigo !== 'string') {
      throw new Error('RegraVersionada: codigo é obrigatório.');
    }

    if (!nome || typeof nome !== 'string') {
      throw new Error('RegraVersionada: nome é obrigatório.');
    }

    if (!Array.isArray(versoes)) {
      throw new Error('RegraVersionada: versoes deve ser um array.');
    }

    this.codigo = codigo;
    this.nome = nome;
    this.versoes = versoes.map((versao) => ({ ...versao }));
  }

  /**
   * Adiciona uma nova versão da regra.
   *
   * A versão deve possuir:
   * - identificador
   * - vigência
   * - implementação da regra
   *
   * @param {Object} versao
   * @returns {RegraVersionada}
   */
  adicionarVersao(versao) {
    this.#validarVersao(versao);

    if (this.versoes.some((item) => item.id === versao.id)) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" já existe.`
      );
    }

    if (this.versoes.some((item) => this.#vigenciasSobrepostas(item, versao))) {
      throw new Error(
        `RegraVersionada: a vigência sobrepõe uma versão existente.`
      );
    }

    this.versoes.push({ ...versao });

    return this;
  }

  /**
   * Retorna a versão vigente na data informada.
   *
   * @param {Date|string} data
   * @returns {Object|null}
   */
  obterVersaoVigente(data) {
    const dataConsulta = data instanceof Date ? data : new Date(data);

    if (Number.isNaN(dataConsulta.getTime())) {
      throw new Error('RegraVersionada: data inválida.');
    }

    const vigentes = this.versoes.filter((versao) =>
      this.#vigenciaContem(versao.vigencia, dataConsulta)
    );

    if (vigentes.length > 1) {
      throw new Error(
        `RegraVersionada: existem múltiplas versões vigentes em ${dataConsulta.toISOString()}.`
      );
    }

    return vigentes[0] ?? null;
  }

  /**
   * Verifica se existe uma versão vigente na data informada.
   *
   * @param {Date|string} data
   * @returns {boolean}
   */
  possuiVersaoVigente(data) {
    return this.obterVersaoVigente(data) !== null;
  }

  /**
   * Retorna todas as versões ordenadas pelo início da vigência.
   *
   * @returns {Array<Object>}
   */
  listarVersoes() {
    return [...this.versoes].sort((a, b) => {
      return this.#inicioVigencia(a.vigencia) - this.#inicioVigencia(b.vigencia);
    });
  }

  /**
   * @private
   */
  #validarVersao(versao) {
    if (!versao || typeof versao !== 'object') {
      throw new Error('RegraVersionada: versão inválida.');
    }

    if (
      versao.id === undefined ||
      versao.id === null ||
      versao.id === ''
    ) {
      throw new Error('RegraVersionada: versão deve possuir id.');
    }

    if (!versao.vigencia) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" deve possuir vigência.`
      );
    }

    if (
      typeof versao.regra !== 'function' &&
      typeof versao.calcular !== 'function' &&
      typeof versao.executar !== 'function'
    ) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" deve possuir uma função de regra.`
      );
    }
  }

  /**
   * @private
   */
  #vigenciaContem(vigencia, data) {
    if (typeof vigencia.estaVigenteEm === 'function') {
      return vigencia.estaVigenteEm(data);
    }

    if (typeof vigencia.contem === 'function') {
      return vigencia.contem(data);
    }

    const inicio = this.#obterData(vigencia.inicio);
    const fim = this.#obterData(vigencia.fim);

    if (!inicio) {
      throw new Error('RegraVersionada: vigência sem início válido.');
    }

    return data >= inicio && (!fim || data <= fim);
  }

  /**
   * @private
   */
  #vigenciasSobrepostas(a, b) {
    const inicioA = this.#inicioVigencia(a.vigencia);
    const fimA = this.#fimVigencia(a.vigencia);

    const inicioB = this.#inicioVigencia(b.vigencia);
    const fimB = this.#fimVigencia(b.vigencia);

    const fimAefetivo = fimA ?? Infinity;
    const fimBefetivo = fimB ?? Infinity;

    return inicioA <= fimBefetivo && inicioB <= fimAefetivo;
  }

  /**
   * @private
   */
  #inicioVigencia(vigencia) {
    const inicio =
      vigencia.inicio ??
      vigencia.dataInicio ??
      vigencia.inicioEm;

    const data = this.#obterData(inicio);

    if (!data) {
      throw new Error('RegraVersionada: início de vigência inválido.');
    }

    return data.getTime();
  }

  /**
   * @private
   */
  #fimVigencia(vigencia) {
    const fim =
      vigencia.fim ??
      vigencia.dataFim ??
      vigencia.fimEm;

    const data = this.#obterData(fim);

    return data ? data.getTime() : null;
  }

  /**
   * @private
   */
  #obterData(valor) {
    if (valor === undefined || valor === null || valor === '') {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    const data = new Date(valor);

    return Number.isNaN(data.getTime()) ? null : data;
  }
}

export default RegraVersionada;