import { describe, expect, test } from "vitest";
import Vigencia from "./Vigencia.js";

describe("Vigencia", () => {
  describe("criação", () => {
    test("cria uma vigência com início e fim", () => {
      const vigencia = new Vigencia(
        "2026-01-01",
        "2026-12-31"
      );

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: "2026-12-31",
      });
    });

    test("cria uma vigência aberta", () => {
      const vigencia = new Vigencia("2026-01-01");

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: null,
      });

      expect(vigencia.ehAberta()).toBe(true);
    });

    test("cria uma vigência usando o factory de", () => {
      const vigencia = Vigencia.de("2026-01-01");

      expect(vigencia).toBeInstanceOf(Vigencia);
      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: null,
      });
    });

    test("cria uma vigência usando o factory entre", () => {
      const vigencia = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      expect(vigencia).toBeInstanceOf(Vigencia);
      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: "2026-12-31",
      });
    });

    test("aceita Date como entrada", () => {
      const inicio = new Date("2026-01-01T15:30:00Z");
      const fim = new Date("2026-12-31T20:00:00Z");

      const vigencia = new Vigencia(inicio, fim);

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: "2026-12-31",
      });
    });
  });

  describe("validação", () => {
    test("rejeita início posterior ao fim", () => {
      expect(() => {
        new Vigencia(
          "2026-12-31",
          "2026-01-01"
        );
      }).toThrow(RangeError);
    });

    test("aceita início igual ao fim", () => {
      const vigencia = new Vigencia(
        "2026-06-30",
        "2026-06-30"
      );

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-06-30",
        fim: "2026-06-30",
      });
    });

    test("rejeita data fora do formato YYYY-MM-DD", () => {
      expect(() => {
        new Vigencia("01/01/2026");
      }).toThrow(TypeError);
    });

    test("rejeita data com horário em string", () => {
      expect(() => {
        new Vigencia("2026-01-01T00:00:00Z");
      }).toThrow(TypeError);
    });

    test("rejeita data inexistente", () => {
      expect(() => {
        new Vigencia("2026-02-30");
      }).toThrow(RangeError);
    });

    test("rejeita mês inválido", () => {
      expect(() => {
        new Vigencia("2026-13-01");
      }).toThrow(RangeError);
    });

    test("rejeita dia zero", () => {
      expect(() => {
        new Vigencia("2026-01-00");
      }).toThrow(RangeError);
    });

    test("rejeita tipo de data inválido", () => {
      expect(() => {
        new Vigencia(20260101);
      }).toThrow(TypeError);
    });

    test("rejeita Date inválido", () => {
      expect(() => {
        new Vigencia(new Date("data inválida"));
      }).toThrow(TypeError);
    });
  });

  describe("imutabilidade", () => {
    test("a instância é congelada", () => {
      const vigencia = new Vigencia(
        "2026-01-01",
        "2026-12-31"
      );

      expect(Object.isFrozen(vigencia)).toBe(true);
    });
  });

  describe("contem", () => {
    const vigencia = Vigencia.entre(
      "2026-01-01",
      "2026-12-31"
    );

    test("contém a data de início", () => {
      expect(vigencia.contem("2026-01-01")).toBe(true);
    });

    test("contém a data de fim", () => {
      expect(vigencia.contem("2026-12-31")).toBe(true);
    });

    test("contém uma data intermediária", () => {
      expect(vigencia.contem("2026-06-15")).toBe(true);
    });

    test("não contém uma data anterior ao início", () => {
      expect(vigencia.contem("2025-12-31")).toBe(false);
    });

    test("não contém uma data posterior ao fim", () => {
      expect(vigencia.contem("2027-01-01")).toBe(false);
    });

    test("vigência aberta contém qualquer data posterior ao início", () => {
      const aberta = Vigencia.de("2026-01-01");

      expect(aberta.contem("2026-01-01")).toBe(true);
      expect(aberta.contem("2026-12-31")).toBe(true);
      expect(aberta.contem("2030-01-01")).toBe(true);
    });

    test("vigência aberta não contém data anterior ao início", () => {
      const aberta = Vigencia.de("2026-01-01");

      expect(aberta.contem("2025-12-31")).toBe(false);
    });
  });

  describe("iniciaDepoisDe", () => {
    const vigencia = Vigencia.entre(
      "2026-06-01",
      "2026-12-31"
    );

    test("retorna true quando inicia depois da data", () => {
      expect(
        vigencia.iniciaDepoisDe("2026-05-31")
      ).toBe(true);
    });

    test("retorna false quando inicia na mesma data", () => {
      expect(
        vigencia.iniciaDepoisDe("2026-06-01")
      ).toBe(false);
    });

    test("retorna false quando inicia antes da data", () => {
      expect(
        vigencia.iniciaDepoisDe("2026-06-02")
      ).toBe(false);
    });
  });

  describe("terminaAntesDe", () => {
    const vigencia = Vigencia.entre(
      "2026-01-01",
      "2026-06-30"
    );

    test("retorna true quando termina antes da data", () => {
      expect(
        vigencia.terminaAntesDe("2026-07-01")
      ).toBe(true);
    });

    test("retorna false quando termina na mesma data", () => {
      expect(
        vigencia.terminaAntesDe("2026-06-30")
      ).toBe(false);
    });

    test("retorna false quando termina depois da data", () => {
      expect(
        vigencia.terminaAntesDe("2026-06-29")
      ).toBe(false);
    });

    test("vigência aberta nunca termina antes de uma data", () => {
      const aberta = Vigencia.de("2026-01-01");

      expect(
        aberta.terminaAntesDe("2030-01-01")
      ).toBe(false);
    });
  });

  describe("sobrepoe", () => {
    test("detecta sobreposição parcial no início", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-06-30"
      );

      const segunda = Vigencia.entre(
        "2026-06-01",
        "2026-12-31"
      );

      expect(primeira.sobrepoe(segunda)).toBe(true);
      expect(segunda.sobrepoe(primeira)).toBe(true);
    });

    test("detecta sobreposição parcial no fim", () => {
      const primeira = Vigencia.entre(
        "2026-06-01",
        "2026-12-31"
      );

      const segunda = Vigencia.entre(
        "2026-01-01",
        "2026-06-30"
      );

      expect(primeira.sobrepoe(segunda)).toBe(true);
    });

    test("detecta vigência contida em outra", () => {
      const externa = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      const interna = Vigencia.entre(
        "2026-03-01",
        "2026-06-30"
      );

      expect(externa.sobrepoe(interna)).toBe(true);
      expect(interna.sobrepoe(externa)).toBe(true);
    });

    test("detecta vigências idênticas", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      const segunda = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      expect(primeira.sobrepoe(segunda)).toBe(true);
    });

    test("considera limites compartilhados como sobreposição", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-06-30"
      );

      const segunda = Vigencia.entre(
        "2026-06-30",
        "2026-12-31"
      );

      expect(primeira.sobrepoe(segunda)).toBe(true);
    });

    test("não detecta sobreposição entre períodos separados", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-03-31"
      );

      const segunda = Vigencia.entre(
        "2026-04-01",
        "2026-06-30"
      );

      expect(primeira.sobrepoe(segunda)).toBe(false);
      expect(segunda.sobrepoe(primeira)).toBe(false);
    });

    test("vigência aberta sobrepõe período posterior", () => {
      const aberta = Vigencia.de("2026-01-01");

      const posterior = Vigencia.entre(
        "2030-01-01",
        "2030-12-31"
      );

      expect(aberta.sobrepoe(posterior)).toBe(true);
      expect(posterior.sobrepoe(aberta)).toBe(true);
    });

    test("vigência aberta não sobrepõe período totalmente anterior", () => {
      const aberta = Vigencia.de("2026-01-01");

      const anterior = Vigencia.entre(
        "2025-01-01",
        "2025-12-31"
      );

      expect(aberta.sobrepoe(anterior)).toBe(false);
      expect(anterior.sobrepoe(aberta)).toBe(false);
    });

    test("rejeita argumento que não seja Vigencia", () => {
      const vigencia = Vigencia.de("2026-01-01");

      expect(() => {
        vigencia.sobrepoe({
          inicio: "2026-01-01",
          fim: "2026-12-31",
        });
      }).toThrow(TypeError);
    });
  });

  describe("ehAdjacenteA", () => {
    test("detecta períodos consecutivos", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-03-31"
      );

      const segunda = Vigencia.entre(
        "2026-04-01",
        "2026-06-30"
      );

      expect(primeira.ehAdjacenteA(segunda)).toBe(true);
      expect(segunda.ehAdjacenteA(primeira)).toBe(true);
    });

    test("não considera períodos sobrepostos como adjacentes", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-04-30"
      );

      const segunda = Vigencia.entre(
        "2026-04-01",
        "2026-06-30"
      );

      expect(primeira.ehAdjacenteA(segunda)).toBe(false);
    });

    test("não considera períodos separados por um dia como adjacentes", () => {
      const primeira = Vigencia.entre(
        "2026-01-01",
        "2026-03-30"
      );

      const segunda = Vigencia.entre(
        "2026-04-01",
        "2026-06-30"
      );

      expect(primeira.ehAdjacenteA(segunda)).toBe(false);
    });

    test("vigência aberta não é adjacente", () => {
      const aberta = Vigencia.de("2026-01-01");

      const outra = Vigencia.entre(
        "2030-01-01",
        "2030-12-31"
      );

      expect(aberta.ehAdjacenteA(outra)).toBe(false);
    });

    test("rejeita argumento que não seja Vigencia", () => {
      const vigencia = Vigencia.de("2026-01-01");

      expect(() => {
        vigencia.ehAdjacenteA(null);
      }).toThrow(TypeError);
    });
  });

  describe("serialização", () => {
    test("toJSON retorna as datas no formato YYYY-MM-DD", () => {
      const vigencia = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: "2026-12-31",
      });
    });

    test("toJSON retorna fim null para vigência aberta", () => {
      const vigencia = Vigencia.de("2026-01-01");

      expect(vigencia.toJSON()).toEqual({
        inicio: "2026-01-01",
        fim: null,
      });
    });

    test("toString representa uma vigência fechada", () => {
      const vigencia = Vigencia.entre(
        "2026-01-01",
        "2026-12-31"
      );

      expect(vigencia.toString()).toBe(
        "2026-01-01 até 2026-12-31"
      );
    });

    test("toString representa uma vigência aberta", () => {
      const vigencia = Vigencia.de("2026-01-01");

      expect(vigencia.toString()).toBe(
        "2026-01-01 até aberta"
      );
    });
  });
});