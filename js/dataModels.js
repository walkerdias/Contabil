// js/dataModels.js
/**
 * ARQUIVO DE DEFINIÇÃO DE ESTRUTURAS DE DADOS
 * Não contém dados pré-cadastrados, apenas os "moldes" (schemas)
 * que os dados cadastrados pelo usuário devem seguir.
 */

const DataSchemas = {
    /**
     * 1. EMPRESA - Fluxo 2
     * Estrutura para cadastro básico da empresa
     */
    Empresa: {
        id: '', // ID único gerado automaticamente (timestamp)
        cnpj: '', // "12.345.678/0001-99" (formatado)
        razaoSocial: '',
        nomeFantasia: '',
        dataAbertura: '', // Formato ISO: "2010-05-15"
        socios: [ // Array para múltiplos sócios
            // Exemplo: { cpf: "123.456.789-00", nome: "João Silva" }
        ],
        dataCadastro: '', // Data de criação no sistema
        dataAtualizacao: '' // Data da última alteração
    },

    /**
     * 2. FAIXA SIMPLES NACIONAL - Fluxo 1
     * Para cadastro de alíquotas e repartição por faixa de faturamento
     */
    FaixaSimples: {
        id: '',
        descricao: '', // Ex: "Faixas 2024"
        vigenciaInicio: '', // "2024-01-01"
        vigenciaFim: '', // "2024-12-31" ou null para vigência atual
        faixas: [ // Array de faixas de faturamento
            {
                numeroFaixa: 1, // 1ª faixa
                limiteSuperior: 180000, // Até R$ 180.000,00
                aliquota: 0.04, // 4%
                valorDeducao: 0, // R$ 0,00
                reparticao: { // Percentuais de repartição
                    IRPJ: 0.05,      // 5%
                    CSLL: 0.035,     // 3,5%
                    COFINS: 0.128,   // 12,8%
                    PIS: 0.0278,     // 2,78%
                    CPP: 0.4192,     // 41,92%
                    ICMS: 0.335,     // 33,5%
                    ISS: 0.05        // 5%
                }
            },
            // { numeroFaixa: 2, limiteSuperior: 360000, ... }
        ],
        observacoes: ''
    },

    /**
     * 3. SITUAÇÃO TRIBUTÁRIA - Fluxo 3
     * VINCULA uma empresa a um regime tributário e seus anexos (SIMPLES)
     */
    Situacao: {
        id: '',
        empresaId: '', // ID da empresa (referência)
        empresaCnpj: '', // CNPJ para fácil consulta
        dataSituacao: '', // Data de vigência desta situação
        regime: '', // 'simples', 'presumido', 'real'
        anexos: [ // APENAS para regime 'simples' - múltiplos anexos
            {
                codigoAnexo: 'I', // I, II, III, IV, V
                atividade: '', // Descrição da atividade
                descricao: '',
                temSubstituicaoTributaria: false,
                temMonofasico: false,
                temRetencao: false // Para anexos III, IV, V
            }
        ],
        endereco: {
            logradouro: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: ''
        },
        contato: {
            telefone: '',
            email: ''
        }
    },

    /**
     * 4. FATURAMENTO - Fluxo 4
     * Registros mensais de faturamento - ESTRUTURA FLEXÍVEL
     */
    Faturamento: {
        id: '',
        empresaId: '', // Referência à empresa
        empresaCnpj: '', // Para fácil filtragem
        mes: 0, // 1 a 12
        ano: 0, // Ex: 2024
        regime: '', // Copiado da situação vigente
        
        // CAMPO DINÂMICO: estrutura varia conforme o regime
        valores: {
            // EXEMPLO 1: Para Simples Nacional - Anexo I
            // faturamentoTotal: 150000,
            // comSubstituicao: 100000,
            // semSubstituicao: 50000,
            
            // EXEMPLO 2: Para Simples Nacional - Anexo III/V (serviços)
            // faturamentoTotal: 80000,
            // comRetencao: 30000,
            // semRetencao: 50000,
            // massaSalarial: 18000, // APENAS para Anexo V
            
            // EXEMPLO 3: Para Lucro Presumido
            // faturamentoTotal: 200000,
            // faturamentoComercio: 120000,
            // faturamentoServicos: 80000,
            // impostosRetidos: { pis: 0, cofins: 0, irpj: 0, csll: 0 }
            
            // EXEMPLO 4: Para Lucro Real
            // faturamentoTotal: 300000,
            // deducoes: 50000,
            // baseCalculo: 250000
        },
        
        calculos: {
            faturamentoAcumulado12Meses: 0, // Para cálculo do Simples
            fatorR: 0, // Apenas para Anexo V
            valorImposto: 0, // Calculado na aba resumo
            reparticaoImposto: {} // Detalhamento por tributo
        },
        
        dataRegistro: '', // Data que o registro foi feito
        observacoes: ''
    }
};

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataSchemas };
}