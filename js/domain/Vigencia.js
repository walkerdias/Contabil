/**
 * Representa o período em que uma regra, tabela ou configuração
 * do domínio é válida.
 *
 * A vigência é inclusiva nas duas extremidades:
 *
 *   [inicio, fim]
 *
 * Exemplos:
 *
 *   Vigencia.de("2026-01-01")
 *   Vigencia.entre("2026-01-01", "2026-12-31")
 *
 * As datas são tratadas como datas de calendário, sem horário.
 */
class Vigencia {
  /**
   * @param {string|Date} inicio
   * @param {string|Date|null} fim
   */
  constructor(inicio, fim = null) {
    this.inicio = Vigencia.#normalizarData(inicio);
    this.fim = fim === null ? null : Vigencia.#normalizarData(fim);

    if (this.fim !== null && this.inicio > this.fim) {
      throw new RangeError(
        "A data de início da vigência não pode ser posterior à data de fim."
      );
    }

    Object.freeze(this);
  }

  /**
   * Cria uma vigência aberta a partir de uma data.
   *
   * @param {string|Date} inicio
   * @returns {Vigencia}
   */
  static de(inicio) {
    return new Vigencia(inicio);
  }

  /**
   * Cria uma vigência com início e fim definidos.
   *
   * @param {string|Date} inicio
   * @param {string|Date} fim
   * @returns {Vigencia}
   */
  static entre(inicio, fim) {
    return new Vigencia(inicio, fim);
  }

  /**
   * Verifica se uma data pertence à vigência.
   *
   * @param {string|Date} data
   * @returns {boolean}
   */
  contem(data) {
    const valor = Vigencia.#normalizarData(data);

    if (valor < this.inicio) {
      return false;
    }

    if (this.fim !== null && valor > this.fim) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se a vigência está aberta, isto é,
   * sem uma data final definida.
   *
   * @returns {boolean}
   */
  ehAberta() {
    return this.fim === null;
  }

  /**
   * Verifica se esta vigência é posterior à data informada.
   *
   * @param {string|Date} data
   * @returns {boolean}
   */
  iniciaDepoisDe(data) {
    return this.inicio > Vigencia.#normalizarData(data);
  }

  /**
   * Verifica se esta vigência termina antes da data informada.
   *
   * Uma vigência aberta nunca termina antes de uma data.
   *
   * @param {string|Date} data
   * @returns {boolean}
   */
  terminaAntesDe(data) {
    return this.fim !== null &&
      this.fim < Vigencia.#normalizarData(data);
  }

  /**
   * Verifica se duas vigências se sobrepõem.
   *
   * Como as extremidades são inclusivas, as vigências
   * [2026-01-01, 2026-03-31] e [2026-03-31, 2026-06-30]
   * são consideradas sobrepostas.
   *
   * @param {Vigencia} outra
   * @returns {boolean}
   */
  sobrepoe(outra) {
    if (!(outra instanceof Vigencia)) {
      throw new TypeError("A outra vigência deve ser uma instância de Vigencia.");
    }

    const inicioA = this.inicio;
    const fimA = this.fim;

    const inicioB = outra.inicio;
    const fimB = outra.fim;

    const aTerminaAntesDeB =
      fimA !== null && fimA < inicioB;

    const bTerminaAntesDeA =
      fimB !== null && fimB < inicioA;

    return !aTerminaAntesDeB && !bTerminaAntesDeA;
  }

  /**
   * Verifica se duas vigências são adjacentes.
   *
   * Exemplo:
   *
   * [2026-01-01, 2026-03-31]
   * [2026-04-01, 2026-06-30]
   *
   * @param {Vigencia} outra
   * @returns {boolean}
   */
  ehAdjacenteA(outra) {
    if (!(outra instanceof Vigencia)) {
      throw new TypeError("A outra vigência deve ser uma instância de Vigencia.");
    }

    if (this.sobrepoe(outra)) {
      return false;
    }

    if (this.fim === null || outra.fim === null) {
      return false;
    }

    const diaSeguinte = Vigencia.#adicionarDias(this.fim, 1);
    const outroDiaSeguinte = Vigencia.#adicionarDias(outra.fim, 1);

    return diaSeguinte.getTime() === outra.inicio.getTime() ||
      outroDiaSeguinte.getTime() === this.inicio.getTime();
  }

  /**
   * Retorna uma representação simples da vigência.
   *
   * @returns {{inicio: string, fim: string|null}}
   */
  toJSON() {
    return {
      inicio: Vigencia.#formatarData(this.inicio),
      fim: this.fim === null
        ? null
        : Vigencia.#formatarData(this.fim),
    };
  }

  /**
   * Retorna uma representação textual.
   *
   * @returns {string}
   */
  toString() {
    const inicio = Vigencia.#formatarData(this.inicio);
    const fim = this.fim === null
      ? "aberta"
      : Vigencia.#formatarData(this.fim);

    return `${inicio} até ${fim}`;
  }

  /**
   * Normaliza uma data para o início do dia em UTC.
   *
   * O domínio trabalha com datas de calendário, e não com
   * instantes dependentes do fuso horário.
   *
   * @param {string|Date} valor
   * @returns {Date}
   * @private
   */
  static #normalizarData(valor) {
    if (valor instanceof Date) {
      if (Number.isNaN(valor.getTime())) {
        throw new TypeError("Data inválida.");
      }

      return new Date(Date.UTC(
        valor.getUTCFullYear(),
        valor.getUTCMonth(),
        valor.getUTCDate()
      ));
    }

    if (typeof valor !== "string") {
      throw new TypeError(
        "A data deve ser uma string no formato YYYY-MM-DD ou uma instância de Date."
      );
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
      throw new TypeError(
        "A data deve estar no formato YYYY-MM-DD."
      );
    }

    const [ano, mes, dia] = valor.split("-").map(Number);

    const data = new Date(Date.UTC(ano, mes - 1, dia));

    if (
      data.getUTCFullYear() !== ano ||
      data.getUTCMonth() !== mes - 1 ||
      data.getUTCDate() !== dia
    ) {
      throw new RangeError(`Data inválida: ${valor}.`);
    }

    return data;
  }

  /**
   * @param {Date} data
   * @param {number} quantidade
   * @returns {Date}
   * @private
   */
  static #adicionarDias(data, quantidade) {
    const resultado = new Date(data.getTime());
    resultado.setUTCDate(resultado.getUTCDate() + quantidade);
    return resultado;
  }

  /**
   * @param {Date} data
   * @returns {string}
   * @private
   */
  static #formatarData(data) {
    return data.toISOString().slice(0, 10);
  }
}

export default Vigencia;