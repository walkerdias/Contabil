/**
 * Entidade de domínio Empresa.
 *
 * Representa a empresa/contribuinte utilizado nos cálculos
 * e nas regras fiscais do Contábil.
 *
 * A entidade não possui dependência de infraestrutura:
 * banco de dados, HTTP, UI ou framework.
 */
export default class Empresa {
  /**
   * @param {Object} props
   * @param {string} props.id
   * @param {string} props.cnpj
   * @param {string} [props.razaoSocial]
   * @param {string} [props.nomeFantasia]
   * @param {boolean} [props.ativa=true]
   */
  constructor({
    id,
    cnpj,
    razaoSocial = '',
    nomeFantasia = '',
    ativa = true,
  } = {}) {
    this.id = Empresa.normalizarId(id);
    this.cnpj = Empresa.normalizarCnpj(cnpj);
    this.razaoSocial = Empresa.normalizarTexto(razaoSocial);
    this.nomeFantasia = Empresa.normalizarTexto(nomeFantasia);
    this.ativa = Boolean(ativa);

    Empresa.validar(this);
  }

  /**
   * Cria uma Empresa a partir de dados externos.
   *
   * @param {Object} data
   * @returns {Empresa}
   */
  static fromJSON(data) {
    return new Empresa(data);
  }

  /**
   * Retorna uma representação serializável da entidade.
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      cnpj: this.cnpj,
      razaoSocial: this.razaoSocial,
      nomeFantasia: this.nomeFantasia,
      ativa: this.ativa,
    };
  }

  /**
   * Ativa a empresa.
   */
  ativar() {
    this.ativa = true;
  }

  /**
   * Inativa a empresa.
   */
  inativar() {
    this.ativa = false;
  }

  /**
   * Verifica se a empresa está ativa.
   *
   * @returns {boolean}
   */
  estaAtiva() {
    return this.ativa;
  }

  /**
   * Compara a identidade de duas empresas.
   *
   * @param {Empresa} outra
   * @returns {boolean}
   */
  equals(outra) {
    return outra instanceof Empresa && this.id === outra.id;
  }

  /**
   * Normaliza o identificador da empresa.
   *
   * @param {string|number} id
   * @returns {string}
   */
  static normalizarId(id) {
    if (id === undefined || id === null) {
      return '';
    }

    return String(id).trim();
  }

  /**
   * Normaliza CNPJ removendo máscara e espaços.
   *
   * Exemplo:
   * 12.345.678/0001-90 -> 12345678000190
   *
   * @param {string|number} cnpj
   * @returns {string}
   */
  static normalizarCnpj(cnpj) {
    if (cnpj === undefined || cnpj === null) {
      return '';
    }

    return String(cnpj)
      .replace(/\D/g, '')
      .trim();
  }

  /**
   * Normaliza textos de domínio.
   *
   * @param {string} valor
   * @returns {string}
   */
  static normalizarTexto(valor) {
    if (valor === undefined || valor === null) {
      return '';
    }

    return String(valor).trim();
  }

  /**
   * Valida invariantes da entidade.
   *
   * @param {Empresa} empresa
   * @throws {Error}
   */
  static validar(empresa) {
    if (!empresa.id) {
      throw new Error('Empresa: id é obrigatório.');
    }

    if (!empresa.cnpj) {
      throw new Error('Empresa: cnpj é obrigatório.');
    }

    if (!Empresa.cnpjValido(empresa.cnpj)) {
      throw new Error('Empresa: cnpj inválido.');
    }
  }

  /**
   * Valida estruturalmente um CNPJ.
   *
   * Além do tamanho e dos dígitos, rejeita sequências
   * compostas pelo mesmo dígito.
   *
   * @param {string} cnpj
   * @returns {boolean}
   */
  static cnpjValido(cnpj) {
    const valor = Empresa.normalizarCnpj(cnpj);

    if (valor.length !== 14) {
      return false;
    }

    if (/^(\d)\1{13}$/.test(valor)) {
      return false;
    }

    const primeiroDigito = Empresa.calcularDigitoCnpj(valor, 12);

    if (Number(valor[12]) !== primeiroDigito) {
      return false;
    }

    const segundoDigito = Empresa.calcularDigitoCnpj(valor, 13);

    return Number(valor[13]) === segundoDigito;
  }

  /**
   * Calcula um dos dígitos verificadores do CNPJ.
   *
   * @param {string} cnpj
   * @param {number} tamanho
   * @returns {number}
   */
  static calcularDigitoCnpj(cnpj, tamanho) {
    const pesos =
      tamanho === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = 0;

    for (let i = 0; i < pesos.length; i += 1) {
      soma += Number(cnpj[i]) * pesos[i];
    }

    const resto = soma % 11;

    return resto < 2 ? 0 : 11 - resto;
  }
}