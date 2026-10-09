import Empresa from '../../js/domain/Empresa.js';

describe('Empresa', () => {
  const CNPJ_VALIDO = '12.345.678/0001-95';

  describe('criação', () => {
    it('deve criar uma empresa com os dados informados', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        razaoSocial: 'Empresa Exemplo LTDA',
        nomeFantasia: 'Empresa Exemplo',
      });

      expect(empresa.id).toBe('empresa-1');
      expect(empresa.cnpj).toBe('12345678000195');
      expect(empresa.razaoSocial).toBe('Empresa Exemplo LTDA');
      expect(empresa.nomeFantasia).toBe('Empresa Exemplo');
      expect(empresa.ativa).toBe(true);
    });

    it('deve criar uma empresa ativa por padrão', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      expect(empresa.ativa).toBe(true);
      expect(empresa.estaAtiva()).toBe(true);
    });

    it('deve aceitar empresa inicialmente inativa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        ativa: false,
      });

      expect(empresa.ativa).toBe(false);
      expect(empresa.estaAtiva()).toBe(false);
    });
  });

  describe('normalização', () => {
    it('deve remover a máscara do CNPJ', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: '12.345.678/0001-95',
      });

      expect(empresa.cnpj).toBe('12345678000195');
    });

    it('deve remover espaços dos textos', () => {
      const empresa = new Empresa({
        id: ' empresa-1 ',
        cnpj: CNPJ_VALIDO,
        razaoSocial: '  Empresa Exemplo LTDA  ',
        nomeFantasia: '  Empresa Exemplo  ',
      });

      expect(empresa.id).toBe('empresa-1');
      expect(empresa.razaoSocial).toBe('Empresa Exemplo LTDA');
      expect(empresa.nomeFantasia).toBe('Empresa Exemplo');
    });

    it('deve aceitar CNPJ informado somente com números', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: '12345678000195',
      });

      expect(empresa.cnpj).toBe('12345678000195');
    });
  });

  describe('validação', () => {
    it('deve exigir id', () => {
      expect(() => {
        new Empresa({
          cnpj: CNPJ_VALIDO,
        });
      }).toThrow('Empresa: id é obrigatório.');
    });

    it('deve exigir CNPJ', () => {
      expect(() => {
        new Empresa({
          id: 'empresa-1',
        });
      }).toThrow('Empresa: cnpj é obrigatório.');
    });

    it('deve rejeitar CNPJ com quantidade incorreta de dígitos', () => {
      expect(Empresa.cnpjValido('1234567800019')).toBe(false);
      expect(Empresa.cnpjValido('123456780001950')).toBe(false);
    });

    it('deve rejeitar CNPJ composto pelo mesmo dígito', () => {
      expect(Empresa.cnpjValido('00000000000000')).toBe(false);
      expect(Empresa.cnpjValido('11111111111111')).toBe(false);
      expect(Empresa.cnpjValido('99999999999999')).toBe(false);
    });

    it('deve rejeitar CNPJ com dígito verificador incorreto', () => {
      expect(Empresa.cnpjValido('12345678000196')).toBe(false);
    });

    it('deve aceitar CNPJ válido', () => {
      expect(Empresa.cnpjValido('12345678000195')).toBe(true);
    });

    it('deve aceitar CNPJ válido com máscara', () => {
      expect(Empresa.cnpjValido('12.345.678/0001-95')).toBe(true);
    });

    it('deve rejeitar CNPJ vazio', () => {
      expect(Empresa.cnpjValido('')).toBe(false);
    });

    it('deve rejeitar CNPJ nulo', () => {
      expect(Empresa.cnpjValido(null)).toBe(false);
    });
  });

  describe('estado', () => {
    it('deve ativar uma empresa inativa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        ativa: false,
      });

      empresa.ativar();

      expect(empresa.estaAtiva()).toBe(true);
    });

    it('deve inativar uma empresa ativa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      empresa.inativar();

      expect(empresa.estaAtiva()).toBe(false);
    });

    it('deve permitir ativar uma empresa já ativa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      empresa.ativar();

      expect(empresa.estaAtiva()).toBe(true);
    });

    it('deve permitir inativar uma empresa já inativa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        ativa: false,
      });

      empresa.inativar();

      expect(empresa.estaAtiva()).toBe(false);
    });
  });

  describe('igualdade', () => {
    it('deve considerar duas empresas iguais quando possuem o mesmo id', () => {
      const empresa1 = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      const empresa2 = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      expect(empresa1.equals(empresa2)).toBe(true);
    });

    it('não deve considerar empresas com ids diferentes como iguais', () => {
      const empresa1 = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      const empresa2 = new Empresa({
        id: 'empresa-2',
        cnpj: CNPJ_VALIDO,
      });

      expect(empresa1.equals(empresa2)).toBe(false);
    });

    it('não deve considerar um objeto comum como Empresa', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      expect(
        empresa.equals({
          id: 'empresa-1',
          cnpj: '12345678000195',
        }),
      ).toBe(false);
    });

    it('deve considerar a própria instância como igual', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
      });

      expect(empresa.equals(empresa)).toBe(true);
    });
  });

  describe('serialização', () => {
    it('deve converter a empresa para JSON', () => {
      const empresa = new Empresa({
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        razaoSocial: 'Empresa Exemplo LTDA',
        nomeFantasia: 'Empresa Exemplo',
      });

      expect(empresa.toJSON()).toEqual({
        id: 'empresa-1',
        cnpj: '12345678000195',
        razaoSocial: 'Empresa Exemplo LTDA',
        nomeFantasia: 'Empresa Exemplo',
        ativa: true,
      });
    });

    it('deve reconstruir uma Empresa através de fromJSON', () => {
      const dados = {
        id: 'empresa-1',
        cnpj: CNPJ_VALIDO,
        razaoSocial: 'Empresa Exemplo LTDA',
        nomeFantasia: 'Empresa Exemplo',
        ativa: false,
      };

      const empresa = Empresa.fromJSON(dados);

      expect(empresa).toBeInstanceOf(Empresa);
      expect(empresa.toJSON()).toEqual({
        id: 'empresa-1',
        cnpj: '12345678000195',
        razaoSocial: 'Empresa Exemplo LTDA',
        nomeFantasia: 'Empresa Exemplo',
        ativa: false,
      });
    });
  });
});