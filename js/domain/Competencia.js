// js/domain/Competencia.js

export default class Competencia {
  #ano;
  #mes;

  constructor(ano, mes) {
    if (!Number.isInteger(ano)) {
      throw new TypeError('Ano deve ser um número inteiro.');
    }

    if (!Number.isInteger(mes)) {
      throw new TypeError('Mês deve ser um número inteiro.');
    }

    if (ano < 1900 || ano > 9999) {
      throw new RangeError('Ano deve estar entre 1900 e 9999.');
    }

    if (mes < 1 || mes > 12) {
      throw new RangeError('Mês deve estar entre 1 e 12.');
    }

    this.#ano = ano;
    this.#mes = mes;

    Object.freeze(this);
  }

  static from(competencia) {
    if (competencia instanceof Competencia) {
      return competencia;
    }

    if (typeof competencia !== 'string') {
      throw new TypeError(
        'Competência deve ser uma string no formato YYYY-MM.'
      );
    }

    const valor = competencia.trim();

    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(valor)) {
      throw new RangeError(
        'Competência deve estar no formato YYYY-MM.'
      );
    }

    const [ano, mes] = valor.split('-').map(Number);

    return new Competencia(ano, mes);
  }

  static atual(data = new Date()) {
    if (!(data instanceof Date) || Number.isNaN(data.getTime())) {
      throw new TypeError('Data inválida.');
    }

    return new Competencia(
      data.getFullYear(),
      data.getMonth() + 1
    );
  }

  get ano() {
    return this.#ano;
  }

  get mes() {
    return this.#mes;
  }

  toString() {
    return `${this.#ano}-${String(this.#mes).padStart(2, '0')}`;
  }

  toJSON() {
    return this.toString();
  }

  equals(outra) {
    return (
      outra instanceof Competencia &&
      this.#ano === outra.#ano &&
      this.#mes === outra.#mes
    );
  }

  anterior() {
    if (this.#mes === 1) {
      return new Competencia(this.#ano - 1, 12);
    }

    return new Competencia(this.#ano, this.#mes - 1);
  }

  proxima() {
    if (this.#mes === 12) {
      return new Competencia(this.#ano + 1, 1);
    }

    return new Competencia(this.#ano, this.#mes + 1);
  }

  compareTo(outra) {
    if (!(outra instanceof Competencia)) {
      throw new TypeError(
        'A comparação deve ser feita com outra Competencia.'
      );
    }

    if (this.#ano !== outra.#ano) {
      return this.#ano - outra.#ano;
    }

    return this.#mes - outra.#mes;
  }

  isAnteriorA(outra) {
    return this.compareTo(outra) < 0;
  }

  isPosteriorA(outra) {
    return this.compareTo(outra) > 0;
  }

  isIgualA(outra) {
    return this.compareTo(outra) === 0;
  }
}