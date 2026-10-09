/**
 * Representa uma regra de negócio com versões associadas a vigências.
 *
 * As consultas são mensais (Competencia); os limites das vigências
 * continuam sendo datas de calendário (YYYY-MM-DD). A conversão entre
 * esses conceitos é delegada a Vigencia.contemCompetencia().
 */
import Competencia from './Competencia.js';
import Vigencia from './Vigencia.js';

class RegraVersionada {
  constructor({ codigo, nome, versoes = [] } = {}) {
    if (typeof codigo !== 'string' || codigo.trim() === '') {
      throw new Error('RegraVersionada: codigo é obrigatório.');
    }

    if (typeof nome !== 'string' || nome.trim() === '') {
      throw new Error('RegraVersionada: nome é obrigatório.');
    }

    if (!Array.isArray(versoes)) {
      throw new Error('RegraVersionada: versoes deve ser um array.');
    }

    this.codigo = codigo.trim();
    this.nome = nome.trim();
    this.versoes = [];

    for (const versao of versoes) {
      this.adicionarVersao(versao);
    }
  }

  adicionarVersao(versao) {
    this.#validarVersao(versao);

    if (this.versoes.some((item) => item.id === versao.id)) {
      throw new Error('RegraVersionada: a versão "' + versao.id + '" já existe.');
    }

    for (const existente of this.versoes) {
      if (existente.vigencia.sobrepoe(versao.vigencia)) {
        throw new Error(
          'RegraVersionada: uma vigência sobrepõe uma versão existente.',
        );
      }
    }

    this.versoes.push({ ...versao });
    return this;
  }

  /**
   * Retorna a versão cuja vigência intersecta a competência mensal.
   * Uma competência é considerada coberta se ao menos um dia do mês
   * estiver dentro da vigência, conforme Vigencia.contemCompetencia().
   */
  obterVersaoVigente(competencia) {
    this.#validarCompetencia(competencia);

    const vigentes = this.versoes.filter((versao) =>
      versao.vigencia.contemCompetencia(competencia),
    );

    if (vigentes.length > 1) {
      throw new Error(
        'RegraVersionada: múltiplas versões vigentes para ' +
          competencia.toString() + '.',
      );
    }

    return vigentes[0] ?? null;
  }

  possuiVersaoVigente(competencia) {
    return this.obterVersaoVigente(competencia) !== null;
  }

  listarVersoes() {
    return [...this.versoes].sort((a, b) =>
      a.vigencia.inicio.getTime() - b.vigencia.inicio.getTime(),
    );
  }

  #validarCompetencia(competencia) {
    if (!(competencia instanceof Competencia)) {
      throw new TypeError(
        'RegraVersionada: competencia deve ser uma instância de Competencia.',
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
      !(versao.vigencia instanceof Vigencia) ||
      typeof versao.vigencia.contemCompetencia !== 'function' ||
      typeof versao.vigencia.sobrepoe !== 'function'
    ) {
      throw new Error(
        'RegraVersionada: a versão "' + versao.id +
          '" deve possuir uma instância de Vigencia.',
      );
    }

    const possuiRegra =
      typeof versao.regra === 'function' ||
      typeof versao.calcular === 'function' ||
      typeof versao.executar === 'function';

    if (!possuiRegra) {
      throw new Error(
        'RegraVersionada: a versão "' + versao.id +
          '" deve possuir uma função de regra.',
      );
    }

    if (
      !(versao.vigencia.inicio instanceof Date) ||
      Number.isNaN(versao.vigencia.inicio.getTime()) ||
      (versao.vigencia.fim !== null &&
        (!(versao.vigencia.fim instanceof Date) ||
          Number.isNaN(versao.vigencia.fim.getTime())))
    ) {
      throw new Error(
        'RegraVersionada: os limites da vigência devem ser datas válidas.',
      );
    }
  }
}

export default RegraVersionada;
