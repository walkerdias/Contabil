
// tests/domain/RegraVersionada.test.js

import { describe, expect, it } from 'vitest';
import Competencia from '../../js/domain/Competencia.js';
import RegraVersionada from '../../js/domain/RegraVersionada.js';
import Vigencia from '../../js/domain/Vigencia.js';

/**
 * As vigências seguem o contrato real de Vigencia.js:
 * - Vigencia.entre(inicio, fim)
 * - Vigencia.de(inicio)
 * - datas no formato YYYY-MM-DD
 * - limites inclusivos
 *
 * As consultas da regra utilizam Competencia (ano e mês).
 */

function competencia(ano, mes) {
  return new Competencia(ano, mes);
}

function criarVersao(
  id,
  inicio,
  fim,
  resultado = id,
) {
  const vigencia = fim
    ? Vigencia.entre(inicio, fim)
    : Vigencia.de(inicio);

  return {
    id,
    vigencia,
    regra: () => resultado,
  };
}

function criarRegra() {
  return new RegraVersionada({
    codigo: 'REGRA-001',
    nome: 'Regra de teste',
  });
}

describe('RegraVersionada', () => {
  describe('criação', () => {
    it('deve criar uma regra versionada válida', () => {
      const regra = new RegraVersionada({
        codigo: 'SIMP-NAC-P1',
        nome: 'Simples Nacional P1',
      });

      expect(regra.codigo).toBe('SIMP-NAC-P1');
      expect(regra.nome).toBe('Simples Nacional P1');
      expect(regra.versoes).toEqual([]);
    });

    it('deve rejeitar código ausente', () => {
      expect(
        () =>
          new RegraVersionada({
            nome: 'Regra sem código',
          }),
      ).toThrow(/codigo é obrigatório/);
    });

    it('deve rejeitar código que não seja string', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 123,
            nome: 'Regra inválida',
          }),
      ).toThrow(/codigo é obrigatório/);
    });

    it('deve rejeitar nome ausente', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 'REGRA-001',
          }),
      ).toThrow(/nome é obrigatório/);
    });

    it('deve rejeitar versões que não sejam um array', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 'REGRA-001',
            nome: 'Regra',
            versoes: {},
          }),
      ).toThrow(/versoes deve ser um array/);
    });
  });

  describe('adicionar versões', () => {
    it('deve adicionar uma versão válida', () => {
      const regra = criarRegra();
      const versao = criarVersao(
        'v1',
        '2026-01-01',
        '2026-12-31',
      );

      const resultado = regra.adicionarVersao(versao);

      expect(resultado).toBe(regra);
      expect(regra.versoes).toHaveLength(1);
      expect(regra.versoes[0].id).toBe('v1');
    });

    it('deve rejeitar versão sem identificador', () => {
      const regra = criarRegra();

      expect(() =>
        regra.adicionarVersao({
          vigencia: Vigencia.de('2026-01-01'),
          regra: () => 100,
        }),
      ).toThrow(/deve possuir id/);
    });

    it('deve rejeitar versão sem vigência', () => {
      const regra = criarRegra();

      expect(() =>
        regra.adicionarVersao({
          id: 'v1',
          regra: () => 100,
        }),
      ).toThrow(/deve possuir vigência/);
    });

    it('deve rejeitar versão sem função de regra', () => {
      const regra = criarRegra();

      expect(() =>
        regra.adicionarVersao({
          id: 'v1',
          vigencia: Vigencia.de('2026-01-01'),
        }),
      ).toThrow(/função de regra/);
    });

    it('deve rejeitar duas versões com o mesmo identificador', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(() =>
        regra.adicionarVersao(
          criarVersao(
            'v1',
            '2026-07-01',
            '2026-12-31',
          ),
        ),
      ).toThrow(/já existe/);
    });
  });

  describe('consulta por competência', () => {
    it('deve aceitar uma instância de Competencia', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(
        regra.possuiVersaoVigente(
          competencia(2026, 6),
        ),
      ).toBe(true);
    });

    it('deve retornar a versão vigente para a competência consultada', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
          'resultado-v1',
        ),
      );

      regra.adicionarVersao(
        criarVersao(
          'v2',
          '2026-07-01',
          '2026-12-31',
          'resultado-v2',
        ),
      );

      expect(
        regra.obterVersaoVigente(
          competencia(2026, 3),
        )?.id,
      ).toBe('v1');

      expect(
        regra.obterVersaoVigente(
          competencia(2026, 9),
        )?.id,
      ).toBe('v2');
    });

    it('deve retornar null quando nenhuma versão estiver vigente', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(
        regra.obterVersaoVigente(
          competencia(2026, 7),
        ),
      ).toBeNull();
    });

    it('deve retornar falso quando não houver versão vigente', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(
        regra.possuiVersaoVigente(
          competencia(2026, 7),
        ),
      ).toBe(false);
    });

    it('deve rejeitar consulta que não seja uma Competencia', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(() =>
        regra.obterVersaoVigente('2026-06-15'),
      ).toThrow();

      expect(() =>
        regra.possuiVersaoVigente(
          new Date('2026-06-15T00:00:00.000Z'),
        ),
      ).toThrow();
    });
  });

  describe('virada de ano', () => {
    it('deve selecionar corretamente a versão em dezembro e janeiro', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v2026',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      regra.adicionarVersao(
        criarVersao(
          'v2027',
          '2027-01-01',
          '2027-12-31',
        ),
      );

      expect(
        regra.obterVersaoVigente(
          competencia(2026, 12),
        )?.id,
      ).toBe('v2026');

      expect(
        regra.obterVersaoVigente(
          competencia(2027, 1),
        )?.id,
      ).toBe('v2027');
    });
  });

  describe('vigências sobrepostas', () => {
    it('deve rejeitar duas versões com períodos sobrepostos', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(() =>
        regra.adicionarVersao(
          criarVersao(
            'v2',
            '2026-06-15',
            '2026-12-31',
          ),
        ),
      ).toThrow(/vigência sobrepõe/);
    });

    it('deve rejeitar sobreposição no dia final/inicial', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(() =>
        regra.adicionarVersao(
          criarVersao(
            'v2',
            '2026-06-30',
            '2026-12-31',
          ),
        ),
      ).toThrow(/vigência sobrepõe/);
    });

    it('deve permitir períodos consecutivos sem sobreposição', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      regra.adicionarVersao(
        criarVersao(
          'v2',
          '2026-07-01',
          '2026-12-31',
        ),
      );

      expect(regra.versoes).toHaveLength(2);
    });

    it('deve rejeitar nova versão após uma vigência aberta', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          null,
        ),
      );

      expect(() =>
        regra.adicionarVersao(
          criarVersao(
            'v2',
            '2027-01-01',
            '2027-12-31',
          ),
        ),
      ).toThrow(/vigência sobrepõe/);
    });
  });

  describe('listagem', () => {
    it('deve listar as versões pela data inicial da vigência', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v2',
          '2026-04-01',
          '2026-06-30',
        ),
      );

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-03-31',
        ),
      );

      expect(
        regra.listarVersoes().map((versao) => versao.id),
      ).toEqual(['v1', 'v2']);
    });

    it('não deve alterar a ordem interna ao listar versões', () => {
      const regra = criarRegra();

      regra.adicionarVersao(
        criarVersao(
          'v2',
          '2026-04-01',
          '2026-06-30',
        ),
      );

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-03-31',
        ),
      );

      regra.listarVersoes();

      expect(
        regra.versoes.map((versao) => versao.id),
      ).toEqual(['v2', 'v1']);
    });
  });
});