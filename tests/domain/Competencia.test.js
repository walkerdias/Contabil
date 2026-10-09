
import { describe, it, expect } from 'vitest';
import Competencia from '../../js/domain/Competencia.js';

describe('Competencia', () => {
  describe('validação', () => {
    it('aceita ano e mês válidos', () => {
      const competencia = new Competencia(2026, 10);

      expect(competencia.ano).toBe(2026);
      expect(competencia.mes).toBe(10);
    });

    it.each([1899, 10000, 2026.5, NaN, Infinity])(
      'rejeita ano inválido: %s',
      (ano) => {
        expect(() => new Competencia(ano, 1)).toThrow();
      }
    );

    it.each([0, 13, -1, 1.5, NaN, Infinity])(
      'rejeita mês inválido: %s',
      (mes) => {
        expect(() => new Competencia(2026, mes)).toThrow();
      }
    );

    it('rejeita ano que não seja inteiro', () => {
      expect(() => new Competencia('2026', 1)).toThrow(TypeError);
    });

    it('rejeita mês que não seja inteiro', () => {
      expect(() => new Competencia(2026, '10')).toThrow(TypeError);
    });
  });

  describe('from()', () => {
    it('converte YYYY-MM em Competencia', () => {
      const competencia = Competencia.from('2026-03');

      expect(competencia).toBeInstanceOf(Competencia);
      expect(competencia.ano).toBe(2026);
      expect(competencia.mes).toBe(3);
    });

    it('retorna a mesma instância quando recebe uma Competencia', () => {
      const original = new Competencia(2026, 3);

      expect(Competencia.from(original)).toBe(original);
    });

    it.each([
      '2026-00',
      '2026-13',
      '2026-1',
      '26-01',
      '01/2026',
      '',
    ])('rejeita formato de competência inválido: %s', (valor) => {
      expect(() => Competencia.from(valor)).toThrow();
    });

    it('rejeita valores que não sejam strings nem Competencia', () => {
      expect(() => Competencia.from(202603)).toThrow(TypeError);
      expect(() => Competencia.from(null)).toThrow(TypeError);
    });
  });

  describe('comparação e igualdade', () => {
    it('retorna valor negativo quando esta competência é anterior', () => {
      expect(
        new Competencia(2025, 12).compareTo(
          new Competencia(2026, 1)
        )
      ).toBeLessThan(0);
    });

    it('retorna valor positivo quando esta competência é posterior', () => {
      expect(
        new Competencia(2026, 2).compareTo(
          new Competencia(2026, 1)
        )
      ).toBeGreaterThan(0);
    });

    it('retorna zero para competências iguais', () => {
      expect(
        new Competencia(2026, 10).compareTo(
          new Competencia(2026, 10)
        )
      ).toBe(0);
    });

    it('considera iguais duas competências com o mesmo ano e mês', () => {
      expect(
        new Competencia(2026, 10).equals(
          new Competencia(2026, 10)
        )
      ).toBe(true);
    });

    it('considera diferentes competências com ano ou mês diferente', () => {
      expect(
        new Competencia(2026, 10).equals(
          new Competencia(2026, 9)
        )
      ).toBe(false);

      expect(
        new Competencia(2026, 10).equals(
          new Competencia(2025, 10)
        )
      ).toBe(false);
    });

    it('equals() retorna false para valores que não sejam Competencia', () => {
      expect(new Competencia(2026, 10).equals('2026-10')).toBe(false);
      expect(new Competencia(2026, 10).equals(null)).toBe(false);
    });

    it('expõe os métodos auxiliares de comparação', () => {
      const anterior = new Competencia(2026, 9);
      const atual = new Competencia(2026, 10);
      const posterior = new Competencia(2026, 11);

      expect(anterior.isAnteriorA(atual)).toBe(true);
      expect(posterior.isPosteriorA(atual)).toBe(true);
      expect(atual.isIgualA(new Competencia(2026, 10))).toBe(true);
    });

    it('rejeita compareTo() com valor que não seja Competencia', () => {
      expect(
        () => new Competencia(2026, 10).compareTo('2026-11')
      ).toThrow(TypeError);
    });
  });

  describe('conversão para YYYY-MM', () => {
    it('formata mês com dois dígitos em toString()', () => {
      expect(new Competencia(2026, 3).toString()).toBe('2026-03');
    });

    it('formata dezembro corretamente', () => {
      expect(new Competencia(2026, 12).toString()).toBe('2026-12');
    });

    it('serializa como YYYY-MM em toJSON()', () => {
      expect(new Competencia(2026, 3).toJSON()).toBe('2026-03');

      expect(JSON.stringify(new Competencia(2026, 3))).toBe('"2026-03"');
    });
  });

  describe('mês anterior', () => {
    it('retorna o mês anterior dentro do mesmo ano', () => {
      expect(new Competencia(2026, 10).anterior().toString())
        .toBe('2026-09');
    });

    it('faz a virada de janeiro para dezembro do ano anterior', () => {
      const anterior = new Competencia(2026, 1).anterior();

      expect(anterior.ano).toBe(2025);
      expect(anterior.mes).toBe(12);
      expect(anterior.toString()).toBe('2025-12');
    });
  });

  describe('mês posterior', () => {
    it('retorna o mês posterior dentro do mesmo ano', () => {
      expect(new Competencia(2026, 10).proxima().toString())
        .toBe('2026-11');
    });

    it('faz a virada de dezembro para janeiro do ano seguinte', () => {
      const proxima = new Competencia(2026, 12).proxima();

      expect(proxima.ano).toBe(2027);
      expect(proxima.mes).toBe(1);
      expect(proxima.toString()).toBe('2027-01');
    });
  });

  describe('imutabilidade', () => {
    it('não permite alterar os campos públicos da instância', () => {
      const competencia = new Competencia(2026, 10);

      expect(() => {
        competencia.ano = 2025;
      }).toThrow();

      expect(competencia.ano).toBe(2026);
    });
  });
});