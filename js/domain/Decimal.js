// js/domain/Decimal.js

export class Decimal {
    /**
     * Cria um Decimal.
     *
     * O valor interno é armazenado como inteiro + escala:
     *   123,45 -> { value: 12345n, scale: 2 }
     *
     * Isso evita problemas de precisão do Number:
     *   0.1 + 0.2 !== 0.3
     *
     * @param {Decimal|bigint|number|string} value
     * @param {number} [scale=0]
     */
    constructor(value = 0, scale = 0) {
        if (value instanceof Decimal) {
            this._value = value._value;
            this._scale = value._scale;
            return;
        }

        if (!Number.isInteger(scale) || scale < 0) {
            throw new TypeError('A escala deve ser um inteiro maior ou igual a zero.');
        }

        const parsed = Decimal._parse(value, scale);

        this._value = parsed.value;
        this._scale = parsed.scale;

        Object.freeze(this);
    }

    /**
     * Cria um Decimal a partir de um valor.
     *
     * @param {*} value
     * @returns {Decimal}
     */
    static from(value) {
        return value instanceof Decimal ? value : new Decimal(value);
    }

    /**
     * Cria um Decimal a partir de string.
     *
     * Exemplos:
     *   Decimal.fromString('123,45')
     *   Decimal.fromString('123.45')
     *
     * @param {string} value
     * @returns {Decimal}
     */
    static fromString(value) {
        if (typeof value !== 'string') {
            throw new TypeError('O valor deve ser uma string.');
        }

        return new Decimal(value);
    }

    /**
     * Zero.
     *
     * @returns {Decimal}
     */
    static zero() {
        return new Decimal(0);
    }

    /**
     * Um.
     *
     * @returns {Decimal}
     */
    static one() {
        return new Decimal(1);
    }

    /**
     * Soma.
     *
     * @param {*} other
     * @returns {Decimal}
     */
    add(other) {
        const decimal = Decimal.from(other);
        const scale = Math.max(this._scale, decimal._scale);

        const left = Decimal._rescale(this._value, this._scale, scale);
        const right = Decimal._rescale(decimal._value, decimal._scale, scale);

        return Decimal._fromParts(left + right, scale);
    }

    /**
     * Subtração.
     *
     * @param {*} other
     * @returns {Decimal}
     */
    subtract(other) {
        const decimal = Decimal.from(other);
        const scale = Math.max(this._scale, decimal._scale);

        const left = Decimal._rescale(this._value, this._scale, scale);
        const right = Decimal._rescale(decimal._value, decimal._scale, scale);

        return Decimal._fromParts(left - right, scale);
    }

    /**
     * Multiplicação.
     *
     * @param {*} other
     * @returns {Decimal}
     */
    multiply(other) {
        const decimal = Decimal.from(other);

        return Decimal._fromParts(
            this._value * decimal._value,
            this._scale + decimal._scale
        );
    }

    /**
     * Divisão.
     *
     * @param {*} other
     * @param {number} [scale=10]
     * @returns {Decimal}
     */
    divide(other, scale = 10) {
        const decimal = Decimal.from(other);

        if (decimal.isZero()) {
            throw new RangeError('Não é possível dividir por zero.');
        }

        if (!Number.isInteger(scale) || scale < 0) {
            throw new TypeError('A escala deve ser um inteiro maior ou igual a zero.');
        }

        /*
         * Queremos:
         *
         *   (a / 10^sa) / (b / 10^sb)
         *
         * com `scale` casas decimais.
         */
        const factor = 10n ** BigInt(
            scale + decimal._scale - this._scale
        );

        let numerator;
        let denominator;

        if (scale + decimal._scale >= this._scale) {
            numerator = this._value * factor;
            denominator = decimal._value;
        } else {
            numerator = this._value;
            denominator =
                decimal._value *
                (10n ** BigInt(this._scale - scale - decimal._scale));
        }

        const quotient = Decimal._roundDivision(
            numerator,
            denominator
        );

        return Decimal._fromParts(quotient, scale);
    }

    /**
     * Arredonda para determinada quantidade de casas decimais.
     *
     * @param {number} scale
     * @returns {Decimal}
     */
    round(scale = 0) {
        if (!Number.isInteger(scale) || scale < 0) {
            throw new TypeError('A escala deve ser um inteiro maior ou igual a zero.');
        }

        if (scale >= this._scale) {
            return this;
        }

        const divisor = 10n ** BigInt(this._scale - scale);

        const quotient = Decimal._roundDivision(
            this._value,
            divisor
        );

        return Decimal._fromParts(quotient, scale);
    }

    /**
     * Retorna o valor absoluto.
     *
     * @returns {Decimal}
     */
    abs() {
        return Decimal._fromParts(
            this._value < 0n ? -this._value : this._value,
            this._scale
        );
    }

    /**
     * Retorna o sinal.
     *
     * @returns {-1|0|1}
     */
    sign() {
        if (this._value < 0n) return -1;
        if (this._value > 0n) return 1;
        return 0;
    }

    /**
     * Verifica se é zero.
     *
     * @returns {boolean}
     */
    isZero() {
        return this._value === 0n;
    }

    /**
     * Verifica se é negativo.
     *
     * @returns {boolean}
     */
    isNegative() {
        return this._value < 0n;
    }

    /**
     * Verifica se é positivo.
     *
     * @returns {boolean}
     */
    isPositive() {
        return this._value > 0n;
    }

    /**
     * Compara dois Decimals.
     *
     * @param {*} other
     * @returns {-1|0|1}
     */
    compareTo(other) {
        const decimal = Decimal.from(other);
        const scale = Math.max(this._scale, decimal._scale);

        const left = Decimal._rescale(this._value, this._scale, scale);
        const right = Decimal._rescale(decimal._value, decimal._scale, scale);

        if (left < right) return -1;
        if (left > right) return 1;

        return 0;
    }

    /**
     * Igualdade.
     *
     * @param {*} other
     * @returns {boolean}
     */
    equals(other) {
        return this.compareTo(other) === 0;
    }

    /**
     * Menor que.
     *
     * @param {*} other
     * @returns {boolean}
     */
    lessThan(other) {
        return this.compareTo(other) < 0;
    }

    /**
     * Menor ou igual.
     *
     * @param {*} other
     * @returns {boolean}
     */
    lessThanOrEqual(other) {
        return this.compareTo(other) <= 0;
    }

    /**
     * Maior que.
     *
     * @param {*} other
     * @returns {boolean}
     */
    greaterThan(other) {
        return this.compareTo(other) > 0;
    }

    /**
     * Maior ou igual.
     *
     * @param {*} other
     * @returns {boolean}
     */
    greaterThanOrEqual(other) {
        return this.compareTo(other) >= 0;
    }

    /**
     * Converte para Number.
     *
     * Atenção: pode perder precisão para valores muito grandes.
     *
     * @returns {number}
     */
    toNumber() {
        return Number(this._value) / 10 ** this._scale;
    }

    /**
     * Retorna a representação decimal sem formatação.
     *
     * @returns {string}
     */
    toString() {
        if (this._value === 0n) {
            return '0';
        }

        const negative = this._value < 0n;
        const absolute = negative ? -this._value : this._value;

        let digits = absolute.toString();

        if (this._scale === 0) {
            return negative ? `-${digits}` : digits;
        }

        while (digits.length <= this._scale) {
            digits = `0${digits}`;
        }

        const position = digits.length - this._scale;

        const result =
            `${digits.slice(0, position)}.${digits.slice(position)}`;

        return negative ? `-${result}` : result;
    }

    /**
     * Retorna representação formatada em padrão brasileiro.
     *
     * Exemplo:
     *   1234.56 -> "1.234,56"
     *
     * @param {number} [scale=this._scale]
     * @returns {string}
     */
    toLocaleString(scale = this._scale) {
        return this.round(scale)
            .toString()
            .replace('.', ',')
            .replace(
                /^(-?\d+)(,\d+)?$/,
                (_, integer, fraction = '') => {
                    const formatted = integer.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        '.'
                    );

                    return formatted + fraction;
                }
            );
    }

    /**
     * Retorna o valor interno inteiro.
     *
     * @returns {bigint}
     */
    toBigInt() {
        return this._value;
    }

    /**
     * Retorna a escala.
     *
     * @returns {number}
     */
    scale() {
        return this._scale;
    }

    /**
     * Serialização JSON.
     *
     * @returns {string}
     */
    toJSON() {
        return this.toString();
    }

    /**
     * Cria Decimal diretamente a partir de partes internas.
     *
     * @private
     */
    static _fromParts(value, scale) {
        const decimal = Object.create(Decimal.prototype);

        decimal._value = value;
        decimal._scale = scale;

        Object.freeze(decimal);

        return decimal;
    }

    /**
     * Faz parsing do valor.
     *
     * @private
     */
    static _parse(value, scale) {
        if (typeof value === 'bigint') {
            return {
                value: value * 10n ** BigInt(scale),
                scale
            };
        }

        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                throw new TypeError('O valor deve ser um número finito.');
            }

            /*
             * Nunca usamos diretamente o binário do Number.
             * String(value) preserva a representação decimal pretendida.
             */
            value = String(value);
        }

        if (typeof value !== 'string') {
            throw new TypeError(
                'Decimal aceita apenas Decimal, bigint, number ou string.'
            );
        }

        let normalized = value.trim();

        if (normalized === '') {
            throw new TypeError('O valor decimal não pode ser vazio.');
        }

        /*
         * Aceita:
         *   123
         *   123.45
         *   123,45
         *   -123.45
         *   +123.45
         */
        normalized = normalized.replace(',', '.');

        if (!/^[+-]?\d+(\.\d+)?$/.test(normalized)) {
            throw new TypeError(`Valor decimal inválido: ${value}`);
        }

        const negative = normalized.startsWith('-');
        const unsigned = normalized.replace(/^[+-]/, '');

        const [integerPart, fractionPart = ''] = unsigned.split('.');

        const inputScale = fractionPart.length;

        let digits = integerPart + fractionPart;

        digits = digits.replace(/^0+(?=\d)/, '');

        let integerValue = BigInt(digits || '0');

        if (negative && integerValue !== 0n) {
            integerValue = -integerValue;
        }

        /*
         * Ajusta a escala solicitada.
         */
        if (scale > inputScale) {
            integerValue *= 10n ** BigInt(scale - inputScale);
        } else if (scale < inputScale) {
            const divisor = 10n ** BigInt(inputScale - scale);

            integerValue = Decimal._roundDivision(
                integerValue,
                divisor
            );
        }

        return {
            value: integerValue,
            scale
        };
    }

    /**
     * Reescala um inteiro decimal.
     *
     * @private
     */
    static _rescale(value, fromScale, toScale) {
        if (fromScale === toScale) {
            return value;
        }

        if (fromScale < toScale) {
            return value * 10n ** BigInt(toScale - fromScale);
        }

        return Decimal._roundDivision(
            value,
            10n ** BigInt(fromScale - toScale)
        );
    }

    /**
     * Divisão inteira com arredondamento HALF_UP.
     *
     * Exemplo:
     *   105 / 10 -> 11
     *   104 / 10 -> 10
     *   -105 / 10 -> -11
     *
     * @private
     */
    static _roundDivision(numerator, denominator) {
        if (denominator === 0n) {
            throw new RangeError('Divisão por zero.');
        }

        const negative =
            (numerator < 0n) !== (denominator < 0n);

        const absoluteNumerator =
            numerator < 0n ? -numerator : numerator;

        const absoluteDenominator =
            denominator < 0n ? -denominator : denominator;

        let quotient =
            absoluteNumerator / absoluteDenominator;

        const remainder =
            absoluteNumerator % absoluteDenominator;

        /*
         * HALF_UP:
         * arredonda quando a parte descartada >= 0,5.
         */
        if (remainder * 2n >= absoluteDenominator) {
            quotient += 1n;
        }

        return negative ? -quotient : quotient;
    }
}

export default Decimal;