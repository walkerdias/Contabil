import { describe, expect, it } from 'vitest';
import Competencia from '../../js/domain/Competencia.js';
import RegraVersionada from '../../js/domain/RegraVersionada.js';
import Vigencia from '../../js/domain/Vigencia.js';

function competencia(ano, mes) {
  return new Competencia(ano, mes);
}

function criarVersao(id, inicio, fim, resultado = id) {
  const vigencia = fim
    ? Vigencia.entre(inicio, fim)
    : Vigencia.de(inicio);

  return { id, vigencia, regra: () => resultado };
}

function criarRegra() {
  return new RegraVersionada({
    codigo: 'REGRA-001',
    nome: 'Regra de teste',
  });
}

describe('RegraVersionada e Vigencia: integração temporal', () => {
  it('consulta competências usando contemCompetencia, sem passar YYYY-MM a contem', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v1', '2026-06-15', '2026-06-20'));

    expect(regra.obterVersaoVigente(competencia(2026, 6)).id).toBe('v1');
    expect(regra.obterVersaoVigente(competencia(2026, 5))).toBeNull();
    expect(regra.obterVersaoVigente(competencia(2026, 7))).toBeNull();
  });

  it('considera coberto um mês parcialmente abrangido pela vigência', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v1', '2026-06-15', '2026-07-10'));

    expect(regra.possuiVersaoVigente(competencia(2026, 6))).toBe(true);
    expect(regra.possuiVersaoVigente(competencia(2026, 7))).toBe(true);
    expect(regra.possuiVersaoVigente(competencia(2026, 8))).toBe(false);
  });

  it('considera uma vigência diária dentro do mês como cobertura dessa competência', () => {
    const vigencia = Vigencia.entre('2026-02-10', '2026-02-11');

    expect(vigencia.contemCompetencia(competencia(2026, 2))).toBe(true);
    expect(vigencia.contemCompetencia(competencia(2026, 1))).toBe(false);
    expect(vigencia.contemCompetencia(competencia(2026, 3))).toBe(false);
  });

  it('trata corretamente a virada de ano', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v2026', '2026-12-20', '2027-01-05'));

    expect(regra.obterVersaoVigente(competencia(2026, 12)).id).toBe('v2026');
    expect(regra.obterVersaoVigente(competencia(2027, 1)).id).toBe('v2026');
    expect(regra.obterVersaoVigente(competencia(2027, 2))).toBeNull();
  });

  it('permite vigência aberta e cobre as competências posteriores ao início', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('aberta', '2026-06-15', null));

    expect(regra.possuiVersaoVigente(competencia(2026, 6))).toBe(true);
    expect(regra.possuiVersaoVigente(competencia(2030, 1))).toBe(true);
    expect(regra.possuiVersaoVigente(competencia(2026, 5))).toBe(false);
  });

  it('valida sobreposições com as datas diárias reais, não com meses convertidos', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v1', '2026-01-01', '2026-06-30'));

    expect(() => {
      regra.adicionarVersao(criarVersao('v2', '2026-06-30', '2026-12-31'));
    }).toThrow(/vigência sobrepõe/);

    expect(() => {
      regra.adicionarVersao(criarVersao('v3', '2026-07-01', '2026-12-31'));
    }).not.toThrow();
  });

  it('rejeita consultas que não sejam instâncias de Competencia', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v1', '2026-01-01', '2026-12-31'));

    expect(() => regra.obterVersaoVigente('2026-06')).toThrow(/instância de Competencia/);
    expect(() => regra.obterVersaoVigente(new Date('2026-06-01T00:00:00.000Z'))).toThrow(/instância de Competencia/);
  });

  it('rejeita objetos de vigência que não sejam instâncias do domínio Vigencia', () => {
    const regra = criarRegra();

    expect(() => regra.adicionarVersao({
      id: 'mock',
      vigencia: {
        inicio: new Date('2026-01-01T00:00:00.000Z'),
        fim: null,
        contem: () => true,
      },
      regra: () => 1,
    })).toThrow(/instância de Vigencia/);
  });

  it('ordena as versões pela data diária inicial sem alterar a ordem interna', () => {
    const regra = criarRegra();
    regra.adicionarVersao(criarVersao('v2', '2026-07-01', '2026-12-31'));
    regra.adicionarVersao(criarVersao('v1', '2026-01-01', '2026-06-30'));

    expect(regra.listarVersoes().map((versao) => versao.id)).toEqual(['v1', 'v2']);
    expect(regra.versoes.map((versao) => versao.id)).toEqual(['v2', 'v1']);
  });
});
