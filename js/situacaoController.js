// js/situacaoController.js - CONTROLLER DE SITUAÇÃO TRIBUTÁRIA (VERSÃO CORRIGIDA)

"use strict";

/**
 * CONTROLLER DE SITUAÇÃO TRIBUTÁRIA
 * Gerencia o cadastro de situações tributárias das empresas
 * Fluxo 3 do sistema: Cadastro de Situação
 */
class SituacaoController {
    constructor() {
        this.formulario = null;
        this.selectEmpresa = null;
        this.selectTributacao = null;
        this.blocoSimples = null;
        this.listaAnexos = null;
        this.modoEdicao = false;
        this.situacaoEditandoId = null;
        this.inicializado = false;
        this.blocoPresumido = null; 
        this.gruposPresumido = null; 
        
        console.log('SituacaoController instanciado. Aguardando inicialização...');
        
        // Inicializar quando DataStore estiver disponível
        this.aguardarDataStore();
    }

    /**
     * Aguarda o DataStore ficar disponível antes de inicializar
     */
    aguardarDataStore() {
        const verificarDataStore = (tentativa = 0, maxTentativas = 10) => {
            if (tentativa >= maxTentativas) {
                console.error('❌ Timeout: DataStore não carregou após', maxTentativas, 'tentativas');
                return;
            }
            
            if (typeof DataStore !== 'undefined' && DataStore) {
                console.log('✅ DataStore disponível na tentativa', tentativa + 1);
                this.inicializar();
            } else {
                console.log('⏳ Aguardando DataStore... tentativa', tentativa + 1);
                setTimeout(() => verificarDataStore(tentativa + 1, maxTentativas), 300);
            }
        };
        
        verificarDataStore();
    }

    /**
     * Inicializa o controller
     */
    inicializar() {
        console.log('✅ Inicializando SituacaoController...');
        
        // Elementos principais
        this.formulario = document.getElementById('situacaoForm');
        this.selectEmpresa = document.getElementById('cnpjEmpresa');
        this.selectTributacao = document.getElementById('tributacao');
        this.blocoSimples = document.getElementById('blocoRegrasSimples');
        this.blocoPresumido = document.getElementById('blocoRegrasPresumido');
        this.listaAnexos = document.getElementById('listaAnexos');
        this.gruposPresumido = document.getElementById('gruposPresumido');
        
        if (!this.formulario) {
            console.error('❌ Formulário de situação não encontrado');
            return;
        }
        
        // Verificar se todos os elementos existem
        const elementos = {
            formulario: this.formulario,
            selectEmpresa: this.selectEmpresa,
            selectTributacao: this.selectTributacao,
            blocoSimples: this.blocoSimples,
            blocoPresumido: this.blocoPresumido,
            gruposPresumido: this.gruposPresumido,
            listaAnexos: this.listaAnexos
        };
        
        console.log('Elementos encontrados:', elementos);
        
        this.configurarEventos();
        
        // Usar UIUtils.atualizarSelects
        if (window.UIUtils && typeof window.UIUtils.atualizarSelects === 'function') {
            window.UIUtils.atualizarSelects();
        } else {
            console.warn('UIUtils.atualizarSelects não disponível');
        }
        
        this.carregarListaSituacoes();
        
        this.inicializado = true;
        console.log('✅ SituacaoController inicializado com sucesso');
    }

    /**
     * Configura os eventos do formulário e elementos
     */
    configurarEventos() {
        console.log('⚙️ Configurando eventos do SituacaoController...');
        
        // Evento de submit do formulário
        if (this.formulario) {
            this.formulario.addEventListener('submit', (e) => this.salvarSituacao(e));
            console.log('✅ Evento submit configurado');
        }
        
        // Evento do select de tributação
        if (this.selectTributacao) {
            this.selectTributacao.addEventListener('change', () => this.handleTributacaoChange());
            console.log('✅ Evento change do select tributação configurado');
            
            // Executar uma vez para configurar estado inicial
            setTimeout(() => this.handleTributacaoChange(), 100);
        }
        
        // Evento de blur na data da situação (validação em tempo real)
        const inputDataSituacao = document.getElementById('dataSituacao');
        if (inputDataSituacao) {
            inputDataSituacao.addEventListener('blur', () => {
                this.validarDataSituacaoEmTempoReal();
            });
            console.log('✅ Evento de validação de data configurado');
        }
        
        // Botão limpar situação
        const btnLimpar = document.getElementById('limparSituacao');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.limparFormulario());
            console.log('✅ Botão limpar configurado');
        }
        
        // Botão adicionar anexo
        const configurarBotaoAnexo = () => {
            // Tentar por ID primeiro
            let btnAdicionarAnexo = document.getElementById('btnAdicionarAnexo');
            
            // Se não encontrar por ID, tentar por seletor
            if (!btnAdicionarAnexo) {
                btnAdicionarAnexo = document.querySelector('button[onclick*="adicionarAnexo"]');
            }
            
            // Se ainda não encontrar, tentar por texto
            if (!btnAdicionarAnexo) {
                const botoes = document.querySelectorAll('button');
                btnAdicionarAnexo = Array.from(botoes).find(btn => 
                    btn.textContent.includes('Adicionar') || 
                    btn.textContent.includes('Anexo')
                );
            }
            
            if (btnAdicionarAnexo) {
                // Remover onclick se existir
                btnAdicionarAnexo.removeAttribute('onclick');
                
                // Remover listeners antigos
                const novoBotao = btnAdicionarAnexo.cloneNode(true);
                btnAdicionarAnexo.parentNode.replaceChild(novoBotao, btnAdicionarAnexo);
                
                // Adicionar novo listener
                novoBotao.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.adicionarAnexo();
                });
                
                console.log('✅ Botão adicionar anexo configurado');
            } else {
                console.warn('⚠️ Botão adicionar anexo não encontrado');
            }
        };
        
        // Configurar botão após um pequeno delay
        setTimeout(configurarBotaoAnexo, 200);
        
        console.log('✅ Todos os eventos configurados');
    }
    
    /**
     * Manipula mudança no regime tributário
     */
    handleTributacaoChange() {
        if (!this.selectTributacao) return;
        
        const regime = this.selectTributacao.value;
        console.log(`🎯 Regime tributário selecionado: ${regime}`);
        
        if (this.blocoSimples) {
            if (regime === 'simples') {
                // Mostrar bloco do Simples Nacional
                this.blocoSimples.classList.remove('hidden');
                
                // Garantir que o container de regras está visível
                const containerRegras = document.getElementById('containerRegrasSimples');
                if (containerRegras) {
                    containerRegras.classList.remove('hidden');
                }
                
                // Adicionar primeiro anexo automaticamente se não existir
                setTimeout(() => {
                    if (this.listaAnexos && !this.listaAnexos.querySelector('.anexo-item')) {
                        this.adicionarAnexo();
                    }
                }, 150);
                
                console.log('✅ Bloco Simples Nacional exibido');
            } else {
                // Ocultar bloco do Simples Nacional
                this.blocoSimples.classList.add('hidden');
                console.log('✅ Bloco Simples Nacional ocultado');
            }
        } else {
            console.warn('⚠️ Bloco Simples não encontrado no DOM');
        }
        
        // Controlar visibilidade do bloco do Lucro Presumido
        if (this.blocoPresumido) {
            if (regime === 'presumido') {
                this.blocoPresumido.classList.remove('hidden');
                
                // Criar checkboxes de grupos se não existirem
                setTimeout(() => {
                    this.criarCheckboxesGruposPresumido();
                }, 150);
                
                console.log('✅ Bloco Lucro Presumido exibido');
            } else {
                this.blocoPresumido.classList.add('hidden');
                console.log('✅ Bloco Lucro Presumido ocultado');
            }
        }
    }

    // Criar checkboxes dos grupos de presunção:
    criarCheckboxesGruposPresumido() {
        if (!this.gruposPresumido) {
            console.warn('⚠️ Container de grupos presumido não encontrado');
            return;
        }
        
        // Limpar conteúdo existente
        this.gruposPresumido.innerHTML = '';
        
        // Definir os grupos disponíveis
        const grupos = [
            {
                id: 'grupo1',
                nome: 'Grupo 1',
                descricao: 'Comércio, Indústria, Transporte de Carga, Serviços Hospitalares - IRPJ 8% / CSLL 12%'
            },
            {
                id: 'grupo2',
                nome: 'Grupo 2',
                descricao: 'Transporte (exceto carga), Serviços em Geral com faturamento ≤ R$ 120.000 - IRPJ 16% / CSLL 12%'
            },
            {
                id: 'grupo3',
                nome: 'Grupo 3',
                descricao: 'Serviços em Geral com faturamento > R$ 120.000 - IRPJ 32% / CSLL 32%'
            }
        ];
        
        // Criar checkboxes para cada grupo
        grupos.forEach(grupo => {
            const checkboxHTML = `
                <div class="flex items-start mb-3">
                    <div class="flex items-center h-5">
                        <input type="checkbox" 
                               id="grupo_${grupo.id}" 
                               name="gruposPresumido[]" 
                               value="${grupo.id}"
                               class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2">
                    </div>
                    <div class="ml-3 text-sm">
                        <label for="grupo_${grupo.id}" class="font-medium text-gray-700">${grupo.nome}</label>
                        <p class="text-xs text-gray-500 mt-1">${grupo.descricao}</p>
                    </div>
                </div>
            `;
            
            this.gruposPresumido.insertAdjacentHTML('beforeend', checkboxHTML);
        });
        
        console.log('✅ Checkboxes de grupos de presunção criados');
    }    
    
    /**
     * Valida a data da situação em relação à data de abertura da empresa
     */
    validarDataSituacao(dataSituacao, empresaCnpj) {
        console.log(`📅 Validando data da situação: ${dataSituacao} para empresa: ${empresaCnpj}`);
        
        // Verificar se DataStore está disponível
        if (typeof DataStore === 'undefined' || !DataStore) {
            console.warn('⚠️ DataStore não disponível para validação de data');
            return { valido: false, mensagem: 'Sistema de dados não disponível' };
        }
        
        // Buscar empresa
        const empresas = DataStore.obterTodos('empresas', []);
        const empresa = empresas.find(e => e.cnpj === empresaCnpj || e.id === empresaCnpj);
        
        if (!empresa) {
            console.error(`❌ Empresa não encontrada: ${empresaCnpj}`);
            return { valido: false, mensagem: 'Empresa não encontrada' };
        }
        
        // Verificar se empresa tem data de abertura
        if (!empresa.dataAbertura) {
            console.warn(`⚠️ Empresa ${empresa.razaoSocial} não tem data de abertura cadastrada`);
            return { 
                valido: true, 
                mensagem: 'Atenção: Empresa sem data de abertura cadastrada',
                tipo: 'warning' 
            };
        }
        
        // Usar UIUtils para corrigir fuso horário
        const dataAbertura = UIUtils.corrigirFusoHorarioData(empresa.dataAbertura);
        const dataSituacaoObj = UIUtils.corrigirFusoHorarioData(dataSituacao);
        
        console.log(`📊 Comparando datas:
        - Abertura: ${dataAbertura.toLocaleDateString('pt-BR')} (${empresa.dataAbertura})
        - Situação: ${dataSituacaoObj.toLocaleDateString('pt-BR')} (${dataSituacao})`);
        
        // Validação principal: data da situação não pode ser anterior à abertura
        if (dataSituacaoObj < dataAbertura) {
            const diffDias = Math.ceil((dataAbertura - dataSituacaoObj) / (1000 * 60 * 60 * 24));
            
            return {
                valido: false,
                mensagem: `Data da situação (${dataSituacaoObj.toLocaleDateString('pt-BR')}) é ${diffDias} dia(s) anterior à data de abertura da empresa (${dataAbertura.toLocaleDateString('pt-BR')})`,
                tipo: 'error',
                detalhes: {
                    dataAbertura: empresa.dataAbertura,
                    dataAberturaFormatada: dataAbertura.toLocaleDateString('pt-BR'),
                    dataSituacao: dataSituacao,
                    dataSituacaoFormatada: dataSituacaoObj.toLocaleDateString('pt-BR'),
                    diferencaDias: diffDias
                }
            };
        }
        
        // Validação adicional: data não pode ser no futuro
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        if (dataSituacaoObj > hoje) {
            const diffDias = Math.ceil((dataSituacaoObj - hoje) / (1000 * 60 * 60 * 24));
            
            return {
                valido: false,
                mensagem: `Data da situação (${dataSituacaoObj.toLocaleDateString('pt-BR')}) é ${diffDias} dia(s) no futuro`,
                tipo: 'error',
                detalhes: {
                    dataHoje: hoje.toLocaleDateString('pt-BR'),
                    dataSituacao: dataSituacao,
                    diferencaDias: diffDias
                }
            };
        }
        
        // Data válida
        return {
            valido: true,
            mensagem: `Data válida: ${dataSituacaoObj.toLocaleDateString('pt-BR')}`,
            tipo: 'success',
            detalhes: {
                dataAbertura: empresa.dataAbertura,
                dataAberturaFormatada: dataAbertura.toLocaleDateString('pt-BR'),
                dataSituacao: dataSituacao,
                dataSituacaoFormatada: dataSituacaoObj.toLocaleDateString('pt-BR')
            }
        };
    }
    
    /**
     * Valida a data da situação em tempo real
     */
    validarDataSituacaoEmTempoReal() {
        const empresaSelect = document.getElementById('cnpjEmpresa');
        const dataInput = document.getElementById('dataSituacao');
        const feedbackElement = document.getElementById('dataSituacaoFeedback');
        
        if (!empresaSelect || !dataInput || !feedbackElement) return;
        
        const empresaCnpj = empresaSelect.value;
        const dataSituacao = dataInput.value;
        
        // Limpar feedback anterior
        feedbackElement.innerHTML = '';
        feedbackElement.className = 'text-xs mt-1';
        
        // Só validar se ambos os campos estiverem preenchidos
        if (!empresaCnpj || !dataSituacao) return;
        
        const validacao = this.validarDataSituacao(dataSituacao, empresaCnpj);
        
        // Aplicar estilos baseados no resultado
        if (validacao.tipo === 'error') {
            feedbackElement.innerHTML = `<span class="text-red-600"><i class="fas fa-times-circle mr-1"></i> ${validacao.mensagem}</span>`;
            feedbackElement.classList.add('text-red-600');
            dataInput.classList.add('border-red-500');
            dataInput.classList.remove('border-green-500', 'border-yellow-500');
        } else if (validacao.tipo === 'warning') {
            feedbackElement.innerHTML = `<span class="text-yellow-600"><i class="fas fa-exclamation-triangle mr-1"></i> ${validacao.mensagem}</span>`;
            feedbackElement.classList.add('text-yellow-600');
            dataInput.classList.add('border-yellow-500');
            dataInput.classList.remove('border-red-500', 'border-green-500');
        } else if (validacao.tipo === 'success') {
            feedbackElement.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i> ${validacao.mensagem}</span>`;
            feedbackElement.classList.add('text-green-600');
            dataInput.classList.add('border-green-500');
            dataInput.classList.remove('border-red-500', 'border-yellow-500');
        }
        
        console.log('Validação em tempo real:', validacao);
    }

    /**
     * Adiciona um novo anexo à lista
     */
    adicionarAnexo() {
        console.log('➕ Adicionando anexo...');
        
        if (!this.listaAnexos) {
            console.error('❌ Lista de anexos não encontrada');
            return;
        }
        
        // Contar anexos existentes
        const anexosExistentes = this.listaAnexos.querySelectorAll('.anexo-item').length;
        const novoIndice = anexosExistentes + 1;
        
        console.log(`📝 Criando anexo ${novoIndice}`);
        
        // Criar HTML do novo anexo
        const anexoHTML = `
            <div class="anexo-item border border-gray-300 rounded-lg p-4 bg-white mb-3">
                <div class="flex justify-between items-center mb-4">
                    <h5 class="font-medium text-gray-700">Anexo ${novoIndice}</h5>
                    <button type="button" class="remover-anexo text-red-500 hover:text-red-700 text-sm flex items-center gap-1" 
                            title="Remover anexo">
                        <i class="fas fa-times"></i> Remover
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Código do Anexo -->
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Código do Anexo *</label>
                        <select name="anexos[${novoIndice - 1}][codigoAnexo]" 
                                class="codigo-anexo w-full border border-gray-300 rounded-lg p-2.5 text-sm" required>
                            <option value="">Selecione...</option>
                            <option value="I">Anexo I - Comércio</option>
                            <option value="II">Anexo II - Indústria</option>
                            <option value="III">Anexo III - Serviços</option>
                            <option value="IV">Anexo IV - Serviços (+)</option>
                            <option value="V">Anexo V - Serviços (++)</option>
                        </select>
                    </div>
                    
                    <!-- Atividade -->
                    <div>
                        <label class="block text-xs font-medium text-gray-700 mb-1">Atividade *</label>
                        <input type="text" name="anexos[${novoIndice - 1}][atividade]" 
                               class="atividade-anexo w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                               placeholder="Ex: Comércio de roupas" required>
                    </div>
                    
                    <!-- Descrição -->
                    <div class="md:col-span-2">
                        <label class="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea name="anexos[${novoIndice - 1}][descricao]" 
                                  class="descricao-anexo w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                                  rows="2" placeholder="Descrição detalhada da atividade"></textarea>
                    </div>
                    
                    <!-- Opções específicas por anexo -->
                    <div class="opcoes-anexo grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                        <!-- Para Anexos I e II -->
                        <div class="opcao-substituicao hidden">
                            <label class="flex items-center">
                                <input type="checkbox" name="anexos[${novoIndice - 1}][temSubstituicaoTributaria]" 
                                       class="substituicao-tributaria mr-2">
                                <span class="text-xs text-gray-700">Com Subst. Tributária</span>
                            </label>
                        </div>
                        
                        <div class="opcao-monofasico hidden">
                            <label class="flex items-center">
                                <input type="checkbox" name="anexos[${novoIndice - 1}][temMonofasico]" 
                                       class="monofasico mr-2">
                                <span class="text-xs text-gray-700">Monofásico</span>
                            </label>
                        </div>
                        
                        <!-- Para Anexos III, IV, V -->
                        <div class="opcao-retencao hidden">
                            <label class="flex items-center">
                                <input type="checkbox" name="anexos[${novoIndice - 1}][temRetencao]" 
                                       class="retencao mr-2">
                                <span class="text-xs text-gray-700">Com Retenção</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar à lista
        this.listaAnexos.insertAdjacentHTML('beforeend', anexoHTML);
        
        // Configurar eventos do novo anexo
        const novoAnexo = this.listaAnexos.lastElementChild;
        this.configurarEventosAnexo(novoAnexo);
        
        // Atualizar opções baseado no código selecionado
        const selectCodigo = novoAnexo.querySelector('.codigo-anexo');
        if (selectCodigo) {
            selectCodigo.addEventListener('change', (e) => this.atualizarOpcoesAnexo(e.target));
            // Atualizar opções com valor vazio inicialmente
            this.atualizarOpcoesAnexo(selectCodigo);
        }
        
        console.log(`✅ Anexo ${novoIndice} adicionado com sucesso`);
    }

    /**
     * Configura eventos de um elemento anexo
     */
    configurarEventosAnexo(anexoElement) {
        if (!anexoElement) return;
        
        // Botão remover
        const btnRemover = anexoElement.querySelector('.remover-anexo');
        if (btnRemover) {
            btnRemover.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja remover este anexo?')) {
                    anexoElement.remove();
                    console.log('🗑️ Anexo removido');
                    this.reordenarAnexos();
                }
            });
        }
    }

    /**
     * Atualiza opções do anexo baseado no código selecionado
     */
    atualizarOpcoesAnexo(selectElement) {
        if (!selectElement) return;
        
        const codigo = selectElement.value;
        const anexoItem = selectElement.closest('.anexo-item');
        
        if (!anexoItem) return;
        
        console.log(`⚙️ Atualizando opções do anexo para código: ${codigo || 'não selecionado'}`);
        
        // Esconder todas as opções primeiro
        const opcoes = anexoItem.querySelectorAll('.opcao-substituicao, .opcao-monofasico, .opcao-retencao, .opcao-massa-salarial');
        opcoes.forEach(opcao => {
            opcao.classList.add('hidden');
        });
        
        // Mostrar opções baseadas no código
        if (codigo) {
            switch(codigo) {
                case 'I':
                case 'II':
                    anexoItem.querySelector('.opcao-substituicao')?.classList.remove('hidden');
                    anexoItem.querySelector('.opcao-monofasico')?.classList.remove('hidden');
                    break;
                    
                case 'III':
                case 'IV':
                case 'V':
                    anexoItem.querySelector('.opcao-retencao')?.classList.remove('hidden');                    
                    break;
            }
        }
    }

    /**
     * Reordena os anexos após remoção
     */
    reordenarAnexos() {
        if (!this.listaAnexos) return;
        
        const anexos = this.listaAnexos.querySelectorAll('.anexo-item');
        console.log(`🔄 Reordenando ${anexos.length} anexos...`);
        
        anexos.forEach((anexo, index) => {
            // Atualizar título
            const titulo = anexo.querySelector('h5');
            if (titulo) {
                titulo.textContent = `Anexo ${index + 1}`;
            }
            
            // Atualizar names dos inputs
            const inputs = anexo.querySelectorAll('[name]');
            inputs.forEach(input => {
                const name = input.getAttribute('name');
                if (name && name.includes('anexos[')) {
                    const newName = name.replace(/anexos\[\d+\]/, `anexos[${index}]`);
                    input.setAttribute('name', newName);
                }
            });
        });
        
        console.log(`✅ Anexos reordenados: ${anexos.length} anexos`);
    }

    /**
     * Toggle das regras simples (expandir/recolher)
     */
    toggleRegrasSimples() {
        const container = document.getElementById('containerRegrasSimples');
        const icon = document.getElementById('iconRegrasSimples');
        
        if (container && icon) {
            const estaVisivel = !container.classList.contains('hidden');
            
            if (estaVisivel) {
                container.classList.add('hidden');
                icon.classList.remove('fa-chevron-up');
                icon.classList.add('fa-chevron-down');
                console.log('📥 Regras Simples recolhidas');
            } else {
                container.classList.remove('hidden');
                icon.classList.remove('fa-chevron-down');
                icon.classList.add('fa-chevron-up');
                console.log('📤 Regras Simples expandidas');
            }
        } else {
            console.warn('⚠️ Elementos de toggle não encontrados');
        }
    }

    /**
     * Salva ou atualiza uma situação
     */
    salvarSituacao(event) {
        if (event) event.preventDefault();
        
        console.log('💾 Salvando situação...');        
              
        // Verificar se DataStore está disponível
        if (typeof DataStore === 'undefined' || !DataStore) {
            UIUtils.mostrarToast('Erro: Sistema de dados não disponível', 'error');
            console.error('❌ DataStore não disponível para salvar situação');
            return;
        }
        
        // Coletar dados básicos do formulário
        const formData = new FormData(this.formulario);
        const dados = Object.fromEntries(formData.entries());
        
        console.log('📋 Dados coletados do formulário:', dados);
        
        // Formatar a data corretamente antes de validar
        if (dados.dataSituacao) {
            // Garantir que a data está no formato correto (YYYY-MM-DD)
            const dataObj = UIUtils.corrigirFusoHorarioData(dados.dataSituacao);
            // Salvar a data no formato ISO sem o componente de tempo
            dados.dataSituacao = dataObj.toISOString().split('T')[0];
            console.log('📅 Data formatada para salvamento:', dados.dataSituacao);
        }
        
        // VALIDAÇÕES BÁSICAS
        if (!dados.cnpjEmpresa || !dados.dataSituacao || !dados.tributacao) {
            const camposFaltando = [];
            if (!dados.cnpjEmpresa) camposFaltando.push('Empresa');
            if (!dados.dataSituacao) camposFaltando.push('Data da Situação');
            if (!dados.tributacao) camposFaltando.push('Regime Tributário');
            
            UIUtils.mostrarToast(`Campos obrigatórios: ${camposFaltando.join(', ')}`, 'error');
            console.warn(`⚠️ Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
            return;
        }
        
        // VALIDAÇÃO DA DATA DA SITUAÇÃO
        const validacaoData = this.validarDataSituacao(dados.dataSituacao, dados.cnpjEmpresa);
        
        if (!validacaoData.valido) {
            UIUtils.mostrarToast(validacaoData.mensagem, validacaoData.tipo);
            console.warn('❌ Validação de data falhou:', validacaoData);
            return;
        }
        
        if (validacaoData.tipo === 'warning') {
            // Se for apenas warning, perguntar ao usuário se quer continuar
            if (!confirm(`${validacaoData.mensagem}\n\nDeseja continuar mesmo assim?`)) {
                console.log('❌ Usuário cancelou devido ao warning de data');
                return;
            }
        }
        
        // VALIDAÇÃO DE EMAIL (centralizada usando UIUtils)
        if (dados.email && dados.email.trim() !== '') {
            if (!UIUtils.validarEmail(dados.email)) {
                UIUtils.mostrarToast('Email inválido', 'error');
                console.warn('❌ Validação de email falhou:', dados.email);
                return;
            }
        }
        
        // Buscar empresa pelo CNPJ
        const empresas = DataStore.obterTodos('empresas', []);
        const empresa = empresas.find(e => e.cnpj === dados.cnpjEmpresa || e.id === dados.cnpjEmpresa);
        
        if (!empresa) {
            UIUtils.mostrarToast('Empresa não encontrada no sistema', 'error');
            console.error(`❌ Empresa não encontrada: ${dados.cnpjEmpresa}`);
            return;
        }
        
        console.log(`✅ Empresa encontrada: ${empresa.razaoSocial}`);
        
        // Formatar telefone usando UIUtils.formatarTelefone
		let telefoneFormatado = dados.telefone || '';
		if (telefoneFormatado && window.UIUtils && typeof window.UIUtils.formatarTelefone === 'function') {
			telefoneFormatado = UIUtils.formatarTelefone(telefoneFormatado);
		}
        
        // Preparar dados da situação
        const situacaoData = {
            empresaId: empresa.id,
            empresaCnpj: empresa.cnpj,
            empresaRazaoSocial: empresa.razaoSocial,
            dataSituacao: dados.dataSituacao, // Já formatada
            regime: dados.tributacao,
            endereco: dados.endereco || '',
            contato: {
                telefone: telefoneFormatado,
                email: dados.email || ''
            }
        };
        
        // Adicionar grupos de presunção se for Lucro Presumido
        if (dados.tributacao === 'presumido') {
            // Coletar grupos selecionados
            const gruposSelecionados = [];
            const checkboxes = document.querySelectorAll('input[name="gruposPresumido[]"]:checked');
            
            checkboxes.forEach(checkbox => {
                gruposSelecionados.push(checkbox.value);
            });
            
            if (gruposSelecionados.length === 0) {
                UIUtils.mostrarToast('Para Lucro Presumido, é necessário selecionar pelo menos um grupo', 'warning');
                console.warn('⚠️ Nenhum grupo selecionado para Lucro Presumido');
                return;
            }
            
            situacaoData.gruposPresumido = gruposSelecionados;
            console.log(`✅ ${gruposSelecionados.length} grupo(s) de presunção selecionados:`, gruposSelecionados);
        }
        
        // Adicionar anexos se for Simples Nacional
        if (dados.tributacao === 'simples') {
            situacaoData.anexos = this.coletarAnexos();
            
            if (situacaoData.anexos.length === 0) {
                UIUtils.mostrarToast('Para Simples Nacional, é necessário pelo menos um anexo', 'warning');
                console.warn('⚠️ Nenhum anexo cadastrado para Simples Nacional');
                return;
            }
            
            console.log(`✅ ${situacaoData.anexos.length} anexos coletados`);
        }
        
        // SALVAR NO DATASTORE
        let resultado;
        
        if (this.modoEdicao && this.situacaoEditandoId) {
            // MODO EDIÇÃO
            resultado = DataStore.atualizarItem('situacoes', this.situacaoEditandoId, situacaoData);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Situação atualizada com sucesso!', 'success');
                this.sairModoEdicao();
            } else {
                UIUtils.mostrarToast(`❌ Erro ao atualizar: ${resultado.error}`, 'error');
            }
        } else {
            // MODO CADASTRO NOVO
            resultado = DataStore.salvarItem('situacoes', situacaoData);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Situação cadastrada com sucesso!', 'success');
                this.limparFormulario();
            } else {
                UIUtils.mostrarToast(`❌ Erro ao cadastrar: ${resultado.error}`, 'error');
            }
        }
        
        // Atualizar lista
        this.carregarListaSituacoes();
        
        console.log('💾 Resultado do salvamento:', resultado);
        return resultado;
    }

    /**
     * Coleta dados dos anexos do formulário
     */
    coletarAnexos() {
        const anexos = [];
        
        document.querySelectorAll('.anexo-item').forEach(anexo => {
            const codigo = anexo.querySelector('.codigo-anexo')?.value;
            const atividade = anexo.querySelector('.atividade-anexo')?.value;
            
            // Só adiciona se tiver código e atividade
            if (codigo && atividade) {
                anexos.push({
                    codigoAnexo: codigo,
                    atividade: atividade,
                    descricao: anexo.querySelector('.descricao-anexo')?.value || '',
                    temSubstituicaoTributaria: anexo.querySelector('.substituicao-tributaria')?.checked || false,
                    temMonofasico: anexo.querySelector('.monofasico')?.checked || false,
                    temRetencao: anexo.querySelector('.retencao')?.checked || false,                    
                });
            }
        });
        
        return anexos;
    }

    /**
     * Carrega a lista de situações
     */
    carregarListaSituacoes() {
        const container = document.getElementById('listaSituacoes');
        if (!container) {
            console.error('❌ Container de lista de situações não encontrado');
            return;
        }
        
        // Verificar se DataStore está disponível
        if (typeof DataStore === 'undefined' || !DataStore) {
            console.warn('⚠️ DataStore não disponível para carregar lista');
            container.innerHTML = `
                <div class="text-center py-10 text-gray-400">
                    <i class="fas fa-exclamation-triangle text-3xl mb-2"></i>
                    <p>Sistema de dados não disponível</p>
                </div>
            `;
            return;
        }
        
        const situacoes = DataStore.obterTodos('situacoes', []);
        console.log(`📊 Carregando ${situacoes.length} situações...`);
        
        if (situacoes.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 text-gray-400">
                    <i class="fas fa-file-contract text-3xl mb-2"></i>
                    <p>Nenhuma situação cadastrada</p>
                    <p class="text-sm mt-1">Registre a primeira situação usando o formulário</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        
        situacoes.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao))
                .forEach(situacao => {
            // Formatar data para exibição corretamente usando UIUtils
            const dataFormatada = UIUtils.formatarDataParaExibicao(situacao.dataSituacao);
            const regimeText = UIUtils.getNomeRegime(situacao.regime);
            
            const gruposText = situacao.gruposPresumido ? 
                this.formatarGruposPresumido(situacao.gruposPresumido) : '';
            
            const numAnexos = situacao.anexos ? situacao.anexos.length : 0;
            
            let regimeClass = UIUtils.getClasseRegime(situacao.regime);
            let gruposHtml = '';

            if (situacao.regime === 'presumido' && situacao.gruposPresumido) {
                gruposHtml = `
                    <div class="mt-2">
                        <span class="text-xs text-gray-500">Grupos:</span>
                        <span class="ml-1 text-xs font-medium text-yellow-700">${gruposText}</span>
                    </div>
                `;
            }
            
            html += `
                <div class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-bold text-gray-800"> ${situacao.empresaRazaoSocial || 'Empresa'} </h4>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">${situacao.empresaCnpj}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${regimeClass}">
                                    ${regimeText}
                                </span>
                            </div>

                            ${gruposHtml}
                        </div>

                        <div class="flex gap-1">
                            <button class="btn-editar-situacao text-blue-600 hover:text-blue-800 p-1"
                                data-id="${situacao.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-excluir-situacao text-red-600 hover:text-red-800 p-1"
                                data-id="${situacao.id}" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-gray-500">Data:</span>
                            <span class="ml-1 font-medium">${dataFormatada}</span>
                        </div>
                        <div>
                            <span class="text-gray-500">Anexos:</span>
                            <span class="ml-1 font-medium">${numAnexos}</span>
                        </div>
                    </div>

                    ${situacao.endereco ? `
                    <div class="mt-3 pt-3 border-t text-sm text-gray-600">
                        <i class="fas fa-map-marker-alt mr-1"></i>
                        ${situacao.endereco.substring(0, 50)}${situacao.endereco.length > 50 ? '...' : ''}
                    </div>
                    ` : ''}
                    
                    ${situacao.contato && situacao.contato.telefone ? `
                    <div class="mt-2 text-sm text-gray-600">
                        <i class="fas fa-phone mr-1"></i>
                        ${situacao.contato.telefone}
                    </div>
                    ` : ''}
                </div>
                `;
        });
        
        container.innerHTML = html;
        
        // Adicionar eventos aos botões
        this.adicionarEventosListaSituacoes();
        
        console.log(`✅ ${situacoes.length} situações carregadas na lista`);
    }    
    
    /**
     * Formata os grupos de presunção para exibição
     */
    formatarGruposPresumido(grupos) {
        if (!grupos || grupos.length === 0) return 'Nenhum';
        
        const nomesGrupos = {
            'grupo1': 'Grupo 1',
            'grupo2': 'Grupo 2',
            'grupo3': 'Grupo 3'
        };
        
        return grupos.map(g => nomesGrupos[g] || g).join(', ');
    }

    /**
     * Adiciona eventos aos botões da lista de situações
     */
    adicionarEventosListaSituacoes() {
        // Botões de editar
        document.querySelectorAll('.btn-editar-situacao').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const situacaoId = e.currentTarget.getAttribute('data-id');
                this.editarSituacao(situacaoId);
            });
        });
        
        // Botões de excluir
        document.querySelectorAll('.btn-excluir-situacao').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const situacaoId = e.currentTarget.getAttribute('data-id');
                this.confirmarExclusaoSituacao(situacaoId);
            });
        });
        
        console.log(`✅ Eventos configurados para ${document.querySelectorAll('.btn-editar-situacao').length} situações`);
    }

    /**
     * Preenche formulário para edição
     */
    editarSituacao(situacaoId) {
        console.log(`✏️ Editando situação ID: ${situacaoId}`);
        
        const situacao = DataStore.obterPorId('situacoes', situacaoId);
        
        if (!situacao) {
            UIUtils.mostrarToast('Situação não encontrada', 'error');
            console.error(`❌ Situação não encontrada: ${situacaoId}`);
            return;
        }
        
        console.log('📝 Situação encontrada:', situacao);
        
        // Preencher campos básicos
        if (this.selectEmpresa) this.selectEmpresa.value = situacao.empresaCnpj;
        if (document.getElementById('dataSituacao')) {
            // Formatar data para o input type="date"
            const dataParaInput = UIUtils.corrigirFusoHorarioData(situacao.dataSituacao);
            document.getElementById('dataSituacao').value = dataParaInput.toISOString().split('T')[0];
        }
        if (this.selectTributacao) {
            this.selectTributacao.value = situacao.regime;
            this.handleTributacaoChange();
        }
        if (document.getElementById('endereco')) {
            document.getElementById('endereco').value = situacao.endereco || '';
        }
        
        // Preencher telefone formatado usando UIUtils.formatarTelefone
		if (situacao.contato && situacao.contato.telefone && document.getElementById('telefone')) {
			const telefoneInput = document.getElementById('telefone');
			// Usar a nova função que aceita string diretamente
			if (window.UIUtils && typeof window.UIUtils.formatarTelefone === 'function') {
				telefoneInput.value = UIUtils.formatarTelefone(situacao.contato.telefone);
			} else {
				telefoneInput.value = situacao.contato.telefone;
			}
		}
        
        // Preencher email
        if (situacao.contato && situacao.contato.email && document.getElementById('email')) {
            document.getElementById('email').value = situacao.contato.email || '';
        }
        
        // Preencher grupos de presunção se for Lucro Presumido
        if (situacao.regime === 'presumido' && situacao.gruposPresumido) {
            // Aguardar o bloco ser exibido e os checkboxes serem criados
            setTimeout(() => {
                situacao.gruposPresumido.forEach(grupoId => {
                    const checkbox = document.getElementById(`grupo_${grupoId}`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
                console.log('✅ Grupos de presunção preenchidos para edição');
            }, 300);
        }
        
        // Preencher anexos se for Simples Nacional
        if (situacao.regime === 'simples' && situacao.anexos && this.listaAnexos) {
            this.listaAnexos.innerHTML = '';
            
            situacao.anexos.forEach((anexo, index) => {
                // Adicionar anexo
                this.adicionarAnexo();
                
                // Preencher dados do último anexo adicionado
                const ultimoAnexo = this.listaAnexos.lastElementChild;
                if (ultimoAnexo) {
                    const codigoSelect = ultimoAnexo.querySelector('.codigo-anexo');
                    const atividadeInput = ultimoAnexo.querySelector('.atividade-anexo');
                    const descricaoTextarea = ultimoAnexo.querySelector('.descricao-anexo');
                    
                    if (codigoSelect) codigoSelect.value = anexo.codigoAnexo;
                    if (atividadeInput) atividadeInput.value = anexo.atividade;
                    if (descricaoTextarea) descricaoTextarea.value = anexo.descricao || '';
                    
                    // Atualizar opções baseado no código
                    if (codigoSelect) {
                        this.atualizarOpcoesAnexo(codigoSelect);
                        
                        // Preencher checkboxes
                        if (anexo.temSubstituicaoTributaria) {
                            const checkbox = ultimoAnexo.querySelector('.substituicao-tributaria');
                            if (checkbox) checkbox.checked = true;
                        }
                        if (anexo.temMonofasico) {
                            const checkbox = ultimoAnexo.querySelector('.monofasico');
                            if (checkbox) checkbox.checked = true;
                        }
                        if (anexo.temRetencao) {
                            const checkbox = ultimoAnexo.querySelector('.retencao');
                            if (checkbox) checkbox.checked = true;
                        }
                    }
                }
            });
            
            this.reordenarAnexos();
        }
        
        // Entrar em modo edição
        this.modoEdicao = true;
        this.situacaoEditandoId = situacaoId;
        
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Atualizar Situação';
            submitBtn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
            submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }
        
        // Atualizar título
        const titulo = document.getElementById('tituloSituacao');
        if (titulo) {
            titulo.innerHTML = '<i class="fas fa-edit text-yellow-500"></i> Editando Situação';
        }
        
        UIUtils.mostrarToast(`✏️ Editando situação de ${situacao.empresaRazaoSocial}`, 'warning');
        
        // Rolar até o formulário
        this.formulario.scrollIntoView({ behavior: 'smooth' });
        
        console.log('✅ Situação carregada para edição');
    }

    /**
     * Confirma exclusão de uma situação
     */
    confirmarExclusaoSituacao(situacaoId) {
        const situacao = DataStore.obterPorId('situacoes', situacaoId);
        
        if (!situacao) {
            console.error(`❌ Situação não encontrada para exclusão: ${situacaoId}`);
            return;
        }
        
        console.log(`🗑️ Confirmando exclusão da situação: ${situacao.empresaRazaoSocial}`);
        
        if (confirm(`Tem certeza que deseja excluir a situação de ${situacao.empresaRazaoSocial} (${this.formatarDataParaExibicao(situacao.dataSituacao)})?`)) {
            const resultado = DataStore.excluirItem('situacoes', situacaoId);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Situação excluída com sucesso', 'success');
                this.carregarListaSituacoes();
                console.log('✅ Situação excluída:', resultado);
            } else {
                UIUtils.mostrarToast(`❌ Erro ao excluir: ${resultado.error}`, 'error');
                console.error('❌ Erro ao excluir situação:', resultado.error);
            }
        } else {
            console.log('❌ Exclusão cancelada pelo usuário');
        }
    }

    /**
     * Sai do modo de edição
     */
    sairModoEdicao() {
        this.modoEdicao = false;
        this.situacaoEditandoId = null;
        this.limparFormulario();
        
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Registrar';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-orange-600', 'hover:bg-orange-700');
        }
        
        const titulo = document.getElementById('tituloSituacao');
        if (titulo) {
            titulo.innerHTML = '<i class="fas fa-file-contract text-orange-500"></i> Registrar Situação';
        }
        
        console.log('✅ Modo edição finalizado');
    }
    
    /**
     * Limpa a seleção dos grupos de presunção
     */
    limparGruposPresumido() {
        if (this.gruposPresumido) {
            const checkboxes = this.gruposPresumido.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            console.log('✅ Grupos de presunção limpos');
        }
    }

    /**
     * Limpa o formulário
     */
    limparFormulario() {
        console.log('🧹 Limpando formulário de situação...');
        
        if (this.formulario) {
            this.formulario.reset();
        }
        
        // Limpar anexos
        if (this.listaAnexos) {
            this.listaAnexos.innerHTML = '';
        }
        
        // Limpar grupos de presunção
        this.limparGruposPresumido();
        
        // Resetar regime tributário
        if (this.selectTributacao) {
            this.selectTributacao.value = '';
            this.handleTributacaoChange();
        }
        
        // Limpar feedback de validação de data
        const feedbackElement = document.getElementById('dataSituacaoFeedback');
        if (feedbackElement) {
            feedbackElement.innerHTML = '';
            feedbackElement.className = 'text-xs mt-1';
        }
        
        const dataInput = document.getElementById('dataSituacao');
        if (dataInput) {
            dataInput.classList.remove('border-red-500', 'border-green-500', 'border-yellow-500');
        }
        
        // Sair do modo edição se estiver
        if (this.modoEdicao) {
            this.sairModoEdicao();
        }
        
        console.log('✅ Formulário limpo');
    }
}   

// ==================== INICIALIZAÇÃO ====================

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM carregado, verificando inicialização do SituacaoController...');
    
    // Verificar se estamos na aba de situações
    if (document.getElementById('situacaoForm')) {
        console.log('✅ Formulário de situação encontrado, inicializando controller...');
        
        // Aguardar um pouco para garantir que tudo carregou
        setTimeout(() => {
            if (!window.situacaoController) {
                window.situacaoController = new SituacaoController();
                console.log('✅ SituacaoController inicializado globalmente');
            } else {
                console.log('✅ SituacaoController já está inicializado');
            }
        }, 500);
    } else {
        console.log('⚠️ Formulário de situação não encontrado, não inicializando controller');
    }
});

// Exportar para uso global
if (typeof window !== 'undefined') {
    // Criar função global para compatibilidade com código existente
    window.mostrarMensagem = function(texto, tipo = 'info') {
        UIUtils.mostrarToast(texto, tipo);
    };
}

// Exportar para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SituacaoController };
}