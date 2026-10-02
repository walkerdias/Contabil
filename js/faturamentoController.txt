// js/faturamentoController.js
/**
 * CONTROLLER DE FATURAMENTO - Gerencia o registro de faturamento mensal
 * Fluxo 4 do sistema: Registro de Faturamento
 */

class FaturamentoController {
    constructor() {
        this.formulario = null;
        this.selectEmpresa = null;
        this.selectMes = null;
        this.containerAnexos = null;
        this.camposAnexos = null;
        this.modoEdicao = false;
        this.faturamentoEditandoId = null;
        this.regimeAtual = null;
        this.anexosDaEmpresa = [];

        this.inicializar();
    }

    /**
     * Inicializa o controller
     */
    inicializar() {
        console.log('✅ Inicializando FaturamentoController...');
        
        this.formulario = document.getElementById('faturamentoForm');
        this.selectEmpresa = document.getElementById('cnpjFaturamento');
        this.selectMes = document.getElementById('mesFaturamento');
        this.containerAnexos = document.getElementById('segregacaoAnexos');
        this.camposAnexos = document.getElementById('camposAnexos');

        if (!this.formulario) {
            console.error('❌ Formulário de faturamento não encontrado');
            return;
        }

        this.configurarEventos();
        this.carregarListaFaturamento();
        this.carregarFiltroAnos();
        
        console.log('✅ FaturamentoController inicializado');
    }

    /**
     * Configura os eventos do formulário e elementos
     */
    configurarEventos() {
        // Evento de submit do formulário
        this.formulario.addEventListener('submit', (e) => this.salvarFaturamento(e));

        // Evento de mudança no select de empresa
        if (this.selectEmpresa) {
            this.selectEmpresa.addEventListener('change', () => this.handleEmpresaChange());
        }

        // Evento de mudança no mês/ano
        if (this.selectMes) {
            this.selectMes.addEventListener('change', () => this.handleMesChange());
        }

        // Evento do botão limpar
        const btnLimpar = document.getElementById('limparFaturamento');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.limparFormulario());
        }

        // Evento do botão atualizar lista
        const btnAtualizar = document.getElementById('atualizarFaturamento');
        if (btnAtualizar) {
            btnAtualizar.addEventListener('click', () => this.carregarListaFaturamento());
        }

        // Eventos dos filtros
        const filtroEmpresa = document.getElementById('filtroEmpresaFaturamento');
        const filtroAno = document.getElementById('filtroAnoFaturamento');
        const filtroPeriodo = document.getElementById('filtroPeriodoFaturamento');

        if (filtroEmpresa) {
            filtroEmpresa.addEventListener('change', () => this.carregarListaFaturamento());
        }
        if (filtroAno) {
            filtroAno.addEventListener('change', () => {
                this.carregarListaFaturamento();
            });
        }
        if (filtroPeriodo) {
            filtroPeriodo.addEventListener('change', () => this.carregarListaFaturamento());
        }
    }

    /**
     * Carrega os anos disponíveis para filtro
     */
    carregarFiltroAnos() {
        const selectAno = document.getElementById('filtroAnoFaturamento');
        if (!selectAno) return;

        // Obter todos os faturamentos para extrair anos
        const faturamentos = DataStore.obterTodos('faturamentos', []);
        const anos = [...new Set(faturamentos.map(f => f.ano))].sort((a, b) => b - a);

        // Limpar e adicionar opção padrão
        selectAno.innerHTML = '<option value="">Selecione o ano</option>';

        // Adicionar anos
        anos.forEach(ano => {
            const option = document.createElement('option');
            option.value = ano;
            option.textContent = ano;
            selectAno.appendChild(option);
        });

        // Adicionar ano atual se não existir
        const anoAtual = new Date().getFullYear();
        if (!anos.includes(anoAtual)) {
            const option = document.createElement('option');
            option.value = anoAtual;
            option.textContent = anoAtual;
            selectAno.appendChild(option);
        }
    }

    /**
     * Manipula a mudança de empresa no select
     */
    handleEmpresaChange() {
        const empresaCnpj = this.selectEmpresa.value;
        if (!empresaCnpj) {
            this.limparCamposDinamicos();
            return;
        }

        // Se não tem mês selecionado, não pode buscar situação
        const mesAno = this.selectMes.value;
        if (!mesAno) {
            UIUtils.mostrarToast('Selecione primeiro o mês/ano do faturamento', 'warning');
            this.selectEmpresa.value = ''; // Limpa o select
            return;
        }

        // Buscar situação vigente na data do faturamento
        this.buscarSituacaoVigente(empresaCnpj, mesAno);
    }

    /**
     * Manipula a mudança no mês/ano
     */
    handleMesChange() {
        const empresaCnpj = this.selectEmpresa.value;
        const mesAno = this.selectMes.value;
        
        if (!empresaCnpj || !mesAno) {
            // Se mudou o mês mas não tem empresa selecionada, apenas limpa os campos
            if (!empresaCnpj) {
                this.limparCamposDinamicos();
            }
            return;
        }

        // Buscar situação vigente na nova data
        this.buscarSituacaoVigente(empresaCnpj, mesAno);
    }

    /**
     * Busca a situação vigente de uma empresa em uma data específica
     */
    buscarSituacaoVigente(empresaCnpj, mesAno) {
        console.log(`🔍 Buscando situação vigente para ${empresaCnpj} em ${mesAno}`);
        
        // Buscar a empresa
        const empresas = DataStore.obterTodos('empresas', []);
        const empresa = empresas.find(e => e.cnpj === empresaCnpj || e.id === empresaCnpj);
        if (!empresa) {
            UIUtils.mostrarToast('Empresa não encontrada', 'error');
            return;
        }

        // Converter mês/ano para data de referência (último dia do mês)
        const [ano, mes] = mesAno.split('-').map(Number);
        const dataReferencia = new Date(ano, mes - 1, 1); // Primeiro dia do mês
        const ultimoDiaMes = new Date(ano, mes, 0).getDate(); // Último dia do mês
        const dataFimMes = new Date(ano, mes - 1, ultimoDiaMes);
        
        console.log(`📅 Data de referência para busca: ${dataReferencia.toLocaleDateString('pt-BR')} a ${dataFimMes.toLocaleDateString('pt-BR')}`);

        // Buscar todas as situações da empresa, ordenadas por data
        const situacoes = DataStore.obterTodos('situacoes', [])
            .filter(s => s.empresaCnpj === empresaCnpj)
            .sort((a, b) => new Date(a.dataSituacao) - new Date(b.dataSituacao)); // Ordem crescente

        console.log(`📊 ${situacoes.length} situações encontradas para a empresa`);

        // Encontrar a situação vigente na data do faturamento
        let situacaoVigente = null;
        
        // Percorrer situações para encontrar a que estava vigente na data do faturamento
        for (let i = situacoes.length - 1; i >= 0; i--) {
            const situacao = situacoes[i];
            const dataSituacao = UIUtils.corrigirFusoHorarioData(situacao.dataSituacao); // USANDO UIUTILS
            
            // Se a data da situação é anterior ou igual ao último dia do mês do faturamento
            if (dataSituacao <= dataFimMes) {
                situacaoVigente = situacao;
                console.log(`✅ Situação encontrada: ${situacao.regime} de ${situacao.dataSituacao}`);
                break;
            }
        }

        if (!situacaoVigente) {
            UIUtils.mostrarToast(`Esta empresa não tinha situação cadastrada até ${dataFimMes.toLocaleDateString('pt-BR')}`, 'error');
            this.limparCamposDinamicos();
            this.selectEmpresa.value = ''; // Limpa o select
            return;
        }

        // Verificar se há situação mais recente que substituiu esta
        const indiceSituacao = situacoes.findIndex(s => s.id === situacaoVigente.id);
        if (indiceSituacao < situacoes.length - 1) {
            const proximaSituacao = situacoes[indiceSituacao + 1];
            const dataProximaSituacao = UIUtils.corrigirFusoHorarioData(proximaSituacao.dataSituacao); // USANDO UIUTILS
            
            // Se a próxima situação começou durante o mês do faturamento
            if (dataProximaSituacao >= dataReferencia && dataProximaSituacao <= dataFimMes) {
                console.log(`⚠️ ATENÇÃO: Houve mudança de regime durante o mês!`);
                console.log(`- Situação anterior: ${situacaoVigente.regime} (até ${dataProximaSituacao.toLocaleDateString('pt-BR')})`);
                console.log(`- Nova situação: ${proximaSituacao.regime} (a partir de ${dataProximaSituacao.toLocaleDateString('pt-BR')})`);
                
                // Usar UIUtils para formatação de data e nome do regime
				const dataFormatada = UIUtils.formatarData(dataProximaSituacao);
				const nomeRegimeVigente = UIUtils.getNomeRegime(situacaoVigente.regime);
				const nomeRegimeProximo = UIUtils.getNomeRegime(proximaSituacao.regime);

				// Mostrar alerta ao usuário
                UIUtils.mostrarToast(
					`ATENÇÃO: Este mês teve mudança de regime tributário!<br>
					Até ${dataFormatada}: ${nomeRegimeVigente}<br>
					A partir de ${dataFormatada}: ${nomeRegimeProximo}<br>
					<br>Registre o faturamento considerando esta mudança.`,
					'warning',
					5000  // 5 segundos para mensagens mais longas
				);
                
                // Usar a situação mais recente (que estava vigente no final do mês)
                situacaoVigente = proximaSituacao;
            }
        }

        this.regimeAtual = situacaoVigente.regime;
        this.anexosDaEmpresa = situacaoVigente.anexos || [];

        console.log(`📊 Regime vigente em ${mesAno}: ${this.regimeAtual}, Anexos:`, this.anexosDaEmpresa);

        // Mostrar informação da situação vigente
        this.mostrarInfoSituacaoVigente(situacaoVigente, mesAno);

        // Atualizar os campos dinâmicos conforme o regime e anexos
        this.atualizarCamposDinamicos();
    }

    /**
	 * Mostra informação da situação vigente usando UIUtils centralizado
	 */
	mostrarInfoSituacaoVigente(situacao, mesAno) {
		// Remover info anterior se existir
		const infoAnterior = document.getElementById('infoSituacaoVigente');
		if (infoAnterior) {
			infoAnterior.remove();
		}

		// Criar elemento de informação
		const infoDiv = document.createElement('div');
		infoDiv.id = 'infoSituacaoVigente';
		infoDiv.className = 'bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4';
		
		// Usar UIUtils para nome do regime e formatação de data
		const regimeNome = UIUtils.getNomeRegime(situacao.regime);
		const dataSituacaoFormatada = UIUtils.formatarDataParaExibicao(situacao.dataSituacao); // USANDO UIUTILS
		
		// Usar badge do UIUtils para regime
		const regimeBadge = UIUtils.criarBadge(regimeNome, 
			situacao.regime === 'simples' ? 'info' :
			situacao.regime === 'presumido' ? 'warning' :
			'gray'
		);
		
		infoDiv.innerHTML = `
			<div class="flex items-start gap-3">
				<div class="flex-shrink-0">
					<i class="fas fa-info-circle text-blue-600 text-lg mt-0.5"></i>
				</div>
				<div class="flex-1">
					<div class="flex items-center gap-2 mb-1">
						<p class="text-sm font-medium text-blue-800">
							Situação vigente em ${mesAno}:
						</p>
						<div id="regimeBadgeContainer"></div>
					</div>
					<p class="text-xs text-blue-600">
						<i class="fas fa-calendar-alt mr-1"></i>
						Vigente desde ${dataSituacaoFormatada}
						${situacao.anexos && situacao.anexos.length > 0 ? 
							` • <i class="fas fa-file-contract mr-1"></i>${situacao.anexos.length} anexo(s)` : ''}
					</p>
					${situacao.endereco ? `
					<p class="text-xs text-blue-600 mt-1">
						<i class="fas fa-map-marker-alt mr-1"></i>
						${situacao.endereco.substring(0, 60)}${situacao.endereco.length > 60 ? '...' : ''}
					</p>
					` : ''}
				</div>
			</div>
		`;

		// Inserir badge dinamicamente
		const badgeContainer = infoDiv.querySelector('#regimeBadgeContainer');
		if (badgeContainer) {
			badgeContainer.appendChild(regimeBadge);
		}

		// Inserir antes do container de anexos
		if (this.containerAnexos) {
			this.containerAnexos.parentNode.insertBefore(infoDiv, this.containerAnexos);
		}
		
		return infoDiv;
	}
	
    // FUNÇÕES parseDataSemFusoHorario E formatarDataParaExibicao REMOVIDAS
    // Agora usamos UIUtils.corrigirFusoHorarioData e UIUtils.formatarDataParaExibicao

    /**
     * Atualiza os campos dinâmicos do formulário baseado no regime e anexos
     */
    atualizarCamposDinamicos() {
        // Limpar campos anteriores
        this.limparCamposDinamicos();

        // Se não há regime definido, ocultar a seção
        if (!this.regimeAtual) {
            this.containerAnexos.classList.add('hidden');
            return;
        }

        // Mostrar a seção de segregação
        this.containerAnexos.classList.remove('hidden');

        // Criar campos conforme o regime
        switch (this.regimeAtual) {
            case 'simples':
                this.criarCamposSimples();
                break;
            case 'presumido':
                this.criarCamposPresumido();
                break;
            case 'real':
                this.criarCamposReal();
                break;
            default:
                this.containerAnexos.classList.add('hidden');
                break;
        }

        // Atualizar a soma total
        this.atualizarSomaTotal();
    }

    /**
     * Cria campos para o Simples Nacional com cálculo automático de subtotais
     */
    criarCamposSimples() {
        if (!this.camposAnexos) return;

        // Para cada anexo da empresa, criar um grupo de campos
        this.anexosDaEmpresa.forEach((anexo, index) => {
            const anexoId = anexo.codigoAnexo;
            const atividade = anexo.atividade;

            let campos = '';

            // Campos específicos por anexo
            switch (anexoId) {
                case 'I':
                case 'II':
                    campos += `
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Com Substituição Tributária *</label>
                                <input type="number" step="0.01" min="0" 
                                       class="valor-com-substituicao w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-subtotal" 
                                       data-anexo="${anexoId}" 
                                       data-tipo="com-substituicao"
                                       placeholder="R$ 0,00"
                                       required>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Sem Substituição Tributária *</label>
                                <input type="number" step="0.01" min="0" 
                                       class="valor-sem-substituicao w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-subtotal" 
                                       data-anexo="${anexoId}" 
                                       data-tipo="sem-substituicao"
                                       placeholder="R$ 0,00"
                                       required>
                            </div>
                        </div>
                        <div class="mb-4">
                            <label class="flex items-center">
                                <input type="checkbox" class="monofasico mr-2" data-anexo="${anexoId}">
                                <span class="text-xs text-gray-700">Monofásico</span>
                            </label>
                        </div>
                        <!-- SUBTOTAL ANEXO I/II -->
                        <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-blue-800">Subtotal Anexo ${anexoId}:</span>
                                <span class="text-lg font-bold text-blue-900 subtotal-anexo" data-anexo="${anexoId}">R$ 0,00</span>
                            </div>
                        </div>
                    `;
                    break;

                case 'III':
                case 'IV':
                case 'V':
                    campos += `
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Com Retenção *</label>
                                <input type="number" step="0.01" min="0" 
                                       class="valor-com-retencao w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-subtotal" 
                                       data-anexo="${anexoId}" 
                                       data-tipo="com-retencao"
                                       placeholder="R$ 0,00"
                                       required>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 mb-1">Sem Retenção *</label>
                                <input type="number" step="0.01" min="0" 
                                       class="valor-sem-retencao w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-subtotal" 
                                       data-anexo="${anexoId}" 
                                       data-tipo="sem-retencao"
                                       placeholder="R$ 0,00"
                                       required>
                            </div>
                        </div>
                    `;

                    // Apenas para anexo V
                    if (anexoId === 'V') {
                        campos += `
                            <div class="mb-4">
                                <label class="block text-xs font-medium text-gray-700 mb-1">Massa Salarial</label>
                                <input type="number" step="0.01" min="0" 
                                       class="massa-salarial w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                                       data-anexo="${anexoId}" 
                                       placeholder="R$ 0,00">
                            </div>
                        `;
                    }
                    
                    // SUBTOTAL ANEXO III/IV/V
                    campos += `
                        <div class="bg-purple-50 p-3 rounded-lg border border-purple-200 mb-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm font-medium text-purple-800">Subtotal Anexo ${anexoId}:</span>
                                <span class="text-lg font-bold text-purple-900 subtotal-anexo" data-anexo="${anexoId}">R$ 0,00</span>
                            </div>
                        </div>
                    `;
                    break;
            }

            // Criar um card para cada anexo
            const card = document.createElement('div');
            card.className = 'border border-gray-300 rounded-lg p-4 mb-4 bg-gray-50';
            card.innerHTML = `
                <h5 class="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <i class="fas fa-layer-group text-blue-600"></i>
                    Anexo ${anexoId} - ${atividade}
                </h5>
                ${campos}
            `;

            this.camposAnexos.appendChild(card);
        });

        // Adicionar eventos para calcular subtotais
        this.adicionarEventosCamposDinamicos();
    }

    /**
     * Cria campos para o Lucro Presumido
     */
    criarCamposPresumido() {
        if (!this.camposAnexos) return;

        const campos = `
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Faturamento com Comércio *</label>
                    <input type="number" step="0.01" min="0" 
                           class="valor-comercio w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-total-presumido" 
                           placeholder="R$ 0,00"
                           required>
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Faturamento com Serviços *</label>
                    <input type="number" step="0.01" min="0" 
                           class="valor-servicos w-full border border-gray-300 rounded-lg p-2.5 text-sm calcular-total-presumido" 
                           placeholder="R$ 0,00"
                           required>
                </div>
            </div>
            
            <!-- TOTAL CALCULADO AUTOMATICAMENTE -->
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-medium text-blue-800">Total Calculado:</span>
                    <span class="text-lg font-bold text-blue-900" id="totalCalculadoPresumido">R$ 0,00</span>
                </div>
            </div>
            
            <h6 class="font-medium text-gray-700 mb-2">Impostos Retidos</h6>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">PIS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-pis w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">COFINS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-cofins w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">IRPJ</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-irpj w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">CSLL</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-csll w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">INSS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-inss w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
            </div>
        `;

        this.camposAnexos.innerHTML = campos;
        this.adicionarEventosCamposDinamicos();
        
        // Configurar eventos para cálculo automático do total
        this.configurarCalculoTotalPresumido();
    }

    /**
     * Configura eventos para cálculo automático do total no Lucro Presumido
     */
    configurarCalculoTotalPresumido() {
        const inputs = this.camposAnexos.querySelectorAll('.calcular-total-presumido');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.calcularTotalPresumido());
        });
        
        // Calcular inicialmente
        this.calcularTotalPresumido();
    }

    /**
     * Calcula o total do Lucro Presumido (comércio + serviços)
     */
    calcularTotalPresumido() {
        const comercioInput = this.camposAnexos.querySelector('.valor-comercio');
        const servicosInput = this.camposAnexos.querySelector('.valor-servicos');
        const totalElement = document.getElementById('totalCalculadoPresumido');
        
        if (!comercioInput || !servicosInput || !totalElement) return;
        
        const comercio = parseFloat(comercioInput.value) || 0;
        const servicos = parseFloat(servicosInput.value) || 0;
        const total = comercio + servicos;
        
        totalElement.textContent = UIUtils.formatarMoeda(total);
        
        return total;
    }

    /**
     * Cria campos para o Lucro Real
     */
    criarCamposReal() {
        if (!this.camposAnexos) return;

        const campos = `
            <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 mb-1">Faturamento Total *</label>
                <input type="number" step="0.01" min="0" 
                       class="valor-total w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                       placeholder="R$ 0,00"
                       required>
            </div>
            <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 mb-1">Deduções (opcional)</label>
                <input type="number" step="0.01" min="0" 
                       class="valor-deducoes w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                       placeholder="R$ 0,00">
            </div>
            <div class="mb-4">
                <label class="block text-xs font-medium text-gray-700 mb-1">Base de Cálculo</label>
                <input type="number" step="0.01" min="0" 
                       class="valor-base-calculo w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                       placeholder="R$ 0,00" readonly>
            </div>
            
            <h6 class="font-medium text-gray-700 mb-2">Impostos Retidos</h6>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">PIS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-pis w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">COFINS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-cofins w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">IRPJ</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-irpj w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">CSLL</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-csll w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">INSS</label>
                    <input type="number" step="0.01" min="0" 
                           class="imposto-inss w-full border border-gray-300 rounded-lg p-2.5 text-sm" 
                           placeholder="R$ 0,00">
                </div>
            </div>
        `;

        this.camposAnexos.innerHTML = campos;

        // Calcular base de cálculo automaticamente
        const totalInput = this.camposAnexos.querySelector('.valor-total');
        const deducoesInput = this.camposAnexos.querySelector('.valor-deducoes');
        const baseInput = this.camposAnexos.querySelector('.valor-base-calculo');

        const calcularBase = () => {
            const total = parseFloat(totalInput.value) || 0;
            const deducoes = parseFloat(deducoesInput.value) || 0;
            const base = Math.max(0, total - deducoes);
            baseInput.value = base.toFixed(2);
            this.atualizarSomaTotal();
        };

        totalInput.addEventListener('input', calcularBase);
        deducoesInput.addEventListener('input', calcularBase);

        this.adicionarEventosCamposDinamicos();
        
        // Calcular base inicialmente
        calcularBase();
    }

    /**
     * Adiciona eventos aos campos dinâmicos para calcular subtotais
     */
    adicionarEventosCamposDinamicos() {
        // Para campos que devem calcular subtotais (Simples Nacional)
        const inputsCalculo = this.camposAnexos.querySelectorAll('.calcular-subtotal');
        inputsCalculo.forEach(input => {
            input.addEventListener('input', () => {
                const anexoId = input.getAttribute('data-anexo');
                this.calcularSubtotalAnexo(anexoId);
                this.atualizarSomaTotal();
            });
        });

        // Para campos de valor total (Real)
        const inputsValor = this.camposAnexos.querySelectorAll('.valor-total');
        inputsValor.forEach(input => {
            input.addEventListener('input', () => this.atualizarSomaTotal());
        });
    }

    /**
     * Calcula o subtotal de um anexo específico
     */
    calcularSubtotalAnexo(anexoId) {
        if (!anexoId) return;

        let subtotal = 0;
        const anexo = this.anexosDaEmpresa.find(a => a.codigoAnexo === anexoId);
        if (!anexo) return;

        switch (anexoId) {
            case 'I':
            case 'II':
                const comSubstituicao = this.camposAnexos.querySelector(`.valor-com-substituicao[data-anexo="${anexoId}"]`);
                const semSubstituicao = this.camposAnexos.querySelector(`.valor-sem-substituicao[data-anexo="${anexoId}"]`);
                
                subtotal = (parseFloat(comSubstituicao?.value) || 0) + 
                          (parseFloat(semSubstituicao?.value) || 0);
                break;

            case 'III':
            case 'IV':
            case 'V':
                const comRetencao = this.camposAnexos.querySelector(`.valor-com-retencao[data-anexo="${anexoId}"]`);
                const semRetencao = this.camposAnexos.querySelector(`.valor-sem-retencao[data-anexo="${anexoId}"]`);
                
                subtotal = (parseFloat(comRetencao?.value) || 0) + 
                          (parseFloat(semRetencao?.value) || 0);
                break;
        }

        // Atualizar o elemento de subtotal
        const subtotalElement = this.camposAnexos.querySelector(`.subtotal-anexo[data-anexo="${anexoId}"]`);
        if (subtotalElement) {
            subtotalElement.textContent = UIUtils.formatarMoeda(subtotal);
        }

        return subtotal;
    }

    /**
     * Calcula o subtotal de todos os anexos
     */
    calcularSubtotalTodosAnexos() {
        let totalGeral = 0;
        
        this.anexosDaEmpresa.forEach(anexo => {
            const subtotal = this.calcularSubtotalAnexo(anexo.codigoAnexo);
            totalGeral += subtotal;
        });
        
        return totalGeral;
    }

    /**
     * Atualiza a soma total de todos os faturamentos
     */
    atualizarSomaTotal() {
        let soma = 0;

        if (this.regimeAtual === 'simples') {
            // Para Simples, calcular subtotal de todos os anexos
            soma = this.calcularSubtotalTodosAnexos();
        } else if (this.regimeAtual === 'presumido') {
            // Para Presumido, usar o total calculado
            soma = this.calcularTotalPresumido();
        } else if (this.regimeAtual === 'real') {
            // Para Real, usar o valor total do campo
            const inputTotal = this.camposAnexos.querySelector('.valor-total');
            if (inputTotal) {
                soma = parseFloat(inputTotal.value) || 0;
            }
        }

        // Atualizar o elemento de soma
        const somaElement = document.getElementById('somaTotalAnexos');
        if (somaElement) {
            somaElement.textContent = UIUtils.formatarMoeda(soma);
        }
    }

    /**
     * Limpa os campos dinâmicos
     */
    limparCamposDinamicos() {
        if (this.camposAnexos) {
            this.camposAnexos.innerHTML = '';
        }
        this.containerAnexos.classList.add('hidden');
        
        // Remover info da situação vigente
        const infoSituacao = document.getElementById('infoSituacaoVigente');
        if (infoSituacao) {
            infoSituacao.remove();
        }
        
        const somaElement = document.getElementById('somaTotalAnexos');
        if (somaElement) {
            somaElement.textContent = 'R$ 0,00';
        }
    }

    /**
     * Coleta os dados do formulário de acordo com o regime
     */
    coletarDadosFaturamento() {
        const empresaCnpj = this.selectEmpresa.value;
        const mesAno = this.selectMes.value;
        
        if (!empresaCnpj || !mesAno) {
            UIUtils.mostrarToast('Selecione uma empresa e mês/ano', 'error');
            return null;
        }

        // Separar mês e ano
        const [ano, mes] = mesAno.split('-').map(Number);

        // Buscar empresa
        const empresas = DataStore.obterTodos('empresas', []);
        const empresa = empresas.find(e => e.cnpj === empresaCnpj || e.id === empresaCnpj);
        if (!empresa) {
            UIUtils.mostrarToast('Empresa não encontrada', 'error');
            return null;
        }

        // Dados base
        const dados = {
            empresaId: empresa.id,
            empresaCnpj: empresa.cnpj,
            empresaRazaoSocial: empresa.razaoSocial,
            mes: mes,
            ano: ano,
            regime: this.regimeAtual,
            valores: {},
            dataRegistro: new Date().toISOString()
        };

        // Coletar valores conforme o regime
        switch (this.regimeAtual) {
            case 'simples':
                this.coletarValoresSimples(dados);
                break;
            case 'presumido':
                this.coletarValoresPresumido(dados);
                break;
            case 'real':
                this.coletarValoresReal(dados);
                break;
        }

        return dados;
    }

    /**
     * Coleta valores para o Simples Nacional
     */
    coletarValoresSimples(dados) {
        dados.valores = {
            anexos: []
        };

        let faturamentoTotalGeral = 0;

        // Para cada anexo, coletar os valores
        this.anexosDaEmpresa.forEach((anexo, index) => {
            const anexoId = anexo.codigoAnexo;
            const subtotal = this.calcularSubtotalAnexo(anexoId);
            
            const valoresAnexo = {
                codigoAnexo: anexoId,
                atividade: anexo.atividade,
                faturamentoTotal: subtotal
            };

            faturamentoTotalGeral += subtotal;

            // Campos específicos
            switch (anexoId) {
                case 'I':
                case 'II':
                    const comSubstituicao = this.camposAnexos.querySelector(`.valor-com-substituicao[data-anexo="${anexoId}"]`);
                    const semSubstituicao = this.camposAnexos.querySelector(`.valor-sem-substituicao[data-anexo="${anexoId}"]`);
                    const monofasico = this.camposAnexos.querySelector(`.monofasico[data-anexo="${anexoId}"]`);

                    if (comSubstituicao) valoresAnexo.comSubstituicaoTributaria = parseFloat(comSubstituicao.value) || 0;
                    if (semSubstituicao) valoresAnexo.semSubstituicaoTributaria = parseFloat(semSubstituicao.value) || 0;
                    if (monofasico) valoresAnexo.monofasico = monofasico.checked;
                    break;

                case 'III':
                case 'IV':
                case 'V':
                    const comRetencao = this.camposAnexos.querySelector(`.valor-com-retencao[data-anexo="${anexoId}"]`);
                    const semRetencao = this.camposAnexos.querySelector(`.valor-sem-retencao[data-anexo="${anexoId}"]`);

                    if (comRetencao) valoresAnexo.comRetencao = parseFloat(comRetencao.value) || 0;
                    if (semRetencao) valoresAnexo.semRetencao = parseFloat(semRetencao.value) || 0;

                    if (anexoId === 'V') {
                        const massaSalarial = this.camposAnexos.querySelector(`.massa-salarial[data-anexo="${anexoId}"]`);
                        if (massaSalarial) valoresAnexo.massaSalarial = parseFloat(massaSalarial.value) || 0;
                    }
                    break;
            }

            dados.valores.anexos.push(valoresAnexo);
        });

        dados.valores.faturamentoTotal = faturamentoTotalGeral;
    }

    /**
     * Coleta valores para o Lucro Presumido
     * ATUALIZADO: Calcula total automaticamente
     */
    coletarValoresPresumido(dados) {
        const comercioInput = this.camposAnexos.querySelector('.valor-comercio');
        const servicosInput = this.camposAnexos.querySelector('.valor-servicos');
        const pisInput = this.camposAnexos.querySelector('.imposto-pis');
        const cofinsInput = this.camposAnexos.querySelector('.imposto-cofins');
        const irpjInput = this.camposAnexos.querySelector('.imposto-irpj');
        const csllInput = this.camposAnexos.querySelector('.imposto-csll');
        const inssInput = this.camposAnexos.querySelector('.imposto-inss');

        const comercio = parseFloat(comercioInput?.value) || 0;
        const servicos = parseFloat(servicosInput?.value) || 0;
        const total = comercio + servicos;

        dados.valores = {
            faturamentoTotal: total,
            faturamentoComercio: comercio,
            faturamentoServicos: servicos,
            impostosRetidos: {
                pis: parseFloat(pisInput?.value) || 0,
                cofins: parseFloat(cofinsInput?.value) || 0,
                irpj: parseFloat(irpjInput?.value) || 0,
                csll: parseFloat(csllInput?.value) || 0,
                inss: parseFloat(inssInput?.value) || 0
            }
        };
    }

    /**
     * Coleta valores para o Lucro Real
     * ATUALIZADO: Adicionado INSS
     */
    coletarValoresReal(dados) {
        const totalInput = this.camposAnexos.querySelector('.valor-total');
        const deducoesInput = this.camposAnexos.querySelector('.valor-deducoes');
        const baseInput = this.camposAnexos.querySelector('.valor-base-calculo');
        const pisInput = this.camposAnexos.querySelector('.imposto-pis');
        const cofinsInput = this.camposAnexos.querySelector('.imposto-cofins');
        const irpjInput = this.camposAnexos.querySelector('.imposto-irpj');
        const csllInput = this.camposAnexos.querySelector('.imposto-csll');
        const inssInput = this.camposAnexos.querySelector('.imposto-inss');

        dados.valores = {
            faturamentoTotal: parseFloat(totalInput?.value) || 0,
            deducoes: parseFloat(deducoesInput?.value) || 0,
            baseCalculo: parseFloat(baseInput?.value) || 0,
            impostosRetidos: {
                pis: parseFloat(pisInput?.value) || 0,
                cofins: parseFloat(cofinsInput?.value) || 0,
                irpj: parseFloat(irpjInput?.value) || 0,
                csll: parseFloat(csllInput?.value) || 0,
                inss: parseFloat(inssInput?.value) || 0
            }
        };
    }

    /**
     * Valida os dados do faturamento
     */
    validarDadosFaturamento(dados) {
        if (!dados.empresaCnpj) {
            return 'Selecione uma empresa';
        }

        if (!dados.mes || !dados.ano) {
            return 'Selecione um mês/ano válido';
        }

        if (!dados.regime) {
            return 'Regime tributário não identificado';
        }

        // Verificar se o mês/ano é futuro
        const hoje = new Date();
        const mesAtual = hoje.getMonth() + 1;
        const anoAtual = hoje.getFullYear();
        
        if (dados.ano > anoAtual || (dados.ano === anoAtual && dados.mes > mesAtual)) {
            return 'Não é possível registrar faturamento para meses futuros';
        }

        // Restante da validação permanece igual
        if (dados.regime === 'simples') {
            let anexosComErro = [];
            
            this.anexosDaEmpresa.forEach(anexo => {
                const anexoId = anexo.codigoAnexo;
                const subtotal = this.calcularSubtotalAnexo(anexoId);
                
                if (subtotal <= 0) {
                    anexosComErro.push(`Anexo ${anexoId}`);
                }
            });
            
            if (anexosComErro.length > 0) {
                return `Informe os valores para: ${anexosComErro.join(', ')}`;
            }
        } else if (dados.regime === 'presumido') {
            const comercioInput = this.camposAnexos.querySelector('.valor-comercio');
            const servicosInput = this.camposAnexos.querySelector('.valor-servicos');
            
            const comercio = parseFloat(comercioInput?.value) || 0;
            const servicos = parseFloat(servicosInput?.value) || 0;
            
            if (comercio <= 0 && servicos <= 0) {
                return 'Informe o faturamento de comércio ou serviços';
            }
        } else if (dados.regime === 'real') {
            if (!dados.valores.faturamentoTotal || dados.valores.faturamentoTotal <= 0) {
                return 'Informe o faturamento total';
            }
        }

        return null;
    }

    /**
     * Preenche o formulário para edição
     */
    editarFaturamento(faturamentoId) {
        const faturamento = DataStore.obterPorId('faturamentos', faturamentoId);
        if (!faturamento) {
            UIUtils.mostrarToast('Registro não encontrado', 'error');
            return;
        }

        console.log('✏️ Editando faturamento:', faturamento);

        // Preencher campos básicos
        this.selectEmpresa.value = faturamento.empresaCnpj;
        
        // Formatar mês/ano para o input type="month"
        const mesAno = `${faturamento.ano}-${faturamento.mes.toString().padStart(2, '0')}`;
        this.selectMes.value = mesAno;

        // Buscar situação vigente na data do faturamento
        this.buscarSituacaoVigente(faturamento.empresaCnpj, mesAno);

        // Aguardar carregamento dos campos dinâmicos
        setTimeout(() => {
            // Preencher valores conforme o regime
            this.preencherValoresEdicao(faturamento);
        }, 500); // Aumentado para garantir que os campos foram carregados

        // Entrar em modo edição
        this.modoEdicao = true;
        this.faturamentoEditandoId = faturamentoId;

        // Alterar botão de submit
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Atualizar Faturamento';
            submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }

        UIUtils.mostrarToast('Editando registro de faturamento', 'warning');
    }

    /**
     * Salva ou atualiza um registro de faturamento
     */
    salvarFaturamento(event) {
        event.preventDefault();

        console.log('💾 Salvando faturamento...');

        // Coletar dados
        const dados = this.coletarDadosFaturamento();
        if (!dados) {
            return;
        }

        // Validar dados
        const erroValidacao = this.validarDadosFaturamento(dados);
        if (erroValidacao) {
            UIUtils.mostrarToast(erroValidacao, 'error');
            return;
        }

        // Verificar se já existe faturamento para a mesma empresa, mês e ano
        const faturamentos = DataStore.obterTodos('faturamentos', []);
        const existente = faturamentos.find(f => 
            f.empresaCnpj === dados.empresaCnpj && 
            f.mes === dados.mes && 
            f.ano === dados.ano &&
            (!this.modoEdicao || f.id !== this.faturamentoEditandoId)
        );

        if (existente && !this.modoEdicao) {
            UIUtils.mostrarToast('Já existe um registro de faturamento para este mês/ano', 'warning');
            return;
        }

        // Salvar ou atualizar
        let resultado;
        if (this.modoEdicao && this.faturamentoEditandoId) {
            resultado = DataStore.atualizarItem('faturamentos', this.faturamentoEditandoId, dados);
        } else {
            resultado = DataStore.salvarItem('faturamentos', dados);
        }

        if (resultado.success) {
            const mensagem = this.modoEdicao ? 
                '✅ Faturamento atualizado com sucesso!' : 
                '✅ Faturamento registrado com sucesso!';
            
            UIUtils.mostrarToast(mensagem, 'success');
            this.limparFormulario();
            this.carregarListaFaturamento();
            this.carregarFiltroAnos();
        } else {
            UIUtils.mostrarToast(`❌ Erro: ${resultado.error}`, 'error');
        }
    }

    /**
     * Carrega a lista de faturamentos com filtros
     */
    carregarListaFaturamento() {
        const container = document.getElementById('listaFaturamento');
        if (!container) return;

        // Obter filtros
        const filtroEmpresa = document.getElementById('filtroEmpresaFaturamento')?.value;
        const filtroAno = document.getElementById('filtroAnoFaturamento')?.value;
        const filtroPeriodo = document.getElementById('filtroPeriodoFaturamento')?.value;

        // Obter todos os faturamentos
        let faturamentos = DataStore.obterTodos('faturamentos', []);

        // Aplicar filtros
        if (filtroEmpresa && filtroEmpresa !== 'todas') {
            faturamentos = faturamentos.filter(f => f.empresaCnpj === filtroEmpresa);
        }

        if (filtroAno) {
            faturamentos = faturamentos.filter(f => f.ano === parseInt(filtroAno));
        }

        if (filtroPeriodo && filtroPeriodo !== '') {
            const [inicio, fim] = filtroPeriodo.split('-').map(Number);
            faturamentos = faturamentos.filter(f => f.mes >= inicio && f.mes <= fim);
        }

        // Ordenar por data (mais recente primeiro)
        faturamentos.sort((a, b) => {
            if (a.ano !== b.ano) return b.ano - a.ano;
            return b.mes - a.mes;
        });

        // Atualizar a lista
        this.atualizarListaFaturamento(faturamentos, container);
    }

    /**
     * Atualiza a exibição da lista de faturamentos
     */
    atualizarListaFaturamento(faturamentos, container) {
        if (faturamentos.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-chart-bar text-3xl mb-2"></i>
                    <p>Nenhum registro de faturamento encontrado</p>
                </div>
            `;
            return;
        }

        let html = '';
        faturamentos.forEach(fat => {
            const mesAno = `${fat.mes.toString().padStart(2, '0')}/${fat.ano}`;
            const valorTotal = this.calcularTotalFaturamento(fat);
            
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-800">${fat.empresaRazaoSocial || 'Empresa'}</h4>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-xs text-gray-500">${mesAno}</span>
                                <span class="text-xs px-2 py-0.5 rounded-full ${fat.regime === 'simples' ? 'bg-blue-100 text-blue-800' : fat.regime === 'presumido' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}">
                                    ${fat.regime === 'simples' ? 'Simples' : fat.regime === 'presumido' ? 'Presumido' : 'Real'}
                                </span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn-editar-faturamento text-blue-600 hover:text-blue-800 p-1" 
                                    data-id="${fat.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-excluir-faturamento text-red-600 hover:text-red-800 p-1" 
                                    data-id="${fat.id}" title="Excluir">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-3">
                        <div class="text-sm text-gray-600">
                            <span class="font-medium">Total:</span> ${UIUtils.formatarMoeda(valorTotal)}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Adicionar eventos aos botões
        this.adicionarEventosListaFaturamento();
    }

    /**
     * Calcula o total do faturamento para exibição
     */
    calcularTotalFaturamento(faturamento) {
        if (faturamento.regime === 'simples') {
            // Somar faturamento total de todos os anexos
            if (faturamento.valores.anexos) {
                return faturamento.valores.anexos.reduce((total, anexo) => {
                    return total + (anexo.faturamentoTotal || 0);
                }, 0);
            }
            return faturamento.valores.faturamentoTotal || 0;
        } else {
            return faturamento.valores.faturamentoTotal || 0;
        }
    }

    /**
     * Adiciona eventos aos botões da lista
     */
    adicionarEventosListaFaturamento() {
        // Editar
        document.querySelectorAll('.btn-editar-faturamento').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const faturamentoId = e.currentTarget.getAttribute('data-id');
                this.editarFaturamento(faturamentoId);
            });
        });

        // Excluir
        document.querySelectorAll('.btn-excluir-faturamento').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const faturamentoId = e.currentTarget.getAttribute('data-id');
                this.confirmarExclusaoFaturamento(faturamentoId);
            });
        });
    }
	
	/**
     * Preenche os valores do formulário para edição
     */
    preencherValoresEdicao(faturamento) {
        if (!faturamento || !faturamento.valores) return;

        switch (faturamento.regime) {
            case 'simples':
                this.preencherValoresSimplesEdicao(faturamento.valores);
                break;
            case 'presumido':
                this.preencherValoresPresumidoEdicao(faturamento.valores);
                break;
            case 'real':
                this.preencherValoresRealEdicao(faturamento.valores);
                break;
        }

        // Atualizar subtotais e soma total
        if (this.regimeAtual === 'presumido') {
            this.calcularTotalPresumido();
        }
        this.atualizarSomaTotal();
    }

    /**
     * Preenche valores para Simples Nacional em edição
     */
    preencherValoresSimplesEdicao(valores) {
        if (!valores.anexos) return;

        valores.anexos.forEach(anexo => {
            const anexoId = anexo.codigoAnexo;

            // Campos específicos
            switch (anexoId) {
                case 'I':
                case 'II':
                    const comSubstituicao = this.camposAnexos.querySelector(`.valor-com-substituicao[data-anexo="${anexoId}"]`);
                    const semSubstituicao = this.camposAnexos.querySelector(`.valor-sem-substituicao[data-anexo="${anexoId}"]`);
                    const monofasico = this.camposAnexos.querySelector(`.monofasico[data-anexo="${anexoId}"]`);

                    if (comSubstituicao && anexo.comSubstituicaoTributaria !== undefined) {
                        comSubstituicao.value = anexo.comSubstituicaoTributaria;
                    }
                    if (semSubstituicao && anexo.semSubstituicaoTributaria !== undefined) {
                        semSubstituicao.value = anexo.semSubstituicaoTributaria;
                    }
                    if (monofasico && anexo.monofasico !== undefined) {
                        monofasico.checked = anexo.monofasico;
                    }
                    break;

                case 'III':
                case 'IV':
                case 'V':
                    const comRetencao = this.camposAnexos.querySelector(`.valor-com-retencao[data-anexo="${anexoId}"]`);
                    const semRetencao = this.camposAnexos.querySelector(`.valor-sem-retencao[data-anexo="${anexoId}"]`);

                    if (comRetencao && anexo.comRetencao !== undefined) {
                        comRetencao.value = anexo.comRetencao;
                    }
                    if (semRetencao && anexo.semRetencao !== undefined) {
                        semRetencao.value = anexo.semRetencao;
                    }

                    if (anexoId === 'V') {
                        const massaSalarial = this.camposAnexos.querySelector(`.massa-salarial[data-anexo="${anexoId}"]`);
                        if (massaSalarial && anexo.massaSalarial !== undefined) {
                            massaSalarial.value = anexo.massaSalarial;
                        }
                    }
                    break;
            }

            // Calcular subtotal deste anexo
            setTimeout(() => this.calcularSubtotalAnexo(anexoId), 50);
        });
    }

    /**
     * Preenche valores para Lucro Presumido em edição
     * ATUALIZADO: Preenche campos de comércio e serviços, calcula total automaticamente
     */
    preencherValoresPresumidoEdicao(valores) {
        const comercioInput = this.camposAnexos.querySelector('.valor-comercio');
        const servicosInput = this.camposAnexos.querySelector('.valor-servicos');
        const pisInput = this.camposAnexos.querySelector('.imposto-pis');
        const cofinsInput = this.camposAnexos.querySelector('.imposto-cofins');
        const irpjInput = this.camposAnexos.querySelector('.imposto-irpj');
        const csllInput = this.camposAnexos.querySelector('.imposto-csll');
        const inssInput = this.camposAnexos.querySelector('.imposto-inss');

        if (comercioInput) comercioInput.value = valores.faturamentoComercio || 0;
        if (servicosInput) servicosInput.value = valores.faturamentoServicos || 0;
        if (pisInput) pisInput.value = valores.impostosRetidos?.pis || 0;
        if (cofinsInput) cofinsInput.value = valores.impostosRetidos?.cofins || 0;
        if (irpjInput) irpjInput.value = valores.impostosRetidos?.irpj || 0;
        if (csllInput) csllInput.value = valores.impostosRetidos?.csll || 0;
        if (inssInput) inssInput.value = valores.impostosRetidos?.inss || 0;
    }

    /**
     * Preenche valores para Lucro Real em edição
     * ATUALIZADO: Adicionado INSS
     */
    preencherValoresRealEdicao(valores) {
        const totalInput = this.camposAnexos.querySelector('.valor-total');
        const deducoesInput = this.camposAnexos.querySelector('.valor-deducoes');
        const baseInput = this.camposAnexos.querySelector('.valor-base-calculo');
        const pisInput = this.camposAnexos.querySelector('.imposto-pis');
        const cofinsInput = this.camposAnexos.querySelector('.imposto-cofins');
        const irpjInput = this.camposAnexos.querySelector('.imposto-irpj');
        const csllInput = this.camposAnexos.querySelector('.imposto-csll');
        const inssInput = this.camposAnexos.querySelector('.imposto-inss');

        if (totalInput) totalInput.value = valores.faturamentoTotal || 0;
        if (deducoesInput) deducoesInput.value = valores.deducoes || 0;
        if (baseInput) baseInput.value = valores.baseCalculo || 0;
        if (pisInput) pisInput.value = valores.impostosRetidos?.pis || 0;
        if (cofinsInput) cofinsInput.value = valores.impostosRetidos?.cofins || 0;
        if (irpjInput) irpjInput.value = valores.impostosRetidos?.irpj || 0;
        if (csllInput) csllInput.value = valores.impostosRetidos?.csll || 0;
        if (inssInput) inssInput.value = valores.impostosRetidos?.inss || 0;
    }

    /**
     * Confirma exclusão de um faturamento
     */
    confirmarExclusaoFaturamento(faturamentoId) {
        const faturamento = DataStore.obterPorId('faturamentos', faturamentoId);
        if (!faturamento) return;

        const mesAno = `${faturamento.mes.toString().padStart(2, '0')}/${faturamento.ano}`;
        
        if (confirm(`Tem certeza que deseja excluir o faturamento de ${mesAno}?`)) {
            const resultado = DataStore.excluirItem('faturamentos', faturamentoId);
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Faturamento excluído com sucesso', 'success');
                this.carregarListaFaturamento();
                this.carregarFiltroAnos();
            } else {
                UIUtils.mostrarToast(`❌ Erro ao excluir: ${resultado.error}`, 'error');
            }
        }
    }

    /**
     * Limpa o formulário
     */
    limparFormulario() {
        if (this.formulario) {
            this.formulario.reset();
        }

        this.limparCamposDinamicos();
        this.modoEdicao = false;
        this.faturamentoEditandoId = null;
        this.regimeAtual = null;
        this.anexosDaEmpresa = [];

        // Resetar botão de submit
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Registrar Faturamento';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }

        // Limpar ID oculto
        const faturamentoIdInput = document.getElementById('faturamentoId');
        if (faturamentoIdInput) {
            faturamentoIdInput.value = '';
        }
    }   
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('faturamentoForm')) {
        window.faturamentoController = new FaturamentoController();
    }
});