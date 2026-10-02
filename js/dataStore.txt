// js/dataStore.js
/**
 * CAMADA DE ACESSO A DADOS - Gerencia o localStorage
 * Funções genéricas para salvar, ler, atualizar e excluir
 */
const DataStore = {
    /**
     * Gera um ID único baseado em timestamp
     */
    gerarId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Obtém todos os itens de uma chave específica
     * @param {string} chave - Nome da chave no localStorage
     * @param {*} valorPadrao - Valor retornado se a chave não existir
     * @returns {Array} Lista de itens
     */
    obterTodos(chave, valorPadrao = []) {
        try {
            const dados = localStorage.getItem(chave);
            if (!dados) return valorPadrao;
            
            const parsed = JSON.parse(dados);
            return Array.isArray(parsed) ? parsed : valorPadrao;
        } catch (erro) {
            console.error(`Erro ao ler ${chave} do localStorage:`, erro);
            return valorPadrao;
        }
    },

    /**
     * Salva um novo item na lista
     * @param {string} chave - Nome da chave no localStorage
     * @param {object} item - Item a ser salvo (será adicionado um ID)
     * @returns {object} Item salvo com ID
     */
    salvarItem(chave, item) {
        try {
            // Adiciona metadados ao item
            const itemCompleto = {
                ...item,
                id: item.id || this.gerarId(),
                dataCadastro: item.dataCadastro || new Date().toISOString(),
                dataAtualizacao: new Date().toISOString()
            };

            // Obtém lista atual e adiciona o novo item
            const listaAtual = this.obterTodos(chave, []);
            listaAtual.push(itemCompleto);
            
            // Salva de volta no localStorage
            localStorage.setItem(chave, JSON.stringify(listaAtual));
            
            return { success: true, item: itemCompleto };
        } catch (erro) {
            console.error(`Erro ao salvar item em ${chave}:`, erro);
            return { success: false, error: erro.message };
        }
    },

    /**
     * Atualiza um item existente
     * @param {string} chave - Nome da chave no localStorage
     * @param {string} id - ID do item a atualizar
     * @param {object} dadosAtualizados - Dados para atualizar
     * @returns {object} Resultado da operação
     */
    atualizarItem(chave, id, dadosAtualizados) {
        try {
            const listaAtual = this.obterTodos(chave, []);
            const indice = listaAtual.findIndex(item => item.id === id);
            
            if (indice === -1) {
                return { success: false, error: 'Item não encontrado' };
            }
            
            // Mantém dados existentes, atualiza apenas os fornecidos
            listaAtual[indice] = {
                ...listaAtual[indice],
                ...dadosAtualizados,
                dataAtualizacao: new Date().toISOString()
            };
            
            localStorage.setItem(chave, JSON.stringify(listaAtual));
            return { success: true, item: listaAtual[indice] };
        } catch (erro) {
            console.error(`Erro ao atualizar item em ${chave}:`, erro);
            return { success: false, error: erro.message };
        }
    },

    /**
     * Remove um item
     * @param {string} chave - Nome da chave no localStorage
     * @param {string} id - ID do item a remover
     * @returns {object} Resultado da operação
     */
    excluirItem(chave, id) {
        try {
            const listaAtual = this.obterTodos(chave, []);
            const novaLista = listaAtual.filter(item => item.id !== id);
            
            localStorage.setItem(chave, JSON.stringify(novaLista));
            return { 
                success: true, 
                message: 'Item excluído com sucesso',
                itensRestantes: novaLista.length
            };
        } catch (erro) {
            console.error(`Erro ao excluir item de ${chave}:`, erro);
            return { success: false, error: erro.message };
        }
    },

    /**
     * Busca um item pelo ID
     * @param {string} chave - Nome da chave no localStorage
     * @param {string} id - ID do item a buscar
     * @returns {object|null} Item encontrado ou null
     */
    obterPorId(chave, id) {
        const lista = this.obterTodos(chave, []);
        return lista.find(item => item.id === id) || null;
    },

    /**
     * Busca itens por uma propriedade específica
     * @param {string} chave - Nome da chave no localStorage
     * @param {string} propriedade - Nome da propriedade para filtrar
     * @param {*} valor - Valor a buscar
     * @returns {Array} Itens filtrados
     */
    filtrarPorPropriedade(chave, propriedade, valor) {
        const lista = this.obterTodos(chave, []);
        return lista.filter(item => item[propriedade] === valor);
    },

    /**
     * Limpa todos os dados de uma chave específica
     * @param {string} chave - Nome da chave no localStorage
     * @returns {object} Resultado da operação
     */
    limparDados(chave) {
        try {
            localStorage.removeItem(chave);
            return { success: true, message: `Dados de ${chave} removidos` };
        } catch (erro) {
            console.error(`Erro ao limpar ${chave}:`, erro);
            return { success: false, error: erro.message };
        }
    },

    /**
     * Verifica se já existe um CNPJ cadastrado
     * @param {string} cnpj - CNPJ a verificar
     * @returns {boolean} True se o CNPJ já existe
     */
    cnpjJaCadastrado(cnpj) {
        const empresas = this.obterTodos('empresas', []);
        return empresas.some(empresa => empresa.cnpj === cnpj);
    },

    /**
     * Exporta todos os dados para download
     * @returns {object} Dados completos do sistema
     */
    exportarDados() {
        // Incluir TODAS as chaves de dados do sistema
        const chaves = [
            'empresas', 
            'faixasSimples', 
            'configsPresumido', 
            'configsReal', 
            'situacoes', 
            'faturamentos'
        ];
        
        const dadosExportados = {};
        
        chaves.forEach(chave => {
            const dados = this.obterTodos(chave, []);
            // Só incluir no export se houver dados
            if (dados && dados.length > 0) {
                dadosExportados[chave] = dados;
            }
        });
        
        dadosExportados.dataExportacao = new Date().toISOString();
        dadosExportados.versaoSistema = '1.0.0';
        
        return dadosExportados;
    },

    /**
     * Importa dados de um backup
     * @param {object} dadosImportados - Dados a serem importados
     * @returns {object} Resultado da importação
     */
    importarDados(dadosImportados) {
        try {
            // Incluir TODAS as chaves válidas do sistema
            const chavesValidas = [
                'empresas', 
                'faixasSimples', 
                'configsPresumido', 
                'configsReal', 
                'situacoes', 
                'faturamentos'
            ];
            
            chavesValidas.forEach(chave => {
                if (dadosImportados[chave] && Array.isArray(dadosImportados[chave])) {
                    // Limpar dados existentes antes de importar
                    localStorage.removeItem(chave);
                    localStorage.setItem(chave, JSON.stringify(dadosImportados[chave]));
                    console.log(`✅ Dados importados para chave: ${chave} (${dadosImportados[chave].length} itens)`);
                }
            });
            
            return { 
                success: true, 
                message: 'Dados importados com sucesso',
                chavesImportadas: chavesValidas.filter(chave => dadosImportados[chave])
            };
        } catch (erro) {
            console.error('Erro ao importar dados:', erro);
            return { success: false, error: erro.message };
        }
    }
};