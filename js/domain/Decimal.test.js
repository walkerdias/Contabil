import { describe, expect, it } from 'vitest';
import Decimal from './Decimal.js';

describe('Decimal', () => {
    describe('construção', () => {
        it('deve criar a partir de inteiro', () => {
            const decimal = new Decimal(123);

            expect(decimal.toString()).toBe('123');
        });

        it('deve criar a partir de string decimal', () => {
            const decimal = new Decimal('123.45');

            expect(decimal.toString()).toBe('123.45');
        });

        it('deve aceitar vírgula como separador decimal', () => {
            const decimal = new Decimal('123,45');

            expect(decimal.toString()).toBe('123.45');
        });

        it('deve aceitar número negativo', () => {
            const decimal = new Decimal('-123.45');

            expect(decimal.toString()).toBe('-123.45');
        });

        it('deve aceitar sinal positivo', () => {
            const decimal = new Decimal('+123.45');

            expect(decimal.toString()).toBe('123.45');
        });

        it('deve aceitar bigint', () => {
            const decimal = new Decimal(123n);

            expect(decimal.toString()).toBe('123');
        });

        it('deve rejeitar valor inválido', () => {
            expect(() => new Decimal('abc')).toThrow();
        });

        it('deve rejeitar string vazia', () => {
            expect(() => new Decimal('')).toThrow();
        });

        it('deve rejeitar Infinity', () => {
            expect(() => new Decimal(Infinity)).toThrow();
        });

        it('deve rejeitar NaN', () => {
            expect(() => new Decimal(NaN)).toThrow();
        });
    });

    describe('escala', () => {
        it('deve preservar a escala informada', () => {
            const decimal = new Decimal('10.5', 2);

            expect(decimal.toString()).toBe('10.50');
            expect(decimal.scale()).toBe(2);
        });

        it('deve aumentar a escala sem alterar o valor', () => {
            const decimal = new Decimal('10.5', 4);

            expect(decimal.toString()).toBe('10.5000');
        });

        it('deve reduzir a escala usando arredondamento HALF_UP', () => {
            const decimal = new Decimal('10.555', 2);

            expect(decimal.toString()).toBe('10.56');
        });

        it('deve rejeitar escala negativa', () => {
            expect(() => new Decimal('10', -1)).toThrow();
        });
    });

    describe('soma', () => {
        it('deve somar dois valores', () => {
            const result = new Decimal('10.50')
                .add(new Decimal('2.25'));

            expect(result.toString()).toBe('12.75');
        });

        it('deve somar valores com escalas diferentes', () => {
            const result = new Decimal('10.5')
                .add(new Decimal('2.25'));

            expect(result.toString()).toBe('12.75');
        });

        it('deve evitar erro de ponto flutuante', () => {
            const result = new Decimal('0.1')
                .add(new Decimal('0.2'));

            expect(result.toString()).toBe('0.3');
        });

        it('deve aceitar número diretamente', () => {
            const result = new Decimal('10.5').add(2.5);

            expect(result.toString()).toBe('13.0');
        });

        it('deve somar valores negativos', () => {
            const result = new Decimal('-10')
                .add(new Decimal('3'));

            expect(result.toString()).toBe('-7');
        });
    });

    describe('subtração', () => {
        it('deve subtrair dois valores', () => {
            const result = new Decimal('10.50')
                .subtract(new Decimal('2.25'));

            expect(result.toString()).toBe('8.25');
        });

        it('deve permitir resultado negativo', () => {
            const result = new Decimal('2')
                .subtract(new Decimal('5'));

            expect(result.toString()).toBe('-3');
        });

        it('deve evitar erro de ponto flutuante', () => {
            const result = new Decimal('0.3')
                .subtract(new Decimal('0.2'));

            expect(result.toString()).toBe('0.1');
        });
    });

    describe('multiplicação', () => {
        it('deve multiplicar dois valores', () => {
            const result = new Decimal('10.00')
                .multiply(new Decimal('2.50'));

            expect(result.toString()).toBe('25.0000');
        });

        it('deve calcular percentual corretamente', () => {
            const result = new Decimal('1000')
                .multiply(new Decimal('0.15'));

            expect(result.toString()).toBe('150.000');
        });

        it('deve calcular valores monetários com precisão', () => {
            const result = new Decimal('125000.50')
                .multiply(new Decimal('0.15'))
                .round(2);

            expect(result.toString()).toBe('18750.08');
        });

        it('deve multiplicar por zero', () => {
            const result = new Decimal('123.45')
                .multiply(0);

            expect(result.toString()).toBe('0.00');
        });
    });

    describe('divisão', () => {
        it('deve dividir dois valores', () => {
            const result = new Decimal('10')
                .divide(new Decimal('2'));

            expect(result.toString()).toBe('5.0000000000');
        });

        it('deve permitir informar a escala do resultado', () => {
            const result = new Decimal('10')
                .divide(new Decimal('3'), 2);

            expect(result.toString()).toBe('3.33');
        });

        it('deve arredondar divisão corretamente', () => {
            const result = new Decimal('10')
                .divide(new Decimal('6'), 2);

            expect(result.toString()).toBe('1.67');
        });

        it('deve rejeitar divisão por zero', () => {
            expect(() => {
                new Decimal('10').divide(new Decimal('0'));
            }).toThrow();
        });
    });

    describe('arredondamento', () => {
        it('deve arredondar para duas casas', () => {
            expect(
                new Decimal('10.555').round(2).toString()
            ).toBe('10.56');
        });

        it('deve arredondar para baixo quando necessário', () => {
            expect(
                new Decimal('10.554').round(2).toString()
            ).toBe('10.55');
        });

        it('deve arredondar metade para cima', () => {
            expect(
                new Decimal('10.555').round(2).toString()
            ).toBe('10.56');
        });

        it('deve arredondar negativos corretamente', () => {
            expect(
                new Decimal('-10.555').round(2).toString()
            ).toBe('-10.56');
        });

        it('deve manter valor quando a escala já é menor', () => {
            const decimal = new Decimal('10.50');

            expect(decimal.round(4)).toBe(decimal);
        });

        it('deve rejeitar escala inválida', () => {
            expect(() => new Decimal('10.50').round(-1))
                .toThrow();
        });
    });

    describe('comparação', () => {
        it('deve identificar valores iguais', () => {
            expect(
                new Decimal('10.50').equals(new Decimal('10.5'))
            ).toBe(true);
        });

        it('deve identificar valor menor', () => {
            expect(
                new Decimal('10').lessThan(new Decimal('20'))
            ).toBe(true);
        });

        it('deve identificar valor maior', () => {
            expect(
                new Decimal('20').greaterThan(new Decimal('10'))
            ).toBe(true);
        });

        it('deve comparar corretamente escalas diferentes', () => {
            expect(
                new Decimal('10.50').compareTo(new Decimal('10.500'))
            ).toBe(0);
        });

        it('deve retornar -1 quando menor', () => {
            expect(
                new Decimal('9').compareTo(new Decimal('10'))
            ).toBe(-1);
        });

        it('deve retornar 1 quando maior', () => {
            expect(
                new Decimal('11').compareTo(new Decimal('10'))
            ).toBe(1);
        });
    });

    describe('sinais', () => {
        it('deve identificar zero', () => {
            const decimal = new Decimal('0');

            expect(decimal.isZero()).toBe(true);
            expect(decimal.sign()).toBe(0);
        });

        it('deve identificar valor positivo', () => {
            const decimal = new Decimal('10');

            expect(decimal.isPositive()).toBe(true);
            expect(decimal.isNegative()).toBe(false);
            expect(decimal.sign()).toBe(1);
        });

        it('deve identificar valor negativo', () => {
            const decimal = new Decimal('-10');

            expect(decimal.isNegative()).toBe(true);
            expect(decimal.isPositive()).toBe(false);
            expect(decimal.sign()).toBe(-1);
        });

        it('deve calcular valor absoluto', () => {
            expect(
                new Decimal('-123.45').abs().toString()
            ).toBe('123.45');
        });
    });

    describe('conversão', () => {
        it('deve converter para Number', () => {
            expect(
                new Decimal('123.45').toNumber()
            ).toBe(123.45);
        });

        it('deve converter para string', () => {
            expect(
                new Decimal('123.45').toString()
            ).toBe('123.45');
        });

        it('deve formatar no padrão brasileiro', () => {
            expect(
                new Decimal('1234567.89').toLocaleString()
            ).toBe('1.234.567,89');
        });

        it('deve formatar moeda com duas casas', () => {
            expect(
                new Decimal('1234.5').toLocaleString(2)
            ).toBe('1.234,50');
        });

        it('deve serializar para JSON como string decimal', () => {
            expect(
                JSON.stringify({
                    valor: new Decimal('123.45')
                })
            ).toBe('{"valor":"123.45"}');
        });
    });

    describe('imutabilidade', () => {
        it('não deve alterar o valor original ao somar', () => {
            const original = new Decimal('10.00');

            original.add(new Decimal('5.00'));

            expect(original.toString()).toBe('10.00');
        });

        it('não deve alterar o valor original ao subtrair', () => {
            const original = new Decimal('10.00');

            original.subtract(new Decimal('5.00'));

            expect(original.toString()).toBe('10.00');
        });

        it('não deve alterar o valor original ao multiplicar', () => {
            const original = new Decimal('10.00');

            original.multiply(new Decimal('5.00'));

            expect(original.toString()).toBe('10.00');
        });

        it('deve ser um objeto congelado', () => {
            const decimal = new Decimal('10.00');

            expect(Object.isFrozen(decimal)).toBe(true);
        });
    });

    describe('casos críticos do domínio tributário', () => {
        it('deve calcular 15% de uma receita sem erro binário', () => {
            const receita = new Decimal('125000.00');
            const aliquota = new Decimal('0.15');

            const imposto = receita
                .multiply(aliquota)
                .round(2);

            expect(imposto.toString()).toBe('18750.00');
        });

        it('deve calcular uma alíquota fracionária com precisão', () => {
            const receita = new Decimal('100000.00');
            const aliquota = new Decimal('0.0325');

            const imposto = receita
                .multiply(aliquota)
                .round(2);

            expect(imposto.toString()).toBe('3250.00');
        });

        it('deve preservar precisão em uma sequência de operações', () => {
            const valor = new Decimal('100.00')
                .multiply(new Decimal('0.15'))
                .add(new Decimal('10.25'))
                .subtract(new Decimal('2.75'))
                .round(2);

            expect(valor.toString()).toBe('22.50');
        });

        it('deve calcular percentual com casas decimais', () => {
            const base = new Decimal('123456.78');
            const aliquota = new Decimal('0.0325');

            const resultado = base
                .multiply(aliquota)
                .round(2);

            expect(resultado.toString()).toBe('4012.35');
        });
    });
});