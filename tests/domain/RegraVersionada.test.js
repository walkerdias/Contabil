import { describe, expect, it } from 'vitest';
import RegraVersionada from './RegraVersionada.js';

function criarVigencia(inicio, fim = null) {
  return {
    inicio: new Date(inicio),
    fim: fim ? new Date(fim) : null,

    estaVigenteEm(data) {
      const inicioData = this.inicio;
      const fimData = this.fim;

      return (
        data >= inicioData &&
        (!fimData || data <= fimData)
      );
    },
  };
}

function criarVersao(id, inicio, fim = null, resultado = id) {
  return {
    id,
    vigencia: criarVigencia(inicio, fim),
    regra: () => resultado,
  };
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
      ).toThrow('codigo é obrigatório');
    });

    it('deve rejeitar código que não seja string', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 123,
            nome: 'Regra inválida',
          }),
      ).toThrow('codigo é obrigatório');
    });

    it('deve rejeitar nome ausente', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 'REGRA-001',
          }),
      ).toThrow('nome é obrigatório');
    });

    it('deve rejeitar versões que não sejam um array', () => {
      expect(
        () =>
          new RegraVersionada({
            codigo: 'REGRA-001',
            nome: 'Regra',
            versoes: {},
          }),
      ).toThrow('versoes deve ser um array');
    });
  });

  describe('versões', () => {
    it('deve adicionar uma versão válida', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

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

    it('deve rejeitar versão sem id', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      expect(() =>
        regra.adicionarVersao({
          vigencia: criarVigencia('2026-01-01'),
          regra: () => 100,
        }),
      ).toThrow('deve possuir id');
    });

    it('deve rejeitar versão sem vigência', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      expect(() =>
        regra.adicionarVersao({
          id: 'v1',
          regra: () => 100,
        }),
      ).toThrow('deve possuir vigência');
    });

    it('deve rejeitar versão sem função de regra', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      expect(() =>
        regra.adicionarVersao({
          id: 'v1',
          vigencia: criarVigencia('2026-01-01'),
        }),
      ).toThrow('deve possuir uma função de regra');
    });

    it('deve rejeitar versões com o mesmo id', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao('v1', '2026-01-01', '2026-06-30'),
      );

      expect(() =>
        regra.adicionarVersao(
          criarVersao('v1', '2026-07-01', '2026-12-31'),
        ),
      ).toThrow('já existe');
    });
  });

  describe('vigência', () => {
    it('deve reconhecer uma versão vigente dentro do período', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      const versao = criarVersao(
        'v1',
        '2026-01-01',
        '2026-12-31',
      );

      regra.adicionarVersao(versao);

      expect(
        regra.possuiVersaoVigente('2026-06-15'),
      ).toBe(true);
    });

    it('deve considerar o início da vigência como inclusivo', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(
        regra.possuiVersaoVigente('2026-01-01'),
      ).toBe(true);
    });

    it('deve considerar o fim da vigência como inclusivo', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(
        regra.possuiVersaoVigente('2026-12-31'),
      ).toBe(true);
    });

    it('deve retornar falso antes do início da vigência', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(
        regra.possuiVersaoVigente('2025-12-31'),
      ).toBe(false);
    });

    it('deve retornar falso depois do fim da vigência', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-12-31',
        ),
      );

      expect(
        regra.possuiVersaoVigente('2027-01-01'),
      ).toBe(false);
    });

    it('deve aceitar vigência sem data final', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
        ),
      );

      expect(
        regra.possuiVersaoVigente('2099-12-31'),
      ).toBe(true);
    });

    it('deve rejeitar uma data inválida', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      expect(() =>
        regra.possuiVersaoVigente('data-invalida'),
      ).toThrow('data inválida');
    });
  });

  describe('versões sobrepostas', () => {
    it('deve rejeitar duas versões com vigências sobrepostas', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

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
      ).toThrow('vigência sobrepõe');
    });

    it('deve rejeitar sobreposição exatamente no limite final/inicial', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

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
      ).toThrow('vigência sobrepõe');
    });

    it('deve permitir versões consecutivas sem sobreposição', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

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

    it('deve rejeitar nova versão quando a versão anterior não possui fim', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
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
      ).toThrow('vigência sobrepõe');
    });
  });

  describe('seleção da versão correta', () => {
    it('deve retornar a versão vigente na data consultada', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      const v1 = criarVersao(
        'v1',
        '2026-01-01',
        '2026-06-30',
      );

      const v2 = criarVersao(
        'v2',
        '2026-07-01',
        '2026-12-31',
      );

      regra.adicionarVersao(v1);
      regra.adicionarVersao(v2);

      expect(
        regra.obterVersaoVigente('2026-03-15'),
      ).toBe(v1);

      expect(
        regra.obterVersaoVigente('2026-09-15'),
      ).toBe(v2);
    });

    it('deve retornar null quando nenhuma versão estiver vigente', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      regra.adicionarVersao(
        criarVersao(
          'v1',
          '2026-01-01',
          '2026-06-30',
        ),
      );

      expect(
        regra.obterVersaoVigente('2027-01-01'),
      ).toBeNull();
    });

    it('deve aceitar Date como data de consulta', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      const versao = criarVersao(
        'v1',
        '2026-01-01',
        '2026-12-31',
      );

      regra.adicionarVersao(versao);

      expect(
        regra.obterVersaoVigente(
          new Date('2026-05-10'),
        ),
      ).toBe(versao);
    });
  });

  describe('listagem', () => {
    it('deve listar as versões ordenadas pelo início da vigência', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      const v1 = criarVersao(
        'v1',
        '2026-01-01',
        '2026-03-31',
      );

      const v2 = criarVersao(
        'v2',
        '2026-04-01',
        '2026-06-30',
      );

      regra.adicionarVersao(v2);
      regra.adicionarVersao(v1);

      const versoes = regra.listarVersoes();

      expect(versoes.map((versao) => versao.id)).toEqual([
        'v1',
        'v2',
      ]);
    });

    it('não deve alterar a ordem interna ao listar versões', () => {
      const regra = new RegraVersionada({
        codigo: 'REGRA-001',
        nome: 'Regra de teste',
      });

      const v1 = criarVersao(
        'v1',
        '2026-01-01',
        '2026-03-31',
      );

      const v2 = criarVersao(
        'v2',
        '2026-04-01',
        '2026-06-30',
      );

      regra.adicionarVersao(v2);
      regra.adicionarVersao(v1);

      regra.listarVersoes();

      expect(regra.versoes.map((versao) => versao.id)).toEqual([
        'v2',
        'v1',
      ]);
    });
  });
});