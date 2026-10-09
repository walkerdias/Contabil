import Competencia from "./Competencia.js";

/**
 * Resolve a versão correta de uma regra para uma competência mensal.
 * Regras podem implementar estaVigenteEm(competencia) ou expor uma vigência.
 */
class RegraResolver {
  /**
   * @param {Array} regras
   */
  constructor(regras = []) {
    if (!Array.isArray(regras)) {
      throw new TypeError("regras deve ser um array");
    }

    this.regras = [...regras];
  }

  /**
   * Resolve uma regra pelo código para uma competência.
   *
   * @param {string} codigo
   * @param {Competencia} competencia
   * @returns {RegraVersionada}
   *
   * @throws {TypeError} quando os argumentos são inválidos
   * @throws {Error} quando nenhuma regra é encontrada
   * @throws {Error} quando mais de uma versão é aplicável
   */
  resolver(codigo, competencia) {
    this.validarCodigo(codigo);
    this.validarCompetencia(competencia);

    const candidatas = this.regras.filter((regra) => {
      return this.obterCodigo(regra) === codigo;
    });

    const vigentes = candidatas.filter((regra) => {
      return this.estaVigente(regra, competencia);
    });

    if (vigentes.length === 0) {
      throw new Error(
        `Nenhuma regra vigente encontrada para "${codigo}" na competência ${this.competenciaTexto(
          competencia
        )}.`
      );
    }

    if (vigentes.length > 1) {
      throw new Error(
        `Mais de uma versão da regra "${codigo}" está vigente na competência ${this.competenciaTexto(
          competencia
        )}.`
      );
    }

    return vigentes[0];
  }

  /**
   * Retorna null quando nenhuma regra estiver vigente.
   *
   * Útil para consultas onde a ausência de regra não representa erro.
   *
   * @param {string} codigo
   * @param {Competencia} competencia
   * @returns {RegraVersionada|null}
   */
  tentarResolver(codigo, competencia) {
    this.validarCodigo(codigo);
    this.validarCompetencia(competencia);

    const candidatas = this.regras.filter((regra) => {
      return this.obterCodigo(regra) === codigo;
    });

    const vigentes = candidatas.filter((regra) => {
      return this.estaVigente(regra, competencia);
    });

    if (vigentes.length > 1) {
      throw new Error(
        `Mais de uma versão da regra "${codigo}" está vigente na competência ${this.competenciaTexto(
          competencia
        )}.`
      );
    }

    return vigentes[0] ?? null;
  }

  /**
   * Resolve todas as regras vigentes para uma competência.
   *
   * @param {Competencia} competencia
   * @returns {Array}
   */
  resolverTodas(competencia) {
    this.validarCompetencia(competencia);

    const grupos = new Map();

    for (const regra of this.regras) {
      const codigo = this.obterCodigo(regra);

      if (!grupos.has(codigo)) {
        grupos.set(codigo, []);
      }

      grupos.get(codigo).push(regra);
    }

    const resolvidas = [];

    for (const codigo of grupos.keys()) {
      const regra = this.tentarResolver(codigo, competencia);

      if (regra !== null) {
        resolvidas.push(regra);
      }
    }

    return resolvidas;
  }

  /**
   * Verifica se uma regra está vigente na competência informada.
   *
   * @param {RegraVersionada} regra
   * @param {Competencia} competencia
   * @returns {boolean}
   */
  estaVigente(regra, competencia) {
    if (!regra || typeof regra !== "object") {
      throw new TypeError("regra inválida");
    }

    if (typeof regra.estaVigenteEm === "function") {
      return regra.estaVigenteEm(competencia);
    }

    const competenciaNormalizada = Competencia.from(competencia);

    if (
      regra.vigencia &&
      typeof regra.vigencia.contemCompetencia === "function"
    ) {
      return regra.vigencia.contemCompetencia(competenciaNormalizada);
    }

    if (
      regra.vigencia &&
      typeof regra.vigencia.contem === "function"
    ) {
      // contem() recebe uma data, não uma Competencia. Para manter a
      // semântica mensal, verifica a interseção dos intervalos.
      const inicioMes = new Date(Date.UTC(
        competenciaNormalizada.ano,
        competenciaNormalizada.mes - 1,
        1
      ));
      const fimMes = new Date(Date.UTC(
        competenciaNormalizada.ano,
        competenciaNormalizada.mes,
        0
      ));
      const inicioVigencia = regra.vigencia.inicio;
      const fimVigencia = regra.vigencia.fim ?? null;

      if (!(inicioVigencia instanceof Date)) {
        throw new TypeError(
          "A vigência deve implementar contemCompetencia(competencia) ou expor inicio/fim como Date."
        );
      }

      return inicioVigencia <= fimMes &&
        (fimVigencia === null || fimVigencia >= inicioMes);
    }

    throw new TypeError(
      "A regra deve implementar estaVigenteEm(competencia) ou possuir vigencia.contemCompetencia(competencia)."
    );
  }
  /**
   * Obtém o código da regra.
   *
   * Aceita tanto `codigo` quanto `id.codigo`, permitindo uma
   * evolução gradual do modelo sem colocar lógica de persistência
   * dentro do resolver.
   *
   * @param {RegraVersionada} regra
   * @returns {string}
   */
  obterCodigo(regra) {
    if (typeof regra?.codigo === "string") {
      return regra.codigo;
    }

    if (typeof regra?.id?.codigo === "string") {
      return regra.id.codigo;
    }

    throw new TypeError(
      "A regra deve possuir um código em `codigo` ou `id.codigo`."
    );
  }

  /**
   * Valida o código informado.
   *
   * @param {string} codigo
   */
  validarCodigo(codigo) {
    if (typeof codigo !== "string" || codigo.trim() === "") {
      throw new TypeError("codigo deve ser uma string não vazia");
    }
  }

  /**
   * Valida a competência.
   *
   * O domínio de Competencia é deliberadamente tratado por contrato:
   * o resolver não precisa conhecer a implementação interna.
   *
   * @param {Competencia} competencia
   */
  validarCompetencia(competencia) {
    if (competencia === null || competencia === undefined) {
      throw new TypeError("competencia é obrigatória");
    }
  }

  /**
   * Representação segura da competência para mensagens de erro.
   *
   * @param {Competencia} competencia
   * @returns {string}
   */
  competenciaTexto(competencia) {
    if (typeof competencia === "string") {
      return competencia;
    }

    if (typeof competencia?.toString === "function") {
      return competencia.toString();
    }

    return String(competencia);
  }
}

export default RegraResolver;