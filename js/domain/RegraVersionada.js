/**
 * Representa uma regra de negócio com versões associadas a vigências.
 *
 * Contrato temporal:
 * - A consulta recebe uma instância de Competencia.
 * - Vigencia.contem() recebe uma competência no formato YYYY-MM.
 * - O domínio não converte competências por meio de Date.
 */
import Competencia from './Competencia.js';

class RegraVersionada {
  /**
   * @param {Object} params
   * @param {string} params.codigo
   * @param {string} params.nome
   * @param {Array<Object>} [params.versoes=[]]
   */
  constructor({ codigo, nome, versoes = [] } = {}) {
    if (typeof codigo !== 'string' || codigo.trim() === '') {
      throw new Error('RegraVersionada: codigo é obrigatório.');
    }

    if (typeof nome !== 'string' || nome.trim() === '') {
      throw new Error('RegraVersionada: nome é obrigatório.');
    }

    if (!Array.isArray(versoes)) {
      throw new Error(
        'RegraVersionada: versoes deve ser um array.',
      );
    }

    this.codigo = codigo.trim();
    this.nome = nome.trim();
    this.versoes = [];

    for (const versao of versoes) {
      this.adicionarVersao(versao);
    }
  }

  /**
   * Adiciona uma versão à regra.
   *
   * @param {Object} versao
   * @returns {RegraVersionada}
   */
  adicionarVersao(versao) {
    this.#validarVersao(versao);

    if (this.versoes.some((item) => item.id === versao.id)) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" já existe.`,
      );
    }

    for (const existente of this.versoes) {
      if (this.#vigenciasSobrepostas(existente.vigencia, versao.vigencia)) {
        throw new Error(
          'RegraVersionada: uma vigência sobrepõe uma versão existente.',
        );
      }
    }

    this.versoes.push({ ...versao });

    return this;
  }

  /**
   * Obtém a versão vigente para uma competência.
   *
   * @param {Competencia} competencia
   * @returns {Object|null}
   */
  obterVersaoVigente(competencia) {
    this.#validarCompetencia(competencia);

    const competenciaTexto = competencia.toString();

    const vigentes = this.versoes.filter((versao) =>
      versao.vigencia.contem(competenciaTexto),
    );

    if (vigentes.length > 1) {
      throw new Error(
        `RegraVersionada: múltiplas versões vigentes para ${competenciaTexto}.`,
      );
    }

    return vigentes[0] ?? null;
  }

  /**
   * Informa se há uma versão vigente para a competência.
   *
   * @param {Competencia} competencia
   * @returns {boolean}
   */
  possuiVersaoVigente(competencia) {
    return this.obterVersaoVigente(competencia) !== null;
  }

  /**
   * Lista versões ordenadas pelo início da vigência.
   *
   * O método espera que Vigencia exponha inicio como Competencia
   * ou como string YYYY-MM.
   *
   * @returns {Array<Object>}
   */
  listarVersoes() {
    return [...this.versoes].sort((a, b) =>
      this.#compararInicio(a.vigencia, b.vigencia),
    );
  }

  #validarCompetencia(competencia) {
    if (!(competencia instanceof Competencia)) {
      throw new TypeError(
        'RegraVersionada: competencia deve ser uma instância de Competencia.',
      );
    }

    if (typeof competencia.toString !== 'function') {
      throw new TypeError(
        'RegraVersionada: competência inválida.',
      );
    }

    const texto = competencia.toString();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(texto)) {
      throw new Error(
        'RegraVersionada: competência deve estar no formato YYYY-MM.',
      );
    }
  }

  #validarVersao(versao) {
    if (!versao || typeof versao !== 'object' || Array.isArray(versao)) {
      throw new Error('RegraVersionada: versão inválida.');
    }

    if (
      versao.id === undefined ||
      versao.id === null ||
      String(versao.id).trim() === ''
    ) {
      throw new Error('RegraVersionada: versão deve possuir id.');
    }

    if (
      !versao.vigencia ||
      typeof versao.vigencia.contem !== 'function'
    ) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" deve possuir uma vigência com o método contem().`,
      );
    }

    const possuiRegra =
      typeof versao.regra === 'function' ||
      typeof versao.calcular === 'function' ||
      typeof versao.executar === 'function';

    if (!possuiRegra) {
      throw new Error(
        `RegraVersionada: a versão "${versao.id}" deve possuir uma função de regra.`,
      );
    }

    this.#obterLimitesVigencia(versao.vigencia);
  }

  #obterLimitesVigencia(vigencia) {
    const inicio = vigencia.inicio;
    const fim = vigencia.fim ?? null;

    const inicioTexto = this.#competenciaParaTexto(inicio);

    if (!inicioTexto) {
      throw new Error(
        'RegraVersionada: início de vigência deve ser uma competência YYYY-MM.',
      );
    }

    const fimTexto =
      fim === null ? null : this.#competenciaParaTexto(fim);

    if (fim !== null && !fimTexto) {
      throw new Error(
        'RegraVersionada: fim de vigência deve ser uma competência YYYY-MM.',
      );
    }

    if (fimTexto !== null && inicioTexto > fimTexto) {
      throw new Error(
        'RegraVersionada: início da vigência não pode ser posterior ao fim.',
      );
    }

    return { inicio: inicioTexto, fim: fimTexto };
  }

  #competenciaParaTexto(valor) {
    if (valor instanceof Competencia) {
      return valor.toString();
    }

    if (
      typeof valor === 'string' &&
      /^\d{4}-(0[1-9]|1[0-2])$/.test(valor)
    ) {
      return valor;
    }

    return null;
  }

  #vigenciasSobrepostas(vigenciaA, vigenciaB) {
    const a = this.#obterLimitesVigencia(vigenciaA);
    const b = this.#obterLimitesVigencia(vigenciaB);

    // Limites inclusivos: duas versões que abrangem o mesmo mês
    // não podem coexistir.
    const aTerminaDepoisDoInicioB =
      a.fim === null || a.fim >= b.inicio;

    const bTerminaDepoisDoInicioA =
      b.fim === null || b.fim >= a.inicio;

    return aTerminaDepoisDoInicioB && bTerminaDepoisDoInicioA;
  }

  #compararInicio(vigenciaA, vigenciaB) {
    const a = this.#obterLimitesVigencia(vigenciaA).inicio;
    const b = this.#obterLimitesVigencia(vigenciaB).inicio;

    return a.localeCompare(b);
  }
}

export default RegraVersionada;