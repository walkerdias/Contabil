// app.js — Versão 5.0

// id="anexoContainer" excluir

"use strict";

		// Função para depuração - verificar dados no localStorage
		function debugLocalStorage() {
			console.log('=== DEBUG LOCALSTORAGE ===');
			
			const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
			console.log('Clientes no localStorage:', clientes);
			console.log('Número de clientes:', clientes.length);
			
			const selects = ['cnpjEmpresa', 'cnpjFaturamento', 'cnpjCalculo', 'filtroEmpresa'];
			selects.forEach(id => {
				const select = document.getElementById(id);
				if (select) {
					console.log(`Select ${id} encontrado, opções:`, select.options.length);
				} else {
					console.error(`Select ${id} NÃO encontrado no DOM`);
				}
			});
			
			console.log('=== FIM DEBUG ===');
		}
		
		// --- 1. CONFIGURAÇÃO E UTILITÁRIOS ---        
        function switchTab(tabId) {
			// Ocultar todas as abas
			document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
			
			// Mostrar a aba selecionada
			const tabElement = document.getElementById(tabId + 'Tab');
			if (tabElement) {
				tabElement.classList.add('active');
			}
			
			// Atualizar botões ativos
			document.querySelectorAll('.tab-button').forEach(el => {
				el.classList.remove('bg-brand-50', 'text-brand-700', 'border-brand-100', 'active');
				el.classList.add('text-gray-600');
			});
			
			const btn = document.querySelector(`[data-tab="${tabId}"]`);
			if(btn) {
				btn.classList.add('bg-brand-50', 'text-brand-700', 'border-brand-100', 'active');
				btn.classList.remove('text-gray-600');
			}
			
			// Atualizar selects necessários
			atualizarSelects();
			
			// Se for a aba de faturamento, carregar os dados
			if (tabId === 'faturamento') {
				carregarFaturamento();
				atualizarGraficoFaturamento();
			}
			
			// Se for a aba de relatórios, atualizar filtros
			if (tabId === 'relatorio') {
				atualizarSelectEmpresas();
			}
			
			// Se for a aba de parametrização, inicializar os listeners
			if (tabId === 'parametrizacao') {
				// Pequeno delay para garantir que o DOM está renderizado
				setTimeout(() => {
					initParametrizacaoListeners();
				}, 50);
			}
		}

        // Subtabs para parametrização
        document.querySelectorAll('.sub-tab-button').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.subtab;
                document.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
                document.querySelectorAll('.sub-tab-content').forEach(el => el.classList.remove('active'));
                document.getElementById(id + 'Tab').classList.remove('hidden');
                document.getElementById(id + 'Tab').classList.add('active');
                
                document.querySelectorAll('.sub-tab-button').forEach(b => {
                    b.classList.remove('bg-white', 'shadow-sm', 'text-brand-700');
                    b.classList.add('text-gray-600');
                });
                btn.classList.add('bg-white', 'shadow-sm', 'text-brand-700');
                btn.classList.remove('text-gray-600');
            });
        });

        function mostrarMensagem(texto, tipo = 'success') {
            const container = document.getElementById('toast-container');
            const el = document.createElement('div');
            
            let classes = 'mensagem-flutuante text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2';
            let icone = '';
            
            if (tipo === 'success') {
                classes += ' bg-emerald-500';
                icone = '<i class="fas fa-check-circle"></i>';
            } else if (tipo === 'error') {
                classes += ' bg-red-500';
                icone = '<i class="fas fa-times-circle"></i>';
            } else if (tipo === 'warning') {
                classes += ' bg-yellow-500';
                icone = '<i class="fas fa-exclamation-triangle"></i>';
            }
            
            el.className = classes;
            el.innerHTML = `${icone} ${texto}`;
            container.appendChild(el);
            setTimeout(() => {
                el.style.opacity = '0';
                el.style.animation = 'slideOut 0.3s ease forwards';
                setTimeout(() => el.remove(), 300);
            }, 3000);
        }

        function formatarData(data) {
            if (!data) return '';
            const [ano, mes, dia] = data.split('-');
            return `${dia}/${mes}/${ano}`;
        }
        
        function formatarMoeda(valor) {
             return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valor) || 0);
        }

		// função para inicializar os sub-tabs
		function initSubTabs() {
			document.querySelectorAll('.sub-tab-button').forEach(btn => {
				btn.addEventListener('click', () => {
					const id = btn.dataset.subtab;
					document.querySelectorAll('.sub-tab-content').forEach(el => el.classList.add('hidden'));
					document.querySelectorAll('.sub-tab-content').forEach(el => el.classList.remove('active'));
					document.getElementById(id + 'Tab').classList.remove('hidden');
					document.getElementById(id + 'Tab').classList.add('active');
					
					document.querySelectorAll('.sub-tab-button').forEach(b => {
						b.classList.remove('bg-white', 'shadow-sm', 'text-brand-700');
						b.classList.add('text-gray-600');
					});
					btn.classList.add('bg-white', 'shadow-sm', 'text-brand-700');
					btn.classList.remove('text-gray-600');
				});
			});
		}

        // --- 2. LÓGICA DE DADOS (LOCALSTORAGE) ---

        function initApp() {
			if (!localStorage.getItem('clientes')) localStorage.setItem('clientes', JSON.stringify([]));
			if (!localStorage.getItem('situacoes')) localStorage.setItem('situacoes', JSON.stringify([]));
			if (!localStorage.getItem('faturamento')) localStorage.setItem('faturamento', JSON.stringify([]));
			if (!localStorage.getItem('paramFaixasSimples')) localStorage.setItem('paramFaixasSimples', JSON.stringify([]));
			if (!localStorage.getItem('paramPresumido')) localStorage.setItem('paramPresumido', JSON.stringify([]));
			if (!localStorage.getItem('paramReal')) localStorage.setItem('paramReal', JSON.stringify([]));
			
			// Renomear chave de vendas para faturamento se existir (migração)
			if (localStorage.getItem('vendas') && !localStorage.getItem('faturamento')) {
				const vendas = JSON.parse(localStorage.getItem('vendas'));
				localStorage.setItem('faturamento', JSON.stringify(vendas));
				localStorage.removeItem('vendas');
			}
		}
		
		// Adicione esta função para inicializar os listeners de parametrização
		function initParametrizacaoListeners() {
			// Inicializar sub-tabs
			initSubTabs();
			// Botões de Simples Nacional
			const formFaixaSimples = document.getElementById('formFaixaSimples');
			if (formFaixaSimples) {
				formFaixaSimples.addEventListener('submit', salvarFaixaSimples);
			}
			
			const limparFaixaSimplesBtn = document.getElementById('limparFaixaSimples');
			if (limparFaixaSimplesBtn) {
				limparFaixaSimplesBtn.addEventListener('click', () => {
					const form = document.getElementById('formFaixaSimples');
					if (form) form.reset();
					const faixaId = document.getElementById('faixaId');
					if (faixaId) faixaId.value = '';
					calcularSomaReparticao();
				});
			}
			
			const cancelarFaixaSimplesBtn = document.getElementById('cancelarFaixaSimples');
			if (cancelarFaixaSimplesBtn) {
				cancelarFaixaSimplesBtn.addEventListener('click', limparFormularioSimples);
			}
			
			const novaFaixaSimplesBtn = document.getElementById('novaFaixaSimples');
			if (novaFaixaSimplesBtn) {
				novaFaixaSimplesBtn.addEventListener('click', toggleFormularioSimples);
			}
			
			// Lucro Presumido
			const formPresumido = document.getElementById('formPresumido');
			if (formPresumido) {
				formPresumido.addEventListener('submit', salvarConfigPresumido);
			}
			
			const limparPresumidoBtn = document.getElementById('limparPresumido');
			if (limparPresumidoBtn) {
				limparPresumidoBtn.addEventListener('click', limparFormularioPresumido);
			}
			
			const cancelarPresumidoBtn = document.getElementById('cancelarPresumido');
			if (cancelarPresumidoBtn) {
				cancelarPresumidoBtn.addEventListener('click', limparFormularioPresumido);
			}
			
			const novaConfigPresumidoBtn = document.getElementById('novaConfigPresumido');
			if (novaConfigPresumidoBtn) {
				novaConfigPresumidoBtn.addEventListener('click', toggleFormularioPresumido);
			}
			
			// Lucro Real
			const formReal = document.getElementById('formReal');
			if (formReal) {
				formReal.addEventListener('submit', salvarConfigReal);
			}
			
			const limparRealBtn = document.getElementById('limparReal');
			if (limparRealBtn) {
				limparRealBtn.addEventListener('click', limparFormularioReal);
			}
			
			const cancelarRealBtn = document.getElementById('cancelarReal');
			if (cancelarRealBtn) {
				cancelarRealBtn.addEventListener('click', limparFormularioReal);
			}
			
			const novaConfigRealBtn = document.getElementById('novaConfigReal');
			if (novaConfigRealBtn) {
				novaConfigRealBtn.addEventListener('click', toggleFormularioReal);
			}
			
			// Adicionar eventos para calcular soma da repartição
			const repCampos = ['repIRPJ', 'repCSLL', 'repCOFINS', 'repPIS', 'repCPP', 'repICMS', 'repISS', 'repIPI', 'repINSS'];
			repCampos.forEach(id => {
				const element = document.getElementById(id);
				if (element) {
					element.addEventListener('input', calcularSomaReparticao);
				}
			});
			
			// Calcular soma inicial
			calcularSomaReparticao();
		}

		// Atualizar a função window.onload para adicionar os novos listeners
		window.onload = function() {
			initApp();
			initAnexosMultiplos();
			initValoresAnexo();
			
			// Ocultar massa salarial inicialmente
			const massaSalarialInput = document.getElementById('massaSalarial');
			if (massaSalarialInput) {
			  massaSalarialInput.addEventListener('input', () => {
				// Atualizar total automaticamente se quiser
				atualizarTotalAnexos();
			  });
			}
			
			// Carregar dados
			carregarClientes();
			carregarSituacoes();
			carregarFaturamento();
			atualizarSelects();
			atualizarGraficoFaturamento();
			
			// Listeners principais
			document.getElementById('clienteForm').addEventListener('submit', salvarCliente);
			document.getElementById('situacaoForm').addEventListener('submit', salvarSituacao);
			document.getElementById('faturamentoForm').addEventListener('submit', salvarFaturamento);
			document.getElementById('limparSituacao').addEventListener('click', limparFormSituacao);
			document.getElementById('limparCliente').addEventListener('click', () => {
				document.getElementById('clienteForm').reset();
				const submitBtn = document.querySelector('#clienteForm button[type="submit"]');
				if (submitBtn) {
					submitBtn.innerHTML = 'Salvar';
					submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
					submitBtn.classList.add('bg-brand-600', 'hover:bg-brand-700');
				}
			});
			document.getElementById('tributacao').addEventListener('change', toggleAnexo);
			
			// Listener para limpar faturamento
			document.getElementById('limparFaturamento')?.addEventListener('click', () => {
				document.getElementById('faturamentoForm').reset();
				delete document.getElementById('faturamentoForm').dataset.editId;
				const submitBtn = document.querySelector('#faturamentoForm button[type="submit"]');
				if (submitBtn) {
					submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar Faturamento';
					submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
					submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
				}
			});
			
			// Listener para atualizar filtro de período do faturamento
			document.getElementById('filtroPeriodoFaturamento')?.addEventListener('change', carregarFaturamento);
			document.getElementById('atualizarFaturamento')?.addEventListener('click', carregarFaturamento);
			
			// Adicionar máscara ao campo CNPJ
			const cnpjInput = document.getElementById('cnpj');
			if (cnpjInput) {
				cnpjInput.addEventListener('input', function(e) {
					this.value = aplicarMascaraCNPJ(this.value);
					
					const cnpjLimpo = this.value.replace(/[^\d]/g, '');
					if (cnpjLimpo.length === 14) {
						const clienteExistente = verificarCNPJExistente(cnpjLimpo);
						const cnpjStatus = document.getElementById('cnpjStatus');
						
						if (clienteExistente) {
							cnpjStatus.innerHTML = `
								<div class="mt-1 text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
									<i class="fas fa-exclamation-triangle mr-1"></i>
									CNPJ já cadastrado para: <strong>${clienteExistente.nomeFantasia}</strong>
									<br>Clique em Salvar para atualizar os dados.
								</div>
							`;
						} else {
							cnpjStatus.innerHTML = `
								<div class="mt-1 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
									<i class="fas fa-check-circle mr-1"></i>
									CNPJ disponível para cadastro
								</div>
							`;
						}
					} else if (this.value.length > 0) {
						document.getElementById('cnpjStatus').innerHTML = `
							<div class="mt-1 text-xs text-gray-600">
								Digite os 14 dígitos do CNPJ
							</div>
						`;
					} else {
						document.getElementById('cnpjStatus').innerHTML = '';
					}
				});
				
				cnpjInput.addEventListener('blur', function(e) {
					const cnpjLimpo = this.value.replace(/[^\d]/g, '');
					if (cnpjLimpo.length === 14 && !validarCNPJ(cnpjLimpo)) {
						document.getElementById('cnpjStatus').innerHTML = `
							<div class="mt-1 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
								<i class="fas fa-times-circle mr-1"></i>
								CNPJ inválido. Verifique os dígitos.
							</div>
						`;
					}
				});
			}
			
			// Parametrização listeners - COM VERIFICAÇÃO DE EXISTÊNCIA
			setTimeout(() => {
				// Inicializar listeners básicos de parametrização
				initParametrizacaoListeners();
			}, 100); // Pequeno delay para garantir que o DOM está completamente carregado
			
			// Cálculo listener
			document.getElementById('calcularImpostos').addEventListener('click', calcularImpostosComVigencia);
			
			// Modal handlers
			document.getElementById('modalCancel').addEventListener('click', fecharModal);
			
			// Backup/Limpeza Listeners
			document.getElementById('exportarDados').addEventListener('click', exportarDados);
			document.getElementById('importarDadosBtn').addEventListener('click', () => document.getElementById('fileImport').click());
			document.getElementById('fileImport').addEventListener('change', importarDados);
			document.getElementById('limparTudo').addEventListener('click', confirmarLimparTudo);
			
			// Inicializar sistema de relatórios
			initRelatorios();
			
			// Carregar dados de parametrização
			carregarFaixasSimples();
			carregarConfigsPresumido();
			carregarConfigsReal();
			
			// Carregar a aba de faturamento por padrão
			switchTab('faturamento');
		};

        // --- 3. CLIENTES ---
        
        // --- FUNÇÕES DE VALIDAÇÃO DE CNPJ ---

		function aplicarMascaraCNPJ(cnpj) {
			// Remove tudo que não é número
			cnpj = cnpj.replace(/\D/g, '');
			
			// Aplica a máscara: 00.000.000/0000-00
			if (cnpj.length <= 2) {
				return cnpj;
			} else if (cnpj.length <= 5) {
				return cnpj.replace(/(\d{2})(\d{0,3})/, '$1.$2');
			} else if (cnpj.length <= 8) {
				return cnpj.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
			} else if (cnpj.length <= 12) {
				return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
			} else {
				return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
			}
		}

		function validarCNPJ(cnpj) {
			cnpj = cnpj.replace(/[^\d]/g, '');
			
			if (cnpj.length !== 14) return false;
			
			// Elimina CNPJs inválidos conhecidos
			if (/^(\d)\1+$/.test(cnpj)) return false;
			
			// Valida DVs
			let tamanho = cnpj.length - 2;
			let numeros = cnpj.substring(0, tamanho);
			const digitos = cnpj.substring(tamanho);
			let soma = 0;
			let pos = tamanho - 7;
			
			for (let i = tamanho; i >= 1; i--) {
				soma += numeros.charAt(tamanho - i) * pos--;
				if (pos < 2) pos = 9;
			}
			
			let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
			if (resultado !== parseInt(digitos.charAt(0), 10)) return false;
			
			tamanho = tamanho + 1;
			numeros = cnpj.substring(0, tamanho);
			soma = 0;
			pos = tamanho - 7;
			
			for (let i = tamanho; i >= 1; i--) {
				soma += numeros.charAt(tamanho - i) * pos--;
				if (pos < 2) pos = 9;
			}
			
			resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
			if (resultado !== parseInt(digitos.charAt(1), 10)) return false;
			
			return true;
		}

		function verificarCNPJExistente(cnpj) {
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
			return clientes.find(cliente => cliente.cnpj === cnpjLimpo);
		}

		// --- ATUALIZAÇÃO DA FUNÇÃO salvarCliente ---

		function salvarCliente(e) {
			e.preventDefault();
			
			const cnpjInput = document.getElementById('cnpj');
			const cnpjComMascara = cnpjInput.value;
			const cnpjLimpo = cnpjComMascara.replace(/[^\d]/g, '');
			
			// Validação do CNPJ
			if (cnpjLimpo.length !== 14) {
				mostrarMensagem("CNPJ deve conter 14 dígitos.", 'error');
				return;
			}
			
			if (!validarCNPJ(cnpjLimpo)) {
				mostrarMensagem("CNPJ inválido. Verifique os dígitos.", 'error');
				return;
			}
			
			const nome = document.getElementById('nomeFantasia').value.trim();
			const razao = document.getElementById('razaoSocial').value.trim();
			const dataAb = document.getElementById('dataAbertura').value;
			
			if (!nome || !razao || !dataAb) {
				mostrarMensagem("Preencha todos os campos obrigatórios.", 'error');
				return;
			}
			
			let clientes = JSON.parse(localStorage.getItem('clientes'));
			const existenteIdx = clientes.findIndex(c => c.cnpj === cnpjLimpo);
			
			const clienteData = { 
				cnpj: cnpjLimpo, 
				nomeFantasia: nome, 
				razaoSocial: razao, 
				dataAbertura: dataAb, 
				ie: document.getElementById('ie').value.trim(),
				im: document.getElementById('im').value.trim(),
				dataAtualizacao: new Date().toISOString()
			};
			
			// Se o cliente já existe, perguntar se deseja atualizar
			if (existenteIdx >= 0) {
				const clienteExistente = clientes[existenteIdx];
				
				// Formatar data de abertura para exibição
				const dataAberturaFormatada = formatarData(clienteExistente.dataAbertura);
				
				mostrarModalConfirmacao(
					"Cliente já cadastrado", 
					`O CNPJ <strong>${cnpjComMascara}</strong> já está cadastrado para:<br><br>
					<div class="text-left">
						<div class="mb-2">
							<span class="font-semibold">Empresa:</span> ${clienteExistente.nomeFantasia}
						</div>
						<div class="mb-2">
							<span class="font-semibold">Razão Social:</span> ${clienteExistente.razaoSocial || 'Não informada'}
						</div>
						<div class="mb-2">
							<span class="font-semibold">Abertura:</span> ${dataAberturaFormatada}
						</div>
						<div class="mt-4 text-sm text-gray-600">
							Deseja atualizar os dados deste cliente?
						</div>
					</div>`,
					() => {
						// Atualizar cliente existente
						clienteData.dataCadastro = clienteExistente.dataCadastro || new Date().toISOString();
						clientes[existenteIdx] = clienteData;
						localStorage.setItem('clientes', JSON.stringify(clientes));
						document.getElementById('clienteForm').reset();
						carregarClientes();
						atualizarSelects();
						
						// Resetar botão
						const submitBtn = document.querySelector('#clienteForm button[type="submit"]');
						if (submitBtn) {
							submitBtn.innerHTML = 'Salvar';
							submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
							submitBtn.classList.add('bg-brand-600', 'hover:bg-brand-700');
						}
						
						mostrarMensagem('Cliente atualizado com sucesso!');
					},
					false,
					true // Permitir HTML na mensagem
				);
			} else {
				// Adicionar novo cliente
				clienteData.dataCadastro = new Date().toISOString();
				clientes.push(clienteData);
				localStorage.setItem('clientes', JSON.stringify(clientes));
				document.getElementById('clienteForm').reset();
				carregarClientes();
				atualizarSelects();
				mostrarMensagem('Cliente cadastrado com sucesso!');
			}			
		}

		// --- ATUALIZAÇÃO DA FUNÇÃO carregarClientes com botão de excluir ---

		function carregarClientes() {
			try {
				console.log('carregarClientes() chamada');
				
				const listaClientes = document.getElementById('listaClientes');
				if (!listaClientes) {
					console.error('Elemento listaClientes não encontrado no DOM');
					return;
				}
				
				const clientesStr = localStorage.getItem('clientes');
				if (!clientesStr) {
					listaClientes.innerHTML = '<div class="placeholder"><p>Nenhum cliente cadastrado ainda.</p></div>';
					console.log('Nenhum dado no localStorage para clientes');
                    // Atualizar o contador para 0 se não houver clientes
                    const totalBadge = document.getElementById('totalClientesBadge');
                    if (totalBadge) totalBadge.innerText = '0';
					return;
				}
				
				let clientes;
				try {
					clientes = JSON.parse(clientesStr);
				} catch (parseError) {
					console.error('Erro ao fazer parse dos clientes:', parseError);
					listaClientes.innerHTML = '<div class="placeholder"><p>Erro ao carregar dados dos clientes.</p></div>';
					return;
				}
				
				if (!Array.isArray(clientes)) {
					console.error('Dados de clientes não são um array:', typeof clientes);
					listaClientes.innerHTML = '<div class="placeholder"><p>Formato de dados inválido.</p></div>';
					return;
				}
				
				if (clientes.length === 0) {
					listaClientes.innerHTML = '<div class="placeholder"><p>Nenhum cliente cadastrado ainda.</p></div>';
					console.log('Array de clientes vazio');
                    // Atualizar o contador para 0
                    const totalBadge = document.getElementById('totalClientesBadge');
                    if (totalBadge) totalBadge.innerText = '0';
					return;
				}
				
				// Filtrar apenas clientes válidos
				const clientesValidos = clientes.filter(cliente => {
					return cliente && 
						   typeof cliente === 'object' &&
						   cliente.cnpj && 
						   cliente.nomeFantasia && 
						   cliente.razaoSocial;
				});

                // --- FIX: Atualizar contador de clientes ---
                const totalBadge = document.getElementById('totalClientesBadge');
                if (totalBadge) totalBadge.innerText = clientesValidos.length;
				
				if (clientesValidos.length === 0) {
					listaClientes.innerHTML = '<div class="placeholder"><p>Nenhum cliente válido encontrado.</p></div>';
					console.log('Nenhum cliente válido após filtro');
					return;
				}
				
				console.log(`${clientesValidos.length} clientes válidos encontrados`);
				
				// Ordenar por nome fantasia
				clientesValidos.sort((a, b) => {
					const nomeA = a.nomeFantasia || '';
					const nomeB = b.nomeFantasia || '';
					return nomeA.localeCompare(nomeB, 'pt-BR');
				});
				
				listaClientes.innerHTML = '';
				
				clientesValidos.forEach((cliente, index) => {
					try {
						const cnpjFormatado = formatarCNPJ(cliente.cnpj);
						const dataAberturaFormatada = formatarData(cliente.dataAbertura);
						const dataCadastroFormatada = formatarDataHora(cliente.dataCadastro);
						
						const item = document.createElement('div');
						// --- FIX: Usando Tailwind 'group' e 'group-hover' para controlar visibilidade dos botões ---
						item.className = 'group p-4 rounded-lg border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all duration-200 relative bg-white shadow-sm';
						item.dataset.index = index;
						item.innerHTML = `
							<div class="flex justify-between items-start">
                                <div class="space-y-1 w-full">
                                     <div class="flex items-center gap-2">
                                        <h4 class="font-bold text-gray-800 text-base">${cliente.nomeFantasia || 'Sem nome'}</h4>
                                        <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200">${cnpjFormatado}</span>
                                     </div>
                                     <p class="text-xs text-gray-500 font-medium">${cliente.razaoSocial || 'Razão Social não informada'}</p>
                                     
                                     <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                                        <span><i class="far fa-calendar-alt w-4"></i> Abertura: ${dataAberturaFormatada}</span>
                                        <span><i class="far fa-clock w-4"></i> Cadastro: ${dataCadastroFormatada}</span>
                                        <span><i class="fas fa-id-card w-4"></i> IE: ${cliente.ie || '-'}</span>
                                        <span><i class="fas fa-map-marker-alt w-4"></i> IM: ${cliente.im || '-'}</span>
                                     </div>
                                </div>
                                
                                <!-- Container de botões com opacidade controlada pelo hover do grupo -->
                                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm border border-gray-100">
                                    <button onclick="editarCliente('${cliente.cnpj}')" class="text-brand-600 hover:text-brand-700 hover:bg-brand-50 p-2 rounded-md transition-colors" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="excluirCliente('${cliente.cnpj}')" class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-md transition-colors" title="Excluir">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </div>
						`;
						listaClientes.appendChild(item);
					} catch (itemError) {
						console.error(`Erro ao criar item para cliente ${index}:`, itemError);
					}
				});
				
				// Atualizar selects automaticamente
				atualizarSelects();
				
			} catch (error) {
				console.error('Erro em carregarClientes:', error);
				const listaClientes = document.getElementById('listaClientes');
				if (listaClientes) {
					listaClientes.innerHTML = `
						<div class="placeholder">
							<p>Erro ao carregar clientes.</p>
							<button class="btn-secondary" onclick="carregarClientes()">
								<i class="fas fa-sync-alt"></i> Tentar novamente
							</button>
						</div>
					`;
				}
			}
		}

		// --- FUNÇÃO PARA EXCLUIR CLIENTE ---

		function excluirCliente(cnpj) {
			// Verificar se o cliente tem situações ou vendas associadas
			const situacoes = JSON.parse(localStorage.getItem('situacoes')) || [];
			const faturamento = JSON.parse(localStorage.getItem('faturamento')) || [];
			
			const situacoesAssociadas = situacoes.filter(s => s.cnpjEmpresa === cnpj);
			const vendasAssociadas = faturamento.filter(v => v.cnpj === cnpj);
			
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const cliente = clientes.find(c => c.cnpj === cnpj);
			
			if (!cliente) return;
			
			const cnpjFormatado = cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
			
			let mensagem = `Tem certeza que deseja excluir o cliente:<br><br>
						   <div class="text-left">
							   <div class="mb-1"><strong>${cliente.nomeFantasia}</strong></div>
							   <div class="text-sm text-gray-600">CNPJ: ${cnpjFormatado}</div>
						   </div>`;
			
			if (situacoesAssociadas.length > 0 || vendasAssociadas.length > 0) {
				mensagem += `<br><div class="text-left text-red-600 text-sm font-medium mt-2">Atenção:</div>
							 <div class="text-left text-sm text-gray-700">
								Este cliente possui registros associados:
								<ul class="list-disc pl-4 mt-1">`;
				if (situacoesAssociadas.length > 0) {
					mensagem += `<li>${situacoesAssociadas.length} registro(s) de situação tributária</li>`;
				}
				if (vendasAssociadas.length > 0) {
					mensagem += `<li>${vendasAssociadas.length} registro(s) de venda</li>`;
				}
				mensagem += `</ul>
							 <div class="mt-2">A exclusão removerá também todos esses registros associados.</div>
							 </div>`;
			}
			
			mostrarModalConfirmacao("Excluir Cliente", mensagem, () => {
				// Remover cliente
				let clientesAtualizados = JSON.parse(localStorage.getItem('clientes'));
				clientesAtualizados = clientesAtualizados.filter(c => c.cnpj !== cnpj);
				localStorage.setItem('clientes', JSON.stringify(clientesAtualizados));
				
				// Remover situações associadas
				let situacoesAtualizadas = JSON.parse(localStorage.getItem('situacoes'));
				situacoesAtualizadas = situacoesAtualizadas.filter(s => s.cnpjEmpresa !== cnpj);
				localStorage.setItem('situacoes', JSON.stringify(situacoesAtualizadas));
				
				// Remover vendas associadas
				let vendasAtualizadas = JSON.parse(localStorage.getItem('vendas'));
				vendasAtualizadas = vendasAtualizadas.filter(v => v.cnpj !== cnpj);
				localStorage.setItem('vendas', JSON.stringify(vendasAtualizadas));
				
				carregarClientes();
				carregarSituacoes();
				carregarVendas();
				atualizarSelects();
				mostrarMensagem("Cliente excluído com sucesso!", 'success');
			}, false, true);
		}

		// --- ATUALIZAÇÃO DA FUNÇÃO editarCliente ---

		function editarCliente(cnpj) {
			const clientes = JSON.parse(localStorage.getItem('clientes'));
			const c = clientes.find(x => x.cnpj === cnpj);
			if(c) {
				// Formatar CNPJ para exibição
				const cnpjFormatado = c.cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
				
				document.getElementById('cnpj').value = cnpjFormatado;
				document.getElementById('nomeFantasia').value = c.nomeFantasia;
				document.getElementById('razaoSocial').value = c.razaoSocial;
				document.getElementById('dataAbertura').value = c.dataAbertura;
				document.getElementById('ie').value = c.ie || '';
				document.getElementById('im').value = c.im || '';
				
				// Alterar texto do botão para indicar edição
				const submitBtn = document.querySelector('#clienteForm button[type="submit"]');
				if (submitBtn) {
					submitBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Atualizar Cliente';
					submitBtn.classList.remove('bg-brand-600', 'hover:bg-brand-700');
					submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
				}
				
				switchTab('cliente');
				
				// Mostrar informações sobre o cliente
				const infoDiv = document.createElement('div');
				infoDiv.className = 'mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800';
				infoDiv.innerHTML = `
					<i class="fas fa-info-circle mr-1"></i>
					Editando cliente cadastrado em ${formatarData(c.dataCadastro || c.dataAbertura)}
				`;
				
				// Remover qualquer mensagem anterior
				const existingInfo = document.querySelector('#clienteForm .edit-info');
				if (existingInfo) existingInfo.remove();
				
				infoDiv.classList.add('edit-info');
				document.getElementById('clienteForm').appendChild(infoDiv);
			}
		}

        // --- 4. SITUAÇÕES ---
			function toggleAnexo() {
			const tipo = document.getElementById('tributacao').value;
			const container = document.getElementById('anexosContainer');  // ← CORRIGIDO: plural
			if (!container) return; // Proteção extra
			
			if (tipo === 'simples') {
				container.classList.remove('hidden');
			} else {
				container.classList.add('hidden');
			}
		}

		// Gerenciar anexos múltiplos
		function initAnexosMultiplos() {
		  const container = document.getElementById('anexosContainer');
		  const addBtn = document.getElementById('addAnexo');
		  
		  addBtn.addEventListener('click', () => {
			const novoItem = document.createElement('div');
			novoItem.className = 'anexo-item flex items-end gap-3 p-3 bg-gray-100 rounded-lg';
			novoItem.innerHTML = `
			  <select class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm bg-white" required>
				<option value="">Selecione Anexo</option>
				<option value="I">Anexo I - Comércio</option>
				<option value="II">Anexo II - Indústria</option>
				<option value="III">Anexo III - Serviços</option>
				<option value="IV">Anexo IV - Serviços</option>
				<option value="V">Anexo V - Serviços</option>
			  </select>
			  <input type="text" class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm" placeholder="Atividades">
			  <button type="button" class="text-red-500 hover:text-red-700 p-2">
				<i class="fas fa-trash-alt"></i>
			  </button>
			`;
			
			// Remover item
			novoItem.querySelector('button').addEventListener('click', () => {
			  if (container.children.length > 1) {
				novoItem.remove();
			  }
			});
			
			container.appendChild(novoItem);
		  });
		}

		function getAnexosData() {
		  const container = document.getElementById('anexosContainer');
		  const anexos = [];
		  container.querySelectorAll('.anexo-item').forEach(item => {
			const select = item.querySelector('select');
			const input = item.querySelector('input');
			if (select.value) {
			  anexos.push({
				anexo: select.value,
				atividades: input.value.trim()
			  });
			}
		  });
		  return anexos;
		}

        function salvarSituacao(e) {
            e.preventDefault();
            
            const id = document.getElementById('situacaoId').value;
            const cnpjEmpresa = document.getElementById('cnpjEmpresa').value;
            const dataSituacao = document.getElementById('dataSituacao').value;
            const tributacao = document.getElementById('tributacao').value;
            const endereco = document.getElementById('endereco').value;
            
            const clientes = JSON.parse(localStorage.getItem('clientes'));
            const empresa = clientes.find(c => c.cnpj === cnpjEmpresa);
            
            if (!empresa) { mostrarMensagem("Empresa inválida. Atualize a página se necessário.", 'error'); return; }
            
            // Validação Data Abertura
            if (dataSituacao < empresa.dataAbertura) {
                mostrarModalConfirmacao("Data Inválida", 
                    `A situação (${formatarData(dataSituacao)}) não pode ser anterior à abertura da empresa (${formatarData(empresa.dataAbertura)}).`, 
                    null, true 
                );
                return;
            }

            let situacoes = JSON.parse(localStorage.getItem('situacoes'));

            // Verificação de Duplicidade Inteligente
            const conflito = situacoes.find(s => 
                s.cnpjEmpresa === cnpjEmpresa && 
                s.dataSituacao === dataSituacao &&
                s.id !== id 
            );

            if (conflito) {
                mostrarModalConfirmacao("Conflito de Data", 
                    `Já existe uma situação em ${formatarData(dataSituacao)}. Deseja sobrescrever os dados existentes e apagar o registro em edição/criação?`, 
                    () => {
                        // Ação de Sobrescrita (Merge)
                        const dadosNovos = {
                             cnpjEmpresa,
                             dataSituacao,
                             tributacao,
                             endereco,
                             anexos: tributacao === 'simples' ? getAnexosData() : [],                             
                        };
                        
                        // Atualiza o registro conflitante com os dados do formulário
                        Object.assign(conflito, dadosNovos);
                        
                        // Remove o registro que estávamos editando/criando (se for diferente)
                        if (id && id !== conflito.id) {
                            situacoes = situacoes.filter(s => s.id !== id);
                        }
                        
                        // Garante que a lista principal está atualizada (importante se houve filtragem)
                        const index = situacoes.findIndex(s => s.id === conflito.id);
                        if(index !== -1) situacoes[index] = conflito;
                        
                        finalizarSalvamentoSituacao(situacoes);
                    }
                );
                return;
            }
            
            // Sem conflito ou em edição
            const novaSituacao = {
                id: id || Date.now().toString(),
                cnpjEmpresa,
                dataSituacao,
                tributacao,
                endereco,
                anexos: tributacao === 'simples' ? getAnexosData() : [],                
            };

            if (id) {
                const idx = situacoes.findIndex(s => s.id === id);
                if (idx !== -1) situacoes[idx] = novaSituacao;
            } else {
                situacoes.push(novaSituacao);
            }
            
            finalizarSalvamentoSituacao(situacoes);
        }

        function finalizarSalvamentoSituacao(listaAtualizada) {
            localStorage.setItem('situacoes', JSON.stringify(listaAtualizada));
            limparFormSituacao();
            carregarSituacoes();
            mostrarMensagem("Situação salva com sucesso!");
        }

        function limparFormSituacao() {
            document.getElementById('situacaoForm').reset();
            document.getElementById('situacaoId').value = '';
            const anexosContainer = document.getElementById('anexosContainer');
				if (anexosContainer) anexosContainer.classList.add('hidden');

            
            // UI Reset
            const title = document.getElementById('tituloSituacao');
            title.innerHTML = '<i class="fas fa-file-contract text-orange-500"></i> Registrar Situação';
            document.querySelector('.btn-submit').innerText = "Registrar";
            document.querySelector('.btn-submit').classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            document.querySelector('.btn-submit').classList.add('bg-orange-600', 'hover:bg-orange-700');
        }

        function carregarSituacoes() {
            const situacoes = JSON.parse(localStorage.getItem('situacoes')) || [];
            const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
            const lista = document.getElementById('listaSituacoes');
            lista.innerHTML = '';
            
            // Ordenar: Mais recente primeiro
            situacoes.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));

            if(situacoes.length === 0) {
                lista.innerHTML = '<div class="text-center p-4 text-gray-400">Nenhum registro.</div>';
                return;
            }

            situacoes.forEach(s => {
                const emp = clientes.find(c => c.cnpj === s.cnpjEmpresa);
                const nomeEmpresa = emp ? emp.nomeFantasia : 'Empresa Excluída';
                
                let badgeColor = 'bg-blue-100 text-blue-800';
                if(s.tributacao === 'simples') badgeColor = 'bg-green-100 text-green-800';
                if(s.tributacao === 'presumido') badgeColor = 'bg-yellow-100 text-yellow-800';
                
                const card = document.createElement('div');
                card.className = "bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col md:flex-row justify-between gap-4";
                card.innerHTML = `
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="font-bold text-gray-800">${nomeEmpresa}</span>
                            <span class="text-xs px-2 py-0.5 rounded-full ${badgeColor} capitalize">${s.tributacao}</span>
                        </div>
                        <div class="text-sm text-gray-600 flex items-center gap-4">
                            <span><i class="far fa-calendar-alt mr-1"></i> ${formatarData(s.dataSituacao)}</span>
                           ${s.anexos && Array.isArray(s.anexos) && s.anexos.length > 0 ? `
							<div class="flex flex-wrap gap-1 mt-1">
								${s.anexos.map(anexo => `
									<span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
										${anexo.anexo} ${anexo.atividades ? `(${anexo.atividades.substring(0,20)}${anexo.atividades.length > 20 ? '...' : ''})` : ''}
									</span>
								`).join('')}
							</div>
						` : s.anexo ? `<span><i class="fas fa-tag mr-1"></i> Anexo ${s.anexo}</span>` : ''}
                        </div>
                        <div class="text-xs text-gray-500 mt-2"><i class="fas fa-map-marker-alt mr-1"></i> ${s.endereco}</div>
                    </div>
                    <div class="flex items-center gap-2">
                         <button onclick="editarSituacao('${s.id}')" class="text-brand-600 hover:bg-brand-50 p-2 rounded border border-transparent hover:border-brand-100"><i class="fas fa-pencil-alt"></i></button>
                         <button onclick="deletarSituacao('${s.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded border border-transparent hover:border-red-100"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                lista.appendChild(card);
            });
        }
		
		function createAnexoItem() {
			const div = document.createElement('div');
			div.className = 'anexo-item flex items-end gap-3 p-3 bg-gray-100 rounded-lg';
			div.innerHTML = `
				<select class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm bg-white" required>
					<option value="">Selecione Anexo</option>
					<option value="I">Anexo I - Comércio</option>
					<option value="II">Anexo II - Indústria</option>
					<option value="III">Anexo III - Serviços</option>
					<option value="IV">Anexo IV - Serviços</option>
					<option value="V">Anexo V - Serviços</option>
				</select>
				<input type="text" class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm" placeholder="Atividades">
				<button type="button" class="text-red-500 hover:text-red-700 p-2">
					<i class="fas fa-trash-alt"></i>
				</button>
			`;
			
			div.querySelector('button').addEventListener('click', () => {
				const container = document.getElementById('anexosContainer');
				if(container.children.length > 1) {
					div.remove();
				}
			});
			
			return div;
		}

        function editarSituacao(id) {
            const situacoes = JSON.parse(localStorage.getItem('situacoes'));
            const s = situacoes.find(x => x.id === id);
            if(!s) return;
            
            document.getElementById('situacaoId').value = s.id;
            document.getElementById('cnpjEmpresa').value = s.cnpjEmpresa;
            document.getElementById('dataSituacao').value = s.dataSituacao;
            document.getElementById('tributacao').value = s.tributacao;
            document.getElementById('endereco').value = s.endereco;
            
            toggleAnexo(); 
			if(s.tributacao === 'simples') {
				// Limpar container atual
				const container = document.getElementById('anexosContainer');
				container.innerHTML = '';
				
				// Carregar múltiplos anexos
				if(s.anexos && Array.isArray(s.anexos) && s.anexos.length > 0) {
					s.anexos.forEach(anexo => {
						const novoItem = document.createElement('div');
						novoItem.className = 'anexo-item flex items-end gap-3 p-3 bg-gray-100 rounded-lg';
						novoItem.innerHTML = `
							<select class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm bg-white" required>
								<option value="">Selecione Anexo</option>
								<option value="I">Anexo I - Comércio</option>
								<option value="II">Anexo II - Indústria</option>
								<option value="III">Anexo III - Serviços</option>
								<option value="IV">Anexo IV - Serviços</option>
								<option value="V">Anexo V - Serviços</option>
							</select>
							<input type="text" class="flex-1 border border-blue-200 rounded-lg p-2.5 text-sm" placeholder="Atividades" value="${anexo.atividades || ''}">
							<button type="button" class="text-red-500 hover:text-red-700 p-2">
								<i class="fas fa-trash-alt"></i>
							</button>
						`;
						novoItem.querySelector('select').value = anexo.anexo;
						
						// Evento remover
						novoItem.querySelector('button').addEventListener('click', () => {
							if(container.children.length > 1) {
								novoItem.remove();
							}
						});
						
						container.appendChild(novoItem);
					});
				} else {
					// Criar um item vazio se não houver anexos
					const itemVazio = createAnexoItem();
					container.appendChild(itemVazio);
				}
			}
            
            // Visual Update
            const title = document.getElementById('tituloSituacao');
            title.innerHTML = '<i class="fas fa-edit text-yellow-600"></i> Editando Situação';
            const btn = document.querySelector('.btn-submit');
            btn.innerText = "Salvar Alterações";
            btn.classList.remove('bg-orange-600', 'hover:bg-orange-700');
            btn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            
            document.getElementById('situacaoForm').scrollIntoView({behavior: 'smooth'});
        }
        
        function deletarSituacao(id) {
             mostrarModalConfirmacao("Excluir Registro", "Deseja excluir permanentemente este registro de situação?", () => {
                 let situacoes = JSON.parse(localStorage.getItem('situacoes'));
                 situacoes = situacoes.filter(s => s.id !== id);
                 localStorage.setItem('situacoes', JSON.stringify(situacoes));
                 carregarSituacoes();
                 mostrarMensagem("Excluído com sucesso");
             });
        }

        // --- 5. VENDAS ---
        // Função para salvar faturamento (antiga salvarVendas)
	//	function salvarFaturamento(e) {
	//		e.preventDefault();			
	//		const cnpj = document.getElementById('cnpjFaturamento').value;
	//		const mes = document.getElementById('mesFaturamento').value;
	//		const valor = parseFloat(document.getElementById('valorFaturamento').value);
			
	//		if (isNaN(valor) || valor < 0) {
	//			mostrarMensagem("Valor do faturamento inválido.", 'error');
	//			return;
	//		}

	//		let faturamentos = JSON.parse(localStorage.getItem('faturamento')) || [];
			
			// Remove existente do mesmo mês para sobrescrever
	//		faturamentos = faturamentos.filter(v => !(v.cnpj === cnpj && v.mes === mes));
			
	//		faturamentos.push({ id: Date.now().toString(), cnpj, mes, valor, valoresAnexo: getValoresAnexoData(), });
	//		localStorage.setItem('faturamento', JSON.stringify(faturamentos));
	//		document.getElementById('faturamentoForm').reset();
	//		carregarFaturamento();
	//		atualizarGraficoFaturamento();
	//		mostrarMensagem("Faturamento registrado!");
	//	}
		
		function initValoresAnexo() {
		  const empresaSelect = document.getElementById('cnpjFaturamento');
		  const detalharBtn = document.getElementById('addValorAnexo');
		  const container = document.getElementById('valoresAnexoContainer');
		  const valorTotal = document.getElementById('valorFaturamento');
		  
		  if (!empresaSelect || !detalharBtn || !container || !valorTotal) return;
					  
			// Mostrar/ocultar baseado na situação do Simples e múltiplos anexos
			empresaSelect.addEventListener('change', () => {
			  const cnpj = empresaSelect.value;
			  if (clienteHasMultipleAnexos(cnpj)) {
				container.classList.remove('hidden');
			  } else {
				container.classList.add('hidden');
				container.innerHTML = ''; // Limpar itens
			  }
			});

		  
		  detalharBtn.addEventListener('click', () => {
			container.classList.remove('hidden');
			const novoItem = createValorAnexoItem();
			container.appendChild(novoItem);
			atualizarTotalAnexos();
		  });
		  
		  valorTotal.addEventListener('input', atualizarTotalAnexos);
		}

		function createValorAnexoItem() {
		  const div = document.createElement('div');
		  div.className = 'valor-anexo-item flex items-end gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200';
		  div.innerHTML = `
			<select class="flex-1 border border-emerald-200 rounded-lg p-2.5 text-sm bg-white">
			  <option value="">Anexo</option>
			  <option value="I">Anexo I</option>
			  <option value="II">Anexo II</option>
			  <option value="III">Anexo III</option>
			  <option value="IV">Anexo IV</option>
			  <option value="V">Anexo V</option>
			</select>
			<input type="number" step="0.01" min="0" class="flex-1 border border-emerald-200 rounded-lg p-2.5 text-sm font-medium text-emerald-800" placeholder="R$ 0,00">
			<button type="button" class="text-red-500 hover:text-red-700 p-2">
			  <i class="fas fa-trash-alt"></i>
			</button>
		  `;
		  
		  div.querySelector('input').addEventListener('input', atualizarTotalAnexos);
		  div.querySelector('button').addEventListener('click', () => {
			if (document.querySelectorAll('.valor-anexo-item').length > 1) {
			  div.remove();
			  atualizarTotalAnexos();
			}
		  });
		  
		  return div;
		}

		function atualizarTotalAnexos() {
		  let soma = 0;
		  document.querySelectorAll('.valor-anexo-item input').forEach(input => {
			soma += parseFloat(input.value) || 0;
		  });
		  document.getElementById('valorFaturamento').value = soma.toFixed(2);
		}

		function getValoresAnexoData() {
		  const container = document.getElementById('valoresAnexoContainer');
		  if (!container) return [];

		  const valores = [];
		  container.querySelectorAll('.valor-anexo-item').forEach(item => {
			const select = item.querySelector('select');
			const input = item.querySelector('input');
			const valor = parseFloat(input.value.replace(',', '.')) || 0;

			if (select && select.value && valor > 0) {
			  valores.push({
				anexo: select.value,
				valor: valor
			  });
			}
		  });

		  return valores;
		}

		function clienteHasMultipleAnexos(cnpj) {
		  const situacoes = JSON.parse(localStorage.getItem('situacoes') || '[]');
		  const ultimaSituacao = situacoes
			.filter(s => s.cnpjEmpresa === cnpj && s.tributacao === 'simples')
			.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao))[0];

		  return ultimaSituacao && Array.isArray(ultimaSituacao.anexos) && ultimaSituacao.anexos.length > 1;
		}


		// Função para carregar faturamento (antiga carregarVendas)
		function carregarFaturamento() {
			const faturamentos = JSON.parse(localStorage.getItem('faturamento')) || [];
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const lista = document.getElementById('listaFaturamento');
			const filtroPeriodo = document.getElementById('filtroPeriodoFaturamento')?.value || '3';
			
			lista.innerHTML = '';
			
			// Filtrar por período
			let faturamentosFiltrados = [...faturamentos];
			if (filtroPeriodo !== 'todos') {
				const meses = parseInt(filtroPeriodo);
				const dataLimite = new Date();
				dataLimite.setMonth(dataLimite.getMonth() - meses);
				
				faturamentosFiltrados = faturamentosFiltrados.filter(f => {
					const dataFaturamento = new Date(f.mes + '-01');
					return dataFaturamento >= dataLimite;
				});
			}
			
			// Ordena por data (mês)
			faturamentosFiltrados.sort((a, b) => new Date(b.mes + '-01') - new Date(a.mes + '-01'));

			if (faturamentosFiltrados.length === 0) {
				lista.innerHTML = '<div class="text-center p-4 text-gray-400">Nenhum registro de faturamento encontrado.</div>';
				return;
			}
			
			faturamentosFiltrados.forEach(f => {
				const emp = clientes.find(c => c.cnpj === f.cnpj);
				if(!emp) return;
				
				// Formatar mês para exibição
				const [ano, mes] = f.mes.split('-');
				const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
				const mesFormatado = `${meses[parseInt(mes) - 1]}/${ano}`;
				
				// Calcular variação em relação ao mês anterior
				let variacao = null;
				const mesAnterior = getMesAnterior(f.mes);
				const faturamentoAnterior = faturamentos.find(fa => fa.cnpj === f.cnpj && fa.mes === mesAnterior);
				
				if (faturamentoAnterior) {
					const variacaoPercentual = ((f.valor - faturamentoAnterior.valor) / faturamentoAnterior.valor) * 100;
					variacao = variacaoPercentual.toFixed(1);
				}
				
				const div = document.createElement('div');
				div.className = "bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col hover:shadow-md transition";
				div.innerHTML = `
					<div class="flex justify-between items-start mb-2">
						<div>
							<h4 class="font-bold text-gray-800 truncate">${emp.nomeFantasia}</h4>
							<p class="text-sm text-gray-500">${mesFormatado}</p>
						</div>
						<div class="text-right">
							<p class="text-xl font-bold text-green-600">${formatarMoeda(f.valor)}</p>
							${variacao !== null ? `
								<p class="text-xs ${parseFloat(variacao) >= 0 ? 'text-green-500' : 'text-red-500'}">
									${parseFloat(variacao) >= 0 ? '↗' : '↘'} ${Math.abs(parseFloat(variacao))}%
								</p>
							` : ''}
						</div>
					</div>
					${f.valoresAnexo && f.valoresAnexo.length > 0 ? `
						<div class="mt-2 pt-2 border-t border-gray-100">
							<span class="text-xs text-gray-500 block mb-1">Por Anexo:</span>
							<div class="flex flex-wrap gap-1">
								${f.valoresAnexo.map(v => `
									<span class="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
										${v.anexo}: ${formatarMoeda(v.valor)}
									</span>
								`).join('')}
							</div>
						</div>
					` : ''}
					${f.massaSalarial ? `
					  <div class="mt-2 p-2 bg-purple-50 border border-purple-100 rounded">
						<span class="text-xs text-purple-700 font-medium">Massa Salarial:</span>
						<span class="text-sm font-bold text-purple-800 ml-2">${formatarMoeda(f.massaSalarial)}</span>
					  </div>
					` : ''}					
					<div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
						<span class="text-xs text-gray-500">CNPJ: ${formatarCNPJ(f.cnpj)}</span>
						<button onclick="editarFaturamento('${f.id}')" class="text-brand-600 hover:bg-brand-50 p-1.5 rounded text-sm">
							<i class="fas fa-edit mr-1"></i> Editar
						</button>
					</div>
				`;
				lista.appendChild(div);
			});
		}

		// Função auxiliar para obter mês anterior
		function getMesAnterior(mesAtual) {
			const [ano, mes] = mesAtual.split('-').map(Number);
			let mesAnterior = mes - 1;
			let anoAnterior = ano;
			
			if (mesAnterior === 0) {
				mesAnterior = 12;
				anoAnterior = ano - 1;
			}
			
			return `${anoAnterior}-${mesAnterior.toString().padStart(2, '0')}`;
		}

		// Função para editar faturamento
		function editarFaturamento(id) {
		  const faturamentos = JSON.parse(localStorage.getItem('faturamento') || '[]');
		  const faturamento = faturamentos.find(f => f.id === id);
		  if (!faturamento) return;

		  document.getElementById('cnpjFaturamento').value = faturamento.cnpj;
		  document.getElementById('mesFaturamento').value = faturamento.mes;
		  document.getElementById('valorFaturamento').value = faturamento.valor;

		  const form = document.getElementById('faturamentoForm');
		  form.dataset.editId = id;

		  const submitBtn = document.querySelector('#faturamentoForm button[type="submit"]');
		  if (submitBtn) {
			submitBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i> Atualizar Faturamento';
			submitBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
			submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
		  }

		  // Reconstruir valores por anexo
		  const container = document.getElementById('valoresAnexoContainer');
		  const detalharBtn = document.getElementById('addValorAnexo');
		  if (container && detalharBtn) {
			container.innerHTML = '';
			if (faturamento.valoresAnexo && faturamento.valoresAnexo.length > 0) {
			  container.classList.remove('hidden');
			  faturamento.valoresAnexo.forEach(v => {
				const div = createValorAnexoItem();
				const select = div.querySelector('select');
				const input = div.querySelector('input');
				if (select) select.value = v.anexo;
				if (input) input.value = v.valor;
				container.appendChild(div);
			  });
			} else {
			  container.classList.add('hidden');
			}
		  }

		  switchTab('faturamento');
		  document.getElementById('faturamentoForm').scrollIntoView({ behavior: 'smooth' });
		  mostrarMensagem('Faturamento carregado para edição', 'warning');
		}
		
		// Calcular Fator R para empresa específica
		function calcularFatorR(cnpj, mesReferencia) {
		  const faturamentos = JSON.parse(localStorage.getItem('faturamento') || '[]');
		  const situacoes = JSON.parse(localStorage.getItem('situacoes') || '[]');
		  
		  // 1. Verificar se é Anexo V
		  const situacaoAtual = buscarSituacaoAtual(cnpj, mesReferencia);
		  if (!situacaoAtual || situacaoAtual.tributacao !== 'simples') return null;
		  
		  const anexosV = situacaoAtual.anexos?.some(a => a.anexo === 'V') || false;
		  if (!anexosV) return null;
		  
		  // 2. Receita Bruta 12 meses anteriores
		  const dataLimite = new Date(mesReferencia + '-01');
		  dataLimite.setMonth(dataLimite.getMonth() - 12);
		  
		  const receita12Meses = faturamentos
			.filter(f => f.cnpj === cnpj)
			.filter(f => new Date(f.mes + '-01') >= dataLimite)
			.reduce((total, f) => total + parseFloat(f.valor || 0), 0);
		  
		  if (receita12Meses === 0) return 0;
		  
		  // 3. Massa Salarial 12 meses anteriores (último mês disponível)
		  const massaSalarial12Meses = faturamentos
			.filter(f => f.cnpj === cnpj)
			.filter(f => new Date(f.mes + '-01') >= dataLimite)
			.reduce((total, f) => total + parseFloat(f.massaSalarial || 0), 0);
		  
		  // 4. Fator R = Massa Salarial / Receita Bruta
		  const fatorR = (massaSalarial12Meses / receita12Meses) * 100;
		  
		  return {
			fatorR: fatorR.toFixed(2),
			anexoEfetivo: fatorR >= 28 ? 'III' : 'V',
			receita12Meses,
			massaSalarial12Meses
		  };
		}

		// Obter Anexo efetivo para cálculo (considera Fator R)
		function getAnexoEfetivoParaCalculo(cnpj, mesReferencia) {
		  const fatorR = calcularFatorR(cnpj, mesReferencia);
		  if (!fatorR) return null;
		  
		  return {
			anexo: fatorR.anexoEfetivo,
			fatorR: fatorR.fatorR + '%'
		  };
		}

		// Atualizar a função de submit para lidar com edição
		function salvarFaturamento(e) {
		  e.preventDefault();

		  const cnpj = document.getElementById('cnpjFaturamento').value;
		  const mes = document.getElementById('mesFaturamento').value;
		  const valor = parseFloat(document.getElementById('valorFaturamento').value.replace(',', '.')) || 0;
		  const massaSalarial = parseFloat(document.getElementById('massaSalarial')?.value.replace(',', '.') || 0);
		  
		  const form = document.getElementById('faturamentoForm');
		  const editId = form.dataset.editId;

		  if (!cnpj || !mes || valor === 0) {
			mostrarMensagem('Preencha empresa, mês e valor!', 'error');
			return;
		  }

		  let faturamentos = JSON.parse(localStorage.getItem('faturamento') || '[]');
		  const valoresAnexo = getValoresAnexoData();

		  if (editId) {
			// Edição
			const index = faturamentos.findIndex(f => f.id === editId);
			if (index !== -1) {
			  faturamentos[index] = {
				id: editId,
				cnpj,
				mes,
				valor,
				massaSalarial,  // ← NOVO CAMPO
				valoresAnexo
			  };
			  mostrarMensagem('Faturamento atualizado!');
			}
			delete form.dataset.editId;
		  } else {
			// Novo - remover duplicata do mesmo mês
			faturamentos = faturamentos.filter(v => !(v.cnpj === cnpj && v.mes === mes));
			
			faturamentos.push({
			  id: Date.now().toString(),
			  cnpj,
			  mes,
			  valor,
			  massaSalarial,  // ← NOVO CAMPO
			  valoresAnexo
			});
			mostrarMensagem('Faturamento registrado!');
		  }

		  localStorage.setItem('faturamento', JSON.stringify(faturamentos));
		  form.reset();
		  
		  // Resetar botão
		  const submitBtn = form.querySelector('button[type="submit"]');
		  if (submitBtn) {
			submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar Faturamento';
			submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
			submitBtn.classList.add('bg-green-600', 'hover:bg-green-700');
		  }

		  carregarFaturamento();
		  atualizarGraficoFaturamento();
		}

		// Função para atualizar gráfico de faturamento
		function atualizarGraficoFaturamento() {
		  const container = document.getElementById('graficoFaturamento');
		  if (!container) return; // ← evita erro se o elemento não existir

		  const faturamentos = JSON.parse(localStorage.getItem('faturamento') || '[]');
		  const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');

		  if (!faturamentos.length) {
			container.innerHTML = `
			  <div class="text-center text-gray-400">
				<i class="fas fa-chart-bar text-2xl mb-2"></i>
				<p class="text-sm">Gráfico será gerado após cadastro de dados</p>
			  </div>
			`;
			return;
		  }
			
			// Agrupar por mês
			const faturamentoPorMes = {};
			faturamentos.forEach(f => {
				if (!faturamentoPorMes[f.mes]) {
					faturamentoPorMes[f.mes] = 0;
				}
				faturamentoPorMes[f.mes] += f.valor;
			});
			
			// Ordenar meses
			const mesesOrdenados = Object.keys(faturamentoPorMes).sort();
			
			// Pegar últimos 6 meses
			const ultimosMeses = mesesOrdenados.slice(-6);
			
			// Gerar HTML do gráfico simplificado
			const maxValor = Math.max(...Object.values(faturamentoPorMes));
			
			let html = `
				<div class="w-full h-full p-4">
					<div class="flex justify-between items-end h-36 gap-1">
			`;
			
			ultimosMeses.forEach(mes => {
				const valor = faturamentoPorMes[mes];
				const altura = (valor / maxValor) * 100;
				const [ano, mesNum] = mes.split('-');
				const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
				const mesFormatado = `${meses[parseInt(mesNum) - 1]}/${ano.substring(2)}`;
				
				html += `
					<div class="flex flex-col items-center flex-1">
						<div class="text-xs text-gray-500 mb-1">${mesFormatado}</div>
						<div class="w-3/4 bg-gradient-to-t from-green-400 to-green-300 rounded-t-lg" style="height: ${Math.max(altura, 5)}%"></div>
						<div class="text-xs text-gray-700 mt-1">${formatarMoeda(valor).replace('R$', '').trim()}</div>
					</div>
				`;
			});
			
			html += `
					</div>
					<div class="text-center text-xs text-gray-500 mt-4">
						Últimos 6 meses de faturamento consolidado
					</div>
				</div>
			`;
			
//			container.innerHTML = html;
		}

		// ========== FUNÇÕES AUXILIARES - ATUALIZADA ==========
		function atualizarSelects() {
			try {
				console.log('atualizarSelects() chamada');
				
				const clientes = JSON.parse(localStorage.getItem('clientes') || '[]');
				console.log('Clientes encontrados:', clientes.length);
				
				// IDs dos selects que precisam ser atualizados
				const selectIds = ['cnpjEmpresa', 'cnpjFaturamento', 'cnpjCalculo', 'filtroEmpresa'];
				
				selectIds.forEach(selectId => {
					const select = document.getElementById(selectId);
					if (!select) {
						console.error(`Select ${selectId} não encontrado no DOM`);
						return;
					}
					
					// Salvar valor selecionado atual
					const valorAtual = select.value;
					
					// Limpar todas as opções exceto a primeira
					while (select.options.length > 1) {
						select.remove(1);
					}
					
					// Se não houver clientes, apenas mostrar a primeira opção
					if (!clientes || clientes.length === 0) {
						select.innerHTML = '<option value="">Selecione uma empresa...</option>';
						console.log(`Select ${selectId}: Nenhum cliente para mostrar`);
						return;
					}
					
					// Ordenar clientes por nome fantasia
					const clientesOrdenados = [...clientes].sort((a, b) => 
						a.nomeFantasia.localeCompare(b.nomeFantasia)
					);
					
					// Adicionar cada cliente como opção
					clientesOrdenados.forEach(cliente => {
						// Verificar se o cliente tem dados válidos
						if (!cliente.cnpj || !cliente.nomeFantasia) {
							console.warn('Cliente inválido encontrado:', cliente);
							return;
						}
						
						const option = document.createElement('option');
						option.value = cliente.cnpj;
						option.textContent = `${cliente.nomeFantasia} (${formatarCNPJ(cliente.cnpj)})`;
						select.appendChild(option);
					});
					
					// Restaurar valor selecionado anterior se ainda existir
					if (valorAtual && Array.from(select.options).some(opt => opt.value === valorAtual)) {
						select.value = valorAtual;
					} else {
						select.value = '';
					}
					
					console.log(`Select ${selectId} atualizado com ${clientes.length} opções`);
				});
				
				// Atualizar filtro de anos (se existir)
				atualizarFiltroAno();
				
			} catch (error) {
				console.error('Erro em atualizarSelects:', error);
				mostrarMensagem('Erro ao carregar lista de empresas');
			}
		}

		// Função separada para atualizar filtro de anos
		function atualizarFiltroAno() {
			try {
				const filtroAno = document.getElementById('filtroAno');
				if (!filtroAno) return;
				
				const vendas = JSON.parse(localStorage.getItem('faturamento') || '[]');
				const anos = [...new Set(vendas.map(v => v.mes?.substring(0, 4) || ''))]
					.filter(ano => ano)
					.sort()
					.reverse();
				
				const valorAtual = filtroAno.value;
				
				// Limpar opções (exceto a primeira)
				while (filtroAno.options.length > 1) {
					filtroAno.remove(1);
				}
				
				// Adicionar anos
				anos.forEach(ano => {
					const option = document.createElement('option');
					option.value = ano;
					option.textContent = ano;
					filtroAno.appendChild(option);
				});
				
				if (valorAtual && Array.from(filtroAno.options).some(opt => opt.value === valorAtual)) {
					filtroAno.value = valorAtual;
				}
			} catch (error) {
				console.error('Erro em atualizarFiltroAno:', error);
			}
		}
        
        // --- 6. CÁLCULO DE IMPOSTOS (CORREÇÃO DE FUNCIONALIDADE) ---
        
        function buscarSituacaoAtual(cnpj, mes) {
             const situacoes = JSON.parse(localStorage.getItem('situacoes')) || [];
             const dataLimite = mes + '-01'; // O dia 1 do mês de referência
             
             // Filtra situações que entraram em vigor ANTES ou NO MÊS de referência
             const situacoesValidas = situacoes.filter(s => 
                 s.cnpjEmpresa === cnpj && s.dataSituacao <= dataLimite
             );
             
             // Ordena para pegar a mais recente
             situacoesValidas.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
             
             return situacoesValidas.length > 0 ? situacoesValidas[0] : null;
        }
        
        // ====================================================
		// FUNÇÃO CÁLCULO DE IMPOSTOS COM VIGÊNCIA
		// ====================================================

		function calcularImpostosComVigencia() {
			const cnpj = document.getElementById('cnpjCalculo').value;
			const mesReferencia = document.getElementById('mesCalculo').value; // formato YYYY-MM
			const resultadoDiv = document.getElementById('resultadoCalculo');
			resultadoDiv.classList.add('hidden');
			resultadoDiv.innerHTML = '';

			if (!cnpj || !mesReferencia) {
				mostrarMensagem("Selecione a Empresa e o Mês de Referência.", 'warning');
				return;
			}

			// 1. Encontrar o registro de Faturamento
			const faturamentos = JSON.parse(localStorage.getItem('faturamento')) || [];
			const faturamentoMes = faturamentos.find(v => v.cnpj === cnpj && v.mes === mesReferencia);
			
			if (!faturamentoMes) {
				resultadoDiv.innerHTML = `<div class="p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800 text-center">Nenhum registro de faturamento encontrado para ${mesReferencia}.</div>`;
				resultadoDiv.classList.remove('hidden');
				return;
			}
			
			const valorFaturamento = parseFloat(faturamentoMes.valor);
			
			// 2. Encontrar a Situação Tributária
			const situacao = buscarSituacaoAtual(cnpj, mesReferencia);
			
			if (!situacao) {
				resultadoDiv.innerHTML = `<div class="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-center">Nenhuma situação tributária encontrada para esta empresa até ${mesReferencia}.</div>`;
				resultadoDiv.classList.remove('hidden');
				return;
			}

			let impostoCalculado = 0;
			let regime = situacao.tributacao;
			let detalhes = [];

			if (regime === 'simples') {
			    // Verificar Fator R para Anexo V
				const fatorRInfo = getAnexoEfetivoParaCalculo(cnpj, mesReferencia);
				let anexoEfetivo = situacao.anexos?.[0]?.anexo || 'III'; // Primeiro anexo por padrão
				  
				if (fatorRInfo && anexoEfetivo === 'V') {
					anexoEfetivo = fatorRInfo.anexo;
				}
				  
				resultadoDiv.innerHTML = `
					<div class="space-y-4">
					  <div class="bg-green-50 p-4 rounded-lg border border-green-200">
						<h3 class="font-bold text-lg text-green-800 mb-2">Simples Nacional - ${anexoEfetivo}</h3>
						${fatorRInfo ? `
						  <p class="text-sm text-green-700">
							<i class="fas fa-calculator mr-1"></i> Fator R: <strong>${fatorRInfo.fatorR}</strong> 
							${fatorRInfo.anexo === 'III' ? '(Anexo III - vantajoso)' : '(Anexo V)'}
						  </p>
						` : ''}
						<p class="text-sm text-green-700 mt-2">Faturamento: ${formatarMoeda(valorFaturamento)}</p>
					</div>
				`;
				// Lógica do Simples Nacional com vigência
				const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples')) || [];
				const anexo = situacao.anexo;
				
				// Filtrar faixas do anexo correto e com vigência <= mês de referência
				const faixasVigentes = faixas.filter(f => 
					f.anexo === anexo && 
					f.vigencia <= mesReferencia
				);
				
				if (faixasVigentes.length === 0) {
					resultadoDiv.innerHTML = `<div class="p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-center">Nenhuma faixa do Simples Nacional encontrada para o Anexo ${anexo} vigente em ${mesReferencia}.</div>`;
					resultadoDiv.classList.remove('hidden');
					return;
				}
				
				// Ordenar por vigência (mais recente primeiro) e pegar a mais recente
				faixasVigentes.sort((a, b) => b.vigencia.localeCompare(a.vigencia));
				const vigenciaAtual = faixasVigentes[0].vigencia;
				
				// Filtrar apenas as faixas da vigência mais recente
				const faixasVigenciaAtual = faixasVigentes.filter(f => f.vigencia === vigenciaAtual);
				
				// Calcular RBT12 (Receita Bruta Total nos 12 meses anteriores)
				const rbt12 = calcularRBT12(cnpj, mesReferencia);

				const faixaAplicavel = faixasVigenciaAtual.find(f => 
					parseFloat(f.inicio) <= rbt12 && 
					parseFloat(f.fim) >= rbt12
				);

				if (faixaAplicavel) {
					const aliquota = parseFloat(faixaAplicavel.aliquota) / 100;
					const deducao = parseFloat(faixaAplicavel.deduzir);
					
					// Cálculo do Simples (Alíquota Efetiva)
					// (RBT12 * Alíquota Nominal - Parcela a Deduzir) / RBT12
					const aliquotaEfetiva = ((rbt12 * aliquota) - deducao) / rbt12;
					
					impostoCalculado = valorFaturamento * aliquotaEfetiva;
					
					// Calcular repartição por tributo
					let reparticaoDetalhes = [];
					if (faixaAplicavel.reparticao) {
						Object.entries(faixaAplicavel.reparticao).forEach(([tributo, percentual]) => {
							if (percentual > 0) {
								const valorTributo = impostoCalculado * (percentual / 100);
								reparticaoDetalhes.push({
									tributo,
									percentual,
									valor: valorTributo
								});
							}
						});
					}
					
					detalhes.push({ 
						descricao: "Base de Cálculo (Venda do Mês)", 
						valor: formatarMoeda(valorFaturamento), 
						icone: 'fas fa-money-bill-wave' 
					});
					detalhes.push({ 
						descricao: "RBT12 (12 meses anteriores)", 
						valor: formatarMoeda(rbt12), 
						icone: 'fas fa-chart-line' 
					});
					detalhes.push({ 
						descricao: `Anexo ${anexo}`, 
						valor: `Vigência ${vigenciaAtual}`, 
						icone: 'fas fa-clipboard-list' 
					});
					detalhes.push({ 
						descricao: "Faixa Aplicada", 
						valor: faixaAplicavel.nome, 
						icone: 'fas fa-layer-group' 
					});
					detalhes.push({ 
						descricao: "Alíquota Efetiva", 
						valor: `${(aliquotaEfetiva * 100).toFixed(2)}%`, 
						icone: 'fas fa-percentage' 
					});

					// Adicionar detalhes da repartição
					reparticaoDetalhes.forEach(rep => {
						detalhes.push({
							descricao: `  → ${rep.tributo} (${rep.percentual.toFixed(2)}%)`,
							valor: formatarMoeda(rep.valor),
							icone: 'fas fa-arrow-right',
							indent: true
						});
					});

				} else {
					detalhes.push({ 
						descricao: "Erro de Parametrização", 
						valor: `Nenhuma faixa do Simples Nacional encontrada para o Anexo ${anexo}, vigência ${vigenciaAtual} e RBT12 de ${formatarMoeda(rbt12)}.`,
						icone: 'fas fa-bug',
						color: 'text-red-600'
					});
				}
			} else if (regime === 'presumido') {
				// Lógica do Lucro Presumido com vigência
				const configs = JSON.parse(localStorage.getItem('paramPresumido')) || [];
				
				// Filtrar configurações com vigência <= mês de referência
				const configsVigentes = configs.filter(c => c.vigencia <= mesReferencia);
				
				if (configsVigentes.length === 0) {
					detalhes.push({ 
						descricao: "Erro de Parametrização", 
						valor: `Nenhuma configuração do Lucro Presumido encontrada para vigência ${mesReferencia}.`,
						icone: 'fas fa-bug',
						color: 'text-red-600'
					});
				} else {
					// Ordenar por vigência (mais recente primeiro)
					configsVigentes.sort((a, b) => b.vigencia.localeCompare(a.vigencia));
					const configVigente = configsVigentes[0];
					
					// Cálculo do Lucro Presumido
					const presuncaoIRPJ = configVigente.presuncaoIRPJ / 100;
					const aliquotaIRPJ = configVigente.aliquotaIRPJ / 100;
					const adicionalIRPJ = configVigente.adicionalIRPJ / 100;
					const presuncaoCSLL = configVigente.presuncaoCSLL / 100;
					const aliquotaCSLL = configVigente.aliquotaCSLL / 100;
					const pisCofins = configVigente.PISCOFINS / 100;
					const iss = (configVigente.ISS || 0) / 100;
					const icms = (configVigente.ICMS || 0) / 100;
					
					// Cálculo base
					const baseIRPJ = valorFaturamento * presuncaoIRPJ;
					const baseCSLL = valorFaturamento * presuncaoCSLL;
					
					// Cálculo dos impostos
					let valorIRPJ = baseIRPJ * aliquotaIRPJ;
					
					// Adicional de IRPJ (se aplicável)
					if (valorFaturamento > (configVigente.limiteAdicional || 20000)) {
						const baseAdicional = valorFaturamento - (configVigente.limiteAdicional || 20000);
						valorIRPJ += baseAdicional * adicionalIRPJ;
					}
					
					const valorCSLL = baseCSLL * aliquotaCSLL;
					const valorPISCOFINS = valorFaturamento * pisCofins;
					const valorISS = iss > 0 ? valorFaturamento * iss : 0;
					const valorICMS = icms > 0 ? valorFaturamento * icms : 0;
					
					impostoCalculado = valorIRPJ + valorCSLL + valorPISCOFINS + valorISS + valorICMS;
					
					detalhes.push({ 
						descricao: "Base de Cálculo", 
						valor: formatarMoeda(valorFaturamento), 
						icone: 'fas fa-money-bill-wave' 
					});
					detalhes.push({ 
						descricao: "Configuração Aplicada", 
						valor: configVigente.nome, 
						icone: 'fas fa-clipboard-list' 
					});
					detalhes.push({ 
						descricao: "Vigência", 
						valor: configVigente.vigencia, 
						icone: 'fas fa-calendar-alt' 
					});
					detalhes.push({ 
						descricao: "IRPJ", 
						valor: formatarMoeda(valorIRPJ), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					detalhes.push({ 
						descricao: "CSLL", 
						valor: formatarMoeda(valorCSLL), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					detalhes.push({ 
						descricao: "PIS/COFINS", 
						valor: formatarMoeda(valorPISCOFINS), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					
					if (valorISS > 0) {
						detalhes.push({ 
							descricao: "ISS", 
							valor: formatarMoeda(valorISS), 
							icone: 'fas fa-file-invoice-dollar' 
						});
					}
					
					if (valorICMS > 0) {
						detalhes.push({ 
							descricao: "ICMS", 
							valor: formatarMoeda(valorICMS), 
							icone: 'fas fa-file-invoice-dollar' 
						});
					}
				}
			} else if (regime === 'real') {
				// Lógica do Lucro Real com vigência
				const configs = JSON.parse(localStorage.getItem('paramReal')) || [];
				
				// Filtrar configurações com vigência <= mês de referência
				const configsVigentes = configs.filter(c => c.vigencia <= mesReferencia);
				
				if (configsVigentes.length === 0) {
					detalhes.push({ 
						descricao: "Erro de Parametrização", 
						valor: `Nenhuma configuração do Lucro Real encontrada para vigência ${mesReferencia}.`,
						icone: 'fas fa-bug',
						color: 'text-red-600'
					});
				} else {
					// Ordenar por vigência (mais recente primeiro)
					configsVigentes.sort((a, b) => b.vigencia.localeCompare(a.vigencia));
					const configVigente = configsVigentes[0];
					
					// Cálculo do Lucro Real (simplificado)
					const aliquotaIRPJ = configVigente.aliquotaIRPJ / 100;
					const adicionalIRPJ = configVigente.adicionalIRPJ / 100;
					const aliquotaCSLL = configVigente.aliquotaCSLL / 100;
					const pis = configVigente.PIS / 100;
					const cofins = configVigente.COFINS / 100;
					const iss = (configVigente.ISS || 0) / 100;
					const icms = (configVigente.ICMS || 0) / 100;
					
					// Base de cálculo (aqui assumimos que o lucro real é 30% da receita para simplificação)
					const lucroReal = valorFaturamento * 0.3;
					
					// Verificar isenções
					const baseIRPJ = lucroReal > configVigente.isencaoIRPJ ? lucroReal - configVigente.isencaoIRPJ : 0;
					const baseCSLL = lucroReal > configVigente.isencaoCSLL ? lucroReal - configVigente.isencaoCSLL : 0;
					
					// Cálculo dos impostos
					let valorIRPJ = baseIRPJ * aliquotaIRPJ;
					
					// Adicional de IRPJ (se aplicável)
					if (lucroReal > (configVigente.limiteAdicional || 20000)) {
						const baseAdicional = lucroReal - (configVigente.limiteAdicional || 20000);
						valorIRPJ += baseAdicional * adicionalIRPJ;
					}
					
					const valorCSLL = baseCSLL * aliquotaCSLL;
					const valorPIS = valorFaturamento * pis;
					const valorCOFINS = valorFaturamento * cofins;
					const valorISS = iss > 0 ? valorFaturamento * iss : 0;
					const valorICMS = icms > 0 ? valorFaturamento * icms : 0;
					
					impostoCalculado = valorIRPJ + valorCSLL + valorPIS + valorCOFINS + valorISS + valorICMS;
					
					detalhes.push({ 
						descricao: "Receita Bruta", 
						valor: formatarMoeda(valorFaturamento), 
						icone: 'fas fa-money-bill-wave' 
					});
					detalhes.push({ 
						descricao: "Lucro Real Estimado (30%)", 
						valor: formatarMoeda(lucroReal), 
						icone: 'fas fa-chart-line' 
					});
					detalhes.push({ 
						descricao: "Configuração Aplicada", 
						valor: configVigente.nome, 
						icone: 'fas fa-clipboard-list' 
					});
					detalhes.push({ 
						descricao: "Vigência", 
						valor: configVigente.vigencia, 
						icone: 'fas fa-calendar-alt' 
					});
					detalhes.push({ 
						descricao: "IRPJ", 
						valor: formatarMoeda(valorIRPJ), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					detalhes.push({ 
						descricao: "CSLL", 
						valor: formatarMoeda(valorCSLL), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					detalhes.push({ 
						descricao: "PIS", 
						valor: formatarMoeda(valorPIS), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					detalhes.push({ 
						descricao: "COFINS", 
						valor: formatarMoeda(valorCOFINS), 
						icone: 'fas fa-file-invoice-dollar' 
					});
					
					if (valorISS > 0) {
						detalhes.push({ 
							descricao: "ISS", 
							valor: formatarMoeda(valorISS), 
							icone: 'fas fa-file-invoice-dollar' 
						});
					}
					
					if (valorICMS > 0) {
						detalhes.push({ 
							descricao: "ICMS", 
							valor: formatarMoeda(valorICMS), 
							icone: 'fas fa-file-invoice-dollar' 
						});
					}
				}
			} else {
				 detalhes.push({ 
					descricao: "Regime Não Suportado", 
					valor: `O cálculo para ${regime.toUpperCase()} ainda não está implementado.`, 
					icone: 'fas fa-tools',
					color: 'text-orange-600'
				});
			}

			// Renderizar Resultado
			const cliente = JSON.parse(localStorage.getItem('clientes')).find(c => c.cnpj === cnpj);
			const nomeCliente = cliente ? cliente.nomeFantasia : 'Empresa Desconhecida';
			
			let htmlDetalhes = detalhes.map(d => `
				<div class="flex justify-between py-2 border-b last:border-b-0 ${d.indent ? 'pl-6' : ''}">
					<span class="text-sm text-gray-600 flex items-center gap-2 ${d.color || ''}">
						${d.icone ? `<i class="${d.icone}"></i>` : ''}
						${d.descricao}
					</span>
					<span class="font-semibold text-gray-800 ${d.color || ''}">${d.valor}</span>
				</div>
			`).join('');
			
			resultadoDiv.innerHTML = `
				<h3 class="text-2xl font-bold text-gray-800 mb-2">${nomeCliente}</h3>
				<p class="text-sm text-purple-600 mb-6 font-medium">
					Referência: ${mesReferencia} | Regime: ${regime.toUpperCase()}
				</p>
				
				<div class="space-y-4">
					${htmlDetalhes}
				</div>
				
				<div class="mt-8 pt-4 border-t border-purple-300 flex justify-between items-center bg-purple-50 p-4 rounded-lg">
					<span class="text-lg font-bold text-purple-800">TOTAL DE IMPOSTO ESTIMADO</span>
					<span class="text-3xl font-extrabold text-purple-800">${formatarMoeda(impostoCalculado)}</span>
				</div>
			`;
			resultadoDiv.classList.remove('hidden');
			return;
		}

		// Função para calcular RBT12 (Receita Bruta Total dos últimos 12 meses)
		function calcularRBT12(cnpj, mesReferencia) {
			const faturamentos = JSON.parse(localStorage.getItem('faturamento')) || [];
			
			// Converter mesReferencia para objeto Date
			const [anoRef, mesRef] = mesReferencia.split('-').map(Number);
			const dataReferencia = new Date(anoRef, mesRef - 1, 1);
			
			// Calcular data de 12 meses atrás
			const data12MesesAtras = new Date(dataReferencia);
			data12MesesAtras.setMonth(data12MesesAtras.getMonth() - 11); // 11 meses para trás + mês atual = 12 meses
			
			let rbt12 = 0;
			
			faturamentos.forEach(faturamento => {
				if (faturamento.cnpj === cnpj) {
					const [anoFaturamento, mesFaturamento] = faturamento.mes.split('-').map(Number);
					const dataFaturamento = new Date(anoFaturamento, mesFaturamento - 1, 1);
					
					// Verificar se o faturamento está dentro do período dos últimos 12 meses
					if (dataFaturamento >= data12MesesAtras && dataFaturamento <= dataReferencia) {
						rbt12 += parseFloat(faturamento.valor);
					}
				}
			});
			
			return rbt12;
		}

		// Atualizar a função de cálculo para usar a nova função com vigência
		function calcularImpostos() {
			calcularImpostosComVigencia();
		}

        // --- 7. UTILITÁRIOS GERAIS ---
        function atualizarSelects() {
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const selects = ['cnpjEmpresa', 'cnpjFaturamento', 'cnpjCalculo'];
			
			selects.forEach(id => {
				const sel = document.getElementById(id);
				if(!sel) return;
				const valorAtual = sel.value;
				sel.innerHTML = '<option value="">Selecione...</option>';
				clientes.forEach(c => {
					const opt = document.createElement('option');
					opt.value = c.cnpj;
					opt.innerText = c.nomeFantasia;
					sel.appendChild(opt);
				});
				sel.value = valorAtual;
			});
			
			// Atualizar também o select de empresas no relatório
			atualizarSelectEmpresas();
		}

        // Modal Customizado
		let modalCallback = null;
		function mostrarModalConfirmacao(titulo, msg, callback, apenasAlerta = false, permitirHTML = false) {
			document.getElementById('modalTitle').innerText = titulo;
			
			const modalMessage = document.getElementById('modalMessage');
			if (permitirHTML) {
				modalMessage.innerHTML = msg; // Usar innerHTML para permitir tags HTML
			} else {
				modalMessage.innerText = msg; // Usar innerText para texto simples
			}
			
			modalCallback = callback;
			
			const btnConfirm = document.getElementById('modalConfirm');
			if(apenasAlerta) {
				btnConfirm.classList.add('hidden');
				document.getElementById('modalCancel').innerText = "Fechar";
			} else {
				btnConfirm.classList.remove('hidden');
				document.getElementById('modalCancel').innerText = "Cancelar";
			}
			
			document.getElementById('confirmModal').classList.remove('hidden');
			document.getElementById('confirmModal').classList.add('flex');
		}
        
        function fecharModal() {
             document.getElementById('confirmModal').classList.add('hidden');
             document.getElementById('confirmModal').classList.remove('flex');
             modalCallback = null; // Limpa o callback
        }
        
        document.getElementById('modalConfirm').addEventListener('click', () => {
            if(modalCallback) modalCallback();
            fecharModal();
        });

		// ====================================================
		// RELATÓRIOS - SISTEMA COMPLETO
		// ====================================================

		// Variáveis globais para relatórios
		let dadosRelatorioAtual = null;
		let tipoRelatorioAtual = null;

		// Inicializar sistema de relatórios
		function initRelatorios() {
			// Atualizar lista de empresas no filtro
			atualizarSelectEmpresas();
			
			// Configurar data inicial e final padrão
			const hoje = new Date();
			const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM
			const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1).toISOString().slice(0, 7);
			
			document.getElementById('dataInicial').value = mesAnterior;
			document.getElementById('dataFinal').value = mesAtual;
			
			// Event listeners
			document.getElementById('tipoRelatorio').addEventListener('change', atualizarFiltrosRelatorio);
			document.getElementById('periodoRelatorio').addEventListener('change', atualizarPeriodoRelatorio);
			document.getElementById('gerarRelatorio').addEventListener('click', gerarRelatorio);
			document.getElementById('exportarRelatorio').addEventListener('click', exportarRelatorioPDF);
			document.getElementById('exportarExcel').addEventListener('click', exportarRelatorioExcel);
			
			// Inicializar filtros
			atualizarFiltrosRelatorio();
		}

		// Atualizar lista de empresas no filtro
		function atualizarSelectEmpresas() {
			const empresas = JSON.parse(localStorage.getItem('clientes')) || [];
			const select = document.getElementById('empresaRelatorio');
			const selectVendas = document.getElementById('empresaRelatorio');
			
			// Limpar opções exceto "Todas as Empresas"
			while (select.options.length > 1) {
				select.remove(1);
			}
			
			empresas.forEach(empresa => {
				const option = document.createElement('option');
				option.value = empresa.cnpj;
				option.textContent = empresa.nomeFantasia;
				select.appendChild(option.cloneNode(true));
			});
		}

		// Atualizar filtros baseados no tipo de relatório
		function atualizarFiltrosRelatorio() {
			const tipo = document.getElementById('tipoRelatorio').value;
			const filtrosAvancados = document.getElementById('filtrosAvancados');
			const filtroVendas = document.getElementById('filtroVendas');
			const filtroSituacao = document.getElementById('filtroSituacao');
			const periodoPersonalizado = document.getElementById('periodoPersonalizado');
			
			// Resetar todos os filtros
			filtrosAvancados.classList.add('hidden');
			filtroVendas.classList.add('hidden');
			filtroSituacao.classList.add('hidden');
			
			// Mostrar filtros avançados se não for "todos"
			filtrosAvancados.classList.remove('hidden');
			
			// Mostrar filtros específicos
			if (tipo === 'faturamento') {
				filtroVendas.classList.remove('hidden');
				periodoPersonalizado.classList.remove('hidden');
			} else if (tipo === 'situacoes') {
				filtroSituacao.classList.remove('hidden');
				periodoPersonalizado.classList.remove('hidden');
			} else if (tipo === 'impostos') {
				periodoPersonalizado.classList.remove('hidden');
			} else if (tipo === 'clientes') {
				// Para clientes, não mostra filtros adicionais
				filtrosAvancados.classList.add('hidden');
			}
		}

		// Atualizar período baseado na seleção
		function atualizarPeriodoRelatorio() {
			const periodo = document.getElementById('periodoRelatorio').value;
			const hoje = new Date();
			const dataInicial = document.getElementById('dataInicial');
			const dataFinal = document.getElementById('dataFinal');
			
			if (periodo === 'personalizado') {
				return; // Mantém as datas personalizadas
			}
			
			let dataInicio = new Date();
			let dataFim = new Date();
			
			switch (periodo) {
				case 'ultimo_mes':
					dataInicio.setMonth(dataInicio.getMonth() - 1);
					break;
				case 'ultimos_3_meses':
					dataInicio.setMonth(dataInicio.getMonth() - 3);
					break;
				case 'ultimos_6_meses':
					dataInicio.setMonth(dataInicio.getMonth() - 6);
					break;
				case 'ultimos_12_meses':
					dataInicio.setMonth(dataInicio.getMonth() - 12);
					break;
				case 'ano_atual':
					dataInicio = new Date(hoje.getFullYear(), 0, 1); // 1º de janeiro do ano atual
					break;
				case 'ano_anterior':
					dataInicio = new Date(hoje.getFullYear() - 1, 0, 1);
					dataFim = new Date(hoje.getFullYear() - 1, 11, 31);
					break;
			}
			
			// Formatar para YYYY-MM
			const formatarParaMes = (data) => {
				const ano = data.getFullYear();
				const mes = (data.getMonth() + 1).toString().padStart(2, '0');
				return `${ano}-${mes}`;
			};
			
			dataInicial.value = formatarParaMes(dataInicio);
			dataFinal.value = formatarParaMes(dataFim);
		}

		// Função principal para gerar relatório
		function gerarRelatorio() {
			const tipo = document.getElementById('tipoRelatorio').value;
			const empresa = document.getElementById('empresaRelatorio').value;
			const periodo = document.getElementById('periodoRelatorio').value;
			const dataInicial = document.getElementById('dataInicial').value;
			const dataFinal = document.getElementById('dataFinal').value;
			
			tipoRelatorioAtual = tipo;
			
			// Validar datas
			if (dataInicial && dataFinal && dataInicial > dataFinal) {
				mostrarMensagem("Data inicial não pode ser maior que data final", 'error');
				return;
			}
			
			switch (tipo) {
				case 'situacoes':
					gerarRelatorioSituacoes(empresa, dataInicial, dataFinal);
					break;
				case 'faturamento':
					gerarRelatorioFaturamento(empresa, dataInicial, dataFinal);
					break;
				case 'impostos':
					gerarRelatorioImpostos(empresa, dataInicial, dataFinal);
					break;
				case 'clientes':
					gerarRelatorioClientes();
					break;
				default:
					mostrarMensagem("Tipo de relatório não suportado", 'error');
			}
		}

		// Relatório de Clientes com Situação
		function gerarRelatorioSituacoes(empresa, dataInicial, dataFinal) {
			const situacoes = JSON.parse(localStorage.getItem('situacoes')) || [];
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const regimeFiltro = document.getElementById('regimeSituacao').value;
			
			// Filtrar situações
			let situacoesFiltradas = situacoes;
			
			// Filtrar por empresa se selecionada
			if (empresa !== 'todas') {
				situacoesFiltradas = situacoesFiltradas.filter(s => s.cnpjEmpresa === empresa);
			}
			
			// Filtrar por regime se não for "todos"
			if (regimeFiltro !== 'todos') {
				situacoesFiltradas = situacoesFiltradas.filter(s => s.tributacao === regimeFiltro);
			}
			
			// Filtrar por período
			if (dataInicial && dataFinal) {
				situacoesFiltradas = situacoesFiltradas.filter(s => {
					const dataSituacao = s.dataSituacao.substring(0, 7); // YYYY-MM
					return dataSituacao >= dataInicial && dataSituacao <= dataFinal;
				});
			}
			
			// Ordenar por data
			situacoesFiltradas.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao));
			
			// Agrupar por empresa
			const situacoesPorEmpresa = {};
			situacoesFiltradas.forEach(situacao => {
				if (!situacoesPorEmpresa[situacao.cnpjEmpresa]) {
					situacoesPorEmpresa[situacao.cnpjEmpresa] = [];
				}
				situacoesPorEmpresa[situacao.cnpjEmpresa].push(situacao);
			});
			
			// Gerar HTML do relatório
			let html = `
				<div class="mb-6">
					<h4 class="font-bold text-gray-800 text-lg mb-4">Relatório de Clientes com Situação Tributária</h4>
					<p class="text-sm text-gray-600">
						${empresa === 'todas' ? 'Todas as empresas' : 'Empresa específica'} | 
						Período: ${dataInicial ? formatarMesAno(dataInicial) : 'Início'} a ${dataFinal ? formatarMesAno(dataFinal) : 'Fim'}
					</p>
				</div>
			`;
			
			if (situacoesFiltradas.length === 0) {
				html += `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-inbox text-3xl mb-3"></i>
						<p>Nenhuma situação encontrada para os filtros selecionados.</p>
					</div>
				`;
			} else {
				Object.keys(situacoesPorEmpresa).forEach(cnpj => {
					const empresaInfo = clientes.find(c => c.cnpj === cnpj);
					if (!empresaInfo) return;
					
					const situacoesEmpresa = situacoesPorEmpresa[cnpj];
					
					html += `
						<div class="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
							<div class="flex justify-between items-start mb-3">
								<div>
									<h5 class="font-bold text-gray-800">${empresaInfo.nomeFantasia}</h5>
									<p class="text-sm text-gray-600">CNPJ: ${formatarCNPJ(cnpj)}</p>
								</div>
								<span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
									${situacoesEmpresa.length} situação(ões)
								</span>
							</div>
							
							<div class="space-y-2">
								${situacoesEmpresa.map(situacao => {
									let badgeColor = 'bg-green-100 text-green-800';
									if (situacao.tributacao === 'presumido') badgeColor = 'bg-yellow-100 text-yellow-800';
									if (situacao.tributacao === 'real') badgeColor = 'bg-purple-100 text-purple-800';
									
									return `
										<div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
											<div>
												<div class="flex items-center gap-2 mb-1">
													<span class="font-medium">${formatarData(situacao.dataSituacao)}</span>
													<span class="text-xs px-2 py-0.5 ${badgeColor} rounded-full capitalize">
														${situacao.tributacao}
													</span>
													${situacao.anexo ? `<span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full">Anexo ${situacao.anexo}</span>` : ''}
												</div>
												<p class="text-xs text-gray-600">${situacao.endereco}</p>
											</div>
											<div class="text-right">
												<p class="text-xs text-gray-500">Vigente desde</p>
												<p class="text-sm font-medium">${formatarData(situacao.dataSituacao)}</p>
											</div>
										</div>
									`;
								}).join('')}
							</div>
						</div>
					`;
				});
				
				// Estatísticas
				const totalEmpresas = Object.keys(situacoesPorEmpresa).length;
				const distribuicaoRegime = {};
				situacoesFiltradas.forEach(s => {
					distribuicaoRegime[s.tributacao] = (distribuicaoRegime[s.tributacao] || 0) + 1;
				});
				
				html += `
					<div class="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
						<h6 class="font-bold text-gray-700 mb-2">Estatísticas</h6>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
							<div>
								<span class="font-medium">Total de Empresas:</span>
								<span class="ml-2 text-brand-600 font-bold">${totalEmpresas}</span>
							</div>
							<div>
								<span class="font-medium">Total de Situações:</span>
								<span class="ml-2 text-brand-600 font-bold">${situacoesFiltradas.length}</span>
							</div>
							<div>
								<span class="font-medium">Distribuição por Regime:</span>
								${Object.entries(distribuicaoRegime).map(([regime, count]) => `
									<span class="ml-2 text-xs px-2 py-0.5 rounded-full ${regime === 'simples' ? 'bg-green-100 text-green-800' : regime === 'presumido' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}">
										${regime}: ${count}
									</span>
								`).join('')}
							</div>
						</div>
					</div>
				`;
			}
			
			// Atualizar interface
			atualizarInterfaceRelatorio(html, situacoesFiltradas.length);
			dadosRelatorioAtual = situacoesFiltradas;
			
			// Mostrar período atual
			const periodoAtual = document.getElementById('periodoAtual');
			periodoAtual.textContent = `Período: ${dataInicial ? formatarMesAno(dataInicial) : '-'} a ${dataFinal ? formatarMesAno(dataFinal) : '-'}`;
		}

		// Relatório de Faturamento
		function gerarRelatorioFaturamento(empresa, dataInicial, dataFinal) {
			const faturamentos = JSON.parse(localStorage.getItem('faturamento')) || [];
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const agrupamento = document.getElementById('agrupamentoVendas').value;
			
			// Filtrar faturamentos
			let faturamentosFiltrados = faturamentos;
			
			if (empresa !== 'todas') {
				faturamentosFiltrados = faturamentosFiltrados.filter(f => f.cnpj === empresa);
			}
			
			if (dataInicial && dataFinal) {
				faturamentosFiltrados = faturamentosFiltrados.filter(f => f.mes >= dataInicial && f.mes <= dataFinal);
			}
			
			faturamentosFiltrados.sort((a, b) => b.mes.localeCompare(a.mes));
			
			if (faturamentosFiltrados.length === 0) {
				const html = `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-chart-line text-3xl mb-3"></i>
						<p>Nenhum faturamento encontrado para os filtros selecionados.</p>
					</div>
				`;
				atualizarInterfaceRelatorio(html, 0);
				dadosRelatorioAtual = [];
				return;
			}
			
			const totalFaturamento = faturamentosFiltrados.reduce((sum, f) => sum + parseFloat(f.valor), 0);
			const maiorFaturamento = Math.max(...faturamentosFiltrados.map(f => parseFloat(f.valor)));
			const mediaFaturamento = totalFaturamento / faturamentosFiltrados.length;
			
			let faturamentosAgrupados;
			switch (agrupamento) {
				case 'mensal':
					faturamentosAgrupados = agruparFaturamentoPorMes(faturamentosFiltrados, clientes, empresa);
					break;
				case 'trimestral':
					faturamentosAgrupados = agruparFaturamentoPorTrimestre(faturamentosFiltrados, clientes, empresa);
					break;
				case 'semestral':
					faturamentosAgrupados = agruparFaturamentoPorSemestre(faturamentosFiltrados, clientes, empresa);
					break;
				case 'anual':
					faturamentosAgrupados = agruparFaturamentoPorAno(faturamentosFiltrados, clientes, empresa);
					break;
				default:
					faturamentosAgrupados = agruparFaturamentoPorMes(faturamentosFiltrados, clientes, empresa);
			}
			
			let html = `
				<div class="mb-6">
					<h4 class="font-bold text-gray-800 text-lg mb-2">Relatório de Faturamento</h4>
					<p class="text-sm text-gray-600">
						${empresa === 'todas' ? 'Todas as empresas' : 'Empresa específica'} | 
						Agrupamento: ${agrupamento} | 
						Período: ${dataInicial ? formatarMesAno(dataInicial) : 'Início'} a ${dataFinal ? formatarMesAno(dataFinal) : 'Fim'}
					</p>
				</div>
			`;
			
			html += `
				<div class="overflow-x-auto mb-6">
					<table class="min-w-full divide-y divide-gray-200">
						<thead>
							<tr class="bg-gray-50">
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Período</th>
								${empresa === 'todas' ? '<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>' : ''}
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
								<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Média por Registro</th>
							</tr>
						</thead>
						<tbody class="bg-white divide-y divide-gray-200">
							${faturamentosAgrupados.map(item => `
								<tr class="hover:bg-gray-50">
									<td class="px-4 py-3 text-sm font-medium text-gray-900">${item.periodo}</td>
									${empresa === 'todas' ? `<td class="px-4 py-3 text-sm text-gray-900">${item.empresa}</td>` : ''}
									<td class="px-4 py-3 text-sm text-gray-900">${item.quantidade}</td>
									<td class="px-4 py-3 text-sm font-bold text-green-700">${formatarMoeda(item.total)}</td>
									<td class="px-4 py-3 text-sm text-gray-900">${formatarMoeda(item.media)}</td>
								</tr>
							`).join('')}
						</tbody>
						<tfoot class="bg-gray-50">
							<tr>
								<td class="px-4 py-3 text-sm font-bold text-gray-900" colspan="${empresa === 'todas' ? 2 : 1}">TOTAL</td>
								<td class="px-4 py-3 text-sm font-bold text-gray-900">${faturamentosFiltrados.length}</td>
								<td class="px-4 py-3 text-sm font-bold text-green-700">${formatarMoeda(totalFaturamento)}</td>
								<td class="px-4 py-3 text-sm font-bold text-gray-900">${formatarMoeda(mediaFaturamento)}</td>
							</tr>
						</tfoot>
					</table>
				</div>
			`;
			
			if (faturamentosFiltrados.length <= 20) {
				html += `
					<div class="mt-6">
						<h5 class="font-bold text-gray-700 mb-3">Detalhamento do Faturamento</h5>
						<div class="space-y-2">
							${faturamentosFiltrados.map(faturamento => {
								const empresaInfo = clientes.find(c => c.cnpj === faturamento.cnpj);
								return `
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
										<div>
											<div class="flex items-center gap-2">
												<span class="font-medium">${formatarMesAno(faturamento.mes)}</span>
												${empresa === 'todas' ? `<span class="text-sm text-gray-600">${empresaInfo ? empresaInfo.nomeFantasia : 'Empresa não encontrada'}</span>` : ''}
											</div>
											<p class="text-xs text-gray-500">Registrado em: ${formatarDataCompleta(new Date(parseInt(faturamento.id) || new Date()))}</p>
										</div>
										<div class="text-right">
											<p class="text-sm font-bold text-green-700">${formatarMoeda(faturamento.valor)}</p>
										</div>
									</div>
								`;
							}).join('')}
						</div>
					</div>
				`;
			}
			
			atualizarInterfaceRelatorio(html, faturamentosFiltrados.length);
			dadosRelatorioAtual = faturamentosFiltrados;
			
			atualizarEstatisticasFaturamento(totalFaturamento, mediaFaturamento, maiorFaturamento, faturamentosFiltrados);
			
			const periodoAtual = document.getElementById('periodoAtual');
			periodoAtual.textContent = `Período: ${dataInicial ? formatarMesAno(dataInicial) : '-'} a ${dataFinal ? formatarMesAno(dataFinal) : '-'}`;
		}

		// Funções auxiliares para agrupamento de Faturamento
		function agruparFaturamentoPorMes(faturamentos, clientes, empresa) {
			const agrupadas = {};
			
			faturamentos.forEach(faturamento => {
				const periodo = formatarMesAno(faturamento.mes);
				const chave = periodo;
				
				if (!agrupadas[chave]) {
					agrupadas[chave] = {
						periodo: periodo,
						empresa: empresa === 'todas' ? 'Várias' : clientes.find(c => c.cnpj === empresa)?.nomeFantasia || 'Empresa',
						quantidade: 0,
						total: 0,
						faturamentos: []
					};
				}
				
				agrupadas[chave].quantidade++;
				agrupadas[chave].total += parseFloat(faturamento.valor);
				agrupadas[chave].faturamentos.push(faturamento);
			});
			
			return Object.values(agrupadas).map(item => ({
				...item,
				media: item.total / item.quantidade
			})).sort((a, b) => b.periodo.localeCompare(a.periodo));
		}

		function agruparFaturamentoPorTrimestre(faturamentos, clientes, empresa) {
			const agrupadas = {};
			
			faturamentos.forEach(faturamento => {
				const [ano, mes] = faturamento.mes.split('-').map(Number);
				const trimestre = Math.ceil(mes / 3);
				const periodo = `${ano}-T${trimestre}`;
				const chave = periodo;
				
				if (!agrupadas[chave]) {
					agrupadas[chave] = {
						periodo: `${trimestre}º Trimestre ${ano}`,
						empresa: empresa === 'todas' ? 'Várias' : clientes.find(c => c.cnpj === empresa)?.nomeFantasia || 'Empresa',
						quantidade: 0,
						total: 0,
						registros: [] // Corrigido de "vendas" para "registros"
					};
				}
				
				agrupadas[chave].quantidade++;
				agrupadas[chave].total += parseFloat(faturamento.valor);
				agrupadas[chave].registros.push(faturamento);
			});
			
			return Object.values(agrupadas).map(item => ({
				...item,
				media: item.total / item.quantidade
			})).sort((a, b) => b.periodo.localeCompare(a.periodo));
		}

		function agruparFaturamentoPorSemestre(faturamentos, clientes, empresa) {
			const agrupadas = {};
			
			faturamentos.forEach(faturamento => {
				const [ano, mes] = faturamento.mes.split('-').map(Number);
				const semestre = mes <= 6 ? 1 : 2;
				const periodo = `${ano}-S${semestre}`;
				const chave = periodo;
				
				if (!agrupadas[chave]) {
					agrupadas[chave] = {
						periodo: `${semestre}º Semestre ${ano}`,
						empresa: empresa === 'todas' ? 'Várias' : clientes.find(c => c.cnpj === empresa)?.nomeFantasia || 'Empresa',
						quantidade: 0,
						total: 0,
						registros: [] // Corrigido de "vendas" para "registros"
					};
				}
				
				agrupadas[chave].quantidade++;
				agrupadas[chave].total += parseFloat(faturamento.valor);
				agrupadas[chave].registros.push(faturamento);
			});
			
			return Object.values(agrupadas).map(item => ({
				...item,
				media: item.total / item.quantidade
			})).sort((a, b) => b.periodo.localeCompare(a.periodo));
		}

		function agruparFaturamentoPorAno(faturamentos, clientes, empresa) {
			const agrupadas = {};
			
			faturamentos.forEach(faturamento => {
				const ano = faturamento.mes.split('-')[0];
				const chave = ano;
				
				if (!agrupadas[chave]) {
					agrupadas[chave] = {
						periodo: `Ano ${ano}`,
						empresa: empresa === 'todas' ? 'Várias' : clientes.find(c => c.cnpj === empresa)?.nomeFantasia || 'Empresa',
						quantidade: 0,
						total: 0,
						registros: [] // Corrigido de "vendas" para "registros"
					};
				}
				
				agrupadas[chave].quantidade++;
				agrupadas[chave].total += parseFloat(faturamento.valor);
				agrupadas[chave].registros.push(faturamento);
			});
			
			return Object.values(agrupadas).map(item => ({
				...item,
				media: item.total / item.quantidade
			})).sort((a, b) => b.periodo.localeCompare(a.periodo));
		}

		// Relatório de Impostos
		function gerarRelatorioImpostos(empresa, dataInicial, dataFinal) {
			const html = `
				<div class="text-center py-10 text-gray-400">
					<i class="fas fa-calculator text-3xl mb-3"></i>
					<p>Relatório de Impostos em desenvolvimento.</p>
					<p class="text-sm mt-1">Esta funcionalidade será implementada em breve.</p>
				</div>
			`;
			
			atualizarInterfaceRelatorio(html, 0);
			dadosRelatorioAtual = [];
		}

		// Relatório de Clientes
		function gerarRelatorioClientes() {
			const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
			const situacoes = JSON.parse(localStorage.getItem('situacoes')) || [];
			const vendas = JSON.parse(localStorage.getItem('faturamento')) || [];
			
			// Ordenar clientes por nome
			clientes.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia));
			
			let html = `
				<div class="mb-6">
					<h4 class="font-bold text-gray-800 text-lg mb-2">Relatório Completo de Clientes</h4>
					<p class="text-sm text-gray-600">
						Total de ${clientes.length} cliente(s) cadastrado(s)
					</p>
				</div>
			`;
			
			if (clientes.length === 0) {
				html += `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-users text-3xl mb-3"></i>
						<p>Nenhum cliente cadastrado no sistema.</p>
					</div>
				`;
			} else {
				// Estatísticas gerais
				const clientesComSituacao = clientes.filter(cliente => 
					situacoes.some(s => s.cnpjEmpresa === cliente.cnpj)
				).length;
				
				const clientesComVendas = clientes.filter(cliente => 
					vendas.some(v => v.cnpj === cliente.cnpj)
				).length;
				
				html += `
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
						<div class="bg-blue-50 p-4 rounded-lg border border-blue-100">
							<p class="text-sm text-blue-700 font-medium">Total de Clientes</p>
							<p class="text-2xl font-bold text-blue-800">${clientes.length}</p>
						</div>
						<div class="bg-green-50 p-4 rounded-lg border border-green-100">
							<p class="text-sm text-green-700 font-medium">Com Situação</p>
							<p class="text-2xl font-bold text-green-800">${clientesComSituacao}</p>
						</div>
						<div class="bg-purple-50 p-4 rounded-lg border border-purple-100">
							<p class="text-sm text-purple-700 font-medium">Com Vendas</p>
							<p class="text-2xl font-bold text-purple-800">${clientesComVendas}</p>
						</div>
					</div>
					
					<div class="overflow-x-auto">
						<table class="min-w-full divide-y divide-gray-200">
							<thead>
								<tr class="bg-gray-50">
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abertura</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Situação</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas</th>
									<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								${clientes.map(cliente => {
									const situacaoCliente = situacoes.filter(s => s.cnpjEmpresa === cliente.cnpj)
										.sort((a, b) => new Date(b.dataSituacao) - new Date(a.dataSituacao))[0];
									
									const vendasCliente = vendas.filter(v => v.cnpj === cliente.cnpj);
									const totalVendas = vendasCliente.reduce((sum, v) => sum + parseFloat(v.valor), 0);
									
									let status = 'inativo';
									if (situacaoCliente && vendasCliente.length > 0) status = 'ativo';
									else if (situacaoCliente) status = 'cadastrado';
									
									let statusClass = 'bg-gray-100 text-gray-800';
									if (status === 'ativo') statusClass = 'bg-green-100 text-green-800';
									else if (status === 'cadastrado') statusClass = 'bg-blue-100 text-blue-800';
									
									return `
										<tr class="hover:bg-gray-50">
											<td class="px-4 py-3">
												<div class="font-medium text-gray-900">${cliente.nomeFantasia}</div>
												<div class="text-xs text-gray-500">${cliente.razaoSocial || 'Sem razão social'}</div>
											</td>
											<td class="px-4 py-3 text-sm text-gray-900">${formatarCNPJ(cliente.cnpj)}</td>
											<td class="px-4 py-3 text-sm text-gray-900">${formatarData(cliente.dataAbertura)}</td>
											<td class="px-4 py-3">
												${situacaoCliente ? `
													<div class="flex flex-col">
														<span class="text-xs px-2 py-0.5 ${situacaoCliente.tributacao === 'simples' ? 'bg-green-100 text-green-800' : situacaoCliente.tributacao === 'presumido' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'} rounded-full capitalize inline-block mb-1">
															${situacaoCliente.tributacao}
														</span>
														<span class="text-xs text-gray-500">${formatarData(situacaoCliente.dataSituacao)}</span>
													</div>
												` : '<span class="text-xs text-gray-400">Nenhuma</span>'}
											</td>
											<td class="px-4 py-3">
												${vendasCliente.length > 0 ? `
													<div class="flex flex-col">
														<span class="text-sm font-medium text-gray-900">${vendasCliente.length} registro(s)</span>
														<span class="text-xs text-green-600">${formatarMoeda(totalVendas)}</span>
													</div>
												` : '<span class="text-xs text-gray-400">Nenhuma</span>'}
											</td>
											<td class="px-4 py-3">
												<span class="text-xs px-2 py-1 ${statusClass} rounded-full capitalize">
													${status}
												</span>
											</td>
										</tr>
									`;
								}).join('')}
							</tbody>
						</table>
					</div>
				`;
			}
			
			// Atualizar interface
			atualizarInterfaceRelatorio(html, clientes.length);
			dadosRelatorioAtual = clientes;
			
			// Atualizar período atual
			const periodoAtual = document.getElementById('periodoAtual');
			periodoAtual.textContent = `Data do relatório: ${formatarDataCompleta(new Date())}`;
		}

		// Atualizar interface do relatório
		function atualizarInterfaceRelatorio(conteudoHTML, totalRegistros) {
			const conteudoRelatorio = document.getElementById('conteudoRelatorio');
			const totalRegistrosElement = document.getElementById('totalRegistros');
			const resumoEstatistico = document.getElementById('resumoEstatistico');
			const containerGrafico = document.getElementById('containerGrafico');
			
			// Atualizar conteúdo
			conteudoRelatorio.innerHTML = conteudoHTML;
			totalRegistrosElement.textContent = `${totalRegistros} registro(s)`;
			
			// Mostrar/ocultar resumo estatístico baseado no tipo de relatório
			if (tipoRelatorioAtual === 'faturamento' && totalRegistros > 0) {
				resumoEstatistico.classList.remove('hidden');
			} else {
				resumoEstatistico.classList.add('hidden');
			}
			
			// Ocultar gráfico por enquanto (pode ser implementado depois)
			containerGrafico.classList.add('hidden');
		}

		// Atualizar estatísticas de vendas
		function atualizarEstatisticasFaturamento(total, media, maior, vendas) {
			document.getElementById('totalVendas').textContent = formatarMoeda(total);
			document.getElementById('mediaVendas').textContent = formatarMoeda(media);
			document.getElementById('maiorVenda').textContent = formatarMoeda(maior);
			
			// Calcular crescimento (comparando com período anterior)
			if (vendas.length >= 2) {
				const vendasOrdenadas = [...vendas].sort((a, b) => a.mes.localeCompare(b.mes));
				const primeiroPeriodo = vendasOrdenadas.slice(0, Math.floor(vendasOrdenadas.length / 2));
				const segundoPeriodo = vendasOrdenadas.slice(Math.floor(vendasOrdenadas.length / 2));
				
				const totalPrimeiro = primeiroPeriodo.reduce((sum, v) => sum + parseFloat(v.valor), 0);
				const totalSegundo = segundoPeriodo.reduce((sum, v) => sum + parseFloat(v.valor), 0);
				
				let crescimento = 0;
				if (totalPrimeiro > 0) {
					crescimento = ((totalSegundo - totalPrimeiro) / totalPrimeiro) * 100;
				}
				
				document.getElementById('crescimento').textContent = `${crescimento.toFixed(1)}%`;
				if (crescimento > 0) {
					document.getElementById('crescimento').className = "text-2xl font-bold text-green-800";
				} else if (crescimento < 0) {
					document.getElementById('crescimento').className = "text-2xl font-bold text-red-800";
				} else {
					document.getElementById('crescimento').className = "text-2xl font-bold text-orange-800";
				}
			} else {
				document.getElementById('crescimento').textContent = "N/A";
			}
		}
		// ========== FUNÇÕES DE FORMATAÇÃO ==========

		function formatarMesAno(dataString) {
			if (!dataString) return '';
			const [ano, mes] = dataString.split('-');
			const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
			return `${meses[parseInt(mes) - 1]}/${ano}`;
		}

		function formatarDataCompleta(data) {
			return data.toLocaleDateString('pt-BR', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});
		}

		function formatarCNPJ(cnpj) {
			if (!cnpj) return '';
			return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
		}

		function formatarData(data) {
			if (!data) return '';
			
			try {
				// Tenta diferentes formatos de data
				let date;
				
				if (data.includes('T')) {
					// Formato ISO (com data e hora)
					date = new Date(data);
				} else if (data.includes('/')) {
					// Formato brasileiro DD/MM/YYYY
					const [dia, mes, ano] = data.split('/');
					date = new Date(ano, mes - 1, dia);
				} else {
					// Formato YYYY-MM-DD
					date = new Date(data + 'T00:00:00');
				}
				
				// Verifica se a data é válida
				if (isNaN(date.getTime())) {
					return data; // Retorna a string original se não conseguir converter
				}
				
				return date.toLocaleDateString('pt-BR');
			} catch (error) {
				console.error('Erro ao formatar data:', error, data);
				return data;
			}
		}

		function formatarDataHora(data) {
			if (!data) return '';
			
			try {
				const date = new Date(data);
				
				// Verifica se a data é válida
				if (isNaN(date.getTime())) {
					return data; // Retorna a string original se não conseguir converter
				}
				
				return date.toLocaleString('pt-BR');
			} catch (error) {
				console.error('Erro ao formatar data/hora:', error, data);
				return data;
			}
		}

		function formatarMesAno(mesAno) {
			if (!mesAno) return '';
			
			try {
				const [ano, mes] = mesAno.split('-');
				if (!ano || !mes) return mesAno;
				
				const meses = [
					'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
					'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
				];
				
				const mesNumero = parseInt(mes);
				if (mesNumero < 1 || mesNumero > 12) return mesAno;
				
				return `${meses[mesNumero - 1]}/${ano}`;
			} catch (error) {
				console.error('Erro ao formatar mês/ano:', error, mesAno);
				return mesAno;
			}
		}

		function formatarMoeda(valor) {
			if (valor === undefined || valor === null || isNaN(valor)) return 'R$ 0,00';
			
			try {
				return 'R$ ' + valor.toLocaleString('pt-BR', { 
					minimumFractionDigits: 2, 
					maximumFractionDigits: 2 
				});
			} catch (error) {
				console.error('Erro ao formatar moeda:', error, valor);
				return 'R$ 0,00';
			}
		}

		// Exportar relatório para PDF
		function exportarRelatorioPDF() {
			if (!dadosRelatorioAtual || dadosRelatorioAtual.length === 0) {
				mostrarMensagem("Não há dados para exportar. Gere um relatório primeiro.", 'warning');
				return;
			}
			
			// Usar uma biblioteca como jsPDF ou html2pdf
			// Aqui está uma implementação simplificada
			
			mostrarMensagem("Exportação para PDF em desenvolvimento. Use a exportação Excel por enquanto.", 'info');
		}

		// Exportar relatório para Excel
		function exportarRelatorioExcel() {
			if (!dadosRelatorioAtual || dadosRelatorioAtual.length === 0) {
				mostrarMensagem("Não há dados para exportar. Gere um relatório primeiro.", 'warning');
				return;
			}
			
			// Criar CSV
			let csvContent = "data:text/csv;charset=utf-8,";
			
			// Adicionar cabeçalho baseado no tipo de relatório
			if (tipoRelatorioAtual === 'vendas') {
				csvContent += "Mês,Empresa,Valor,Data Registro\n";
				dadosRelatorioAtual.forEach(venda => {
					const empresa = JSON.parse(localStorage.getItem('clientes')).find(c => c.cnpj === venda.cnpj)?.nomeFantasia || 'Desconhecida';
					csvContent += `${venda.mes},${empresa},${venda.valor},${new Date().toISOString()}\n`;
				});
			} else if (tipoRelatorioAtual === 'situacoes') {
				csvContent += "Data Situação,CNPJ Empresa,Regime,Anexo,Endereço\n";
				dadosRelatorioAtual.forEach(situacao => {
					csvContent += `${situacao.dataSituacao},${situacao.cnpjEmpresa},${situacao.tributacao},${situacao.anexo || ''},${situacao.endereco}\n`;
				});
			} else if (tipoRelatorioAtual === 'clientes') {
				csvContent += "Nome Fantasia,Razão Social,CNPJ,Data Abertura,IE,IM\n";
				dadosRelatorioAtual.forEach(cliente => {
					csvContent += `${cliente.nomeFantasia},${cliente.razaoSocial},${cliente.cnpj},${cliente.dataAbertura},${cliente.ie || ''},${cliente.im || ''}\n`;
				});
			}
			
			// Criar link de download
			const encodedUri = encodeURI(csvContent);
			const link = document.createElement("a");
			link.setAttribute("href", encodedUri);
			link.setAttribute("download", `relatorio_${tipoRelatorioAtual}_${new Date().toISOString().slice(0, 10)}.csv`);
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			
			mostrarMensagem("Relatório exportado para Excel com sucesso!", 'success');
		}
		
		// ====================================================
		// PARAMETRIZAÇÃO - SIMPLES NACIONAL COM VIGÊNCIA
		// ====================================================

		// Variáveis para controle dos formulários
		let formularioSimplesAberto = false;
		let formularioPresumidoAberto = false;
		let formularioRealAberto = false;
		
		// Função para calcular soma da repartição
		function calcularSomaReparticao() {
			const campos = ['repIRPJ', 'repCSLL', 'repCOFINS', 'repPIS', 'repCPP', 'repICMS', 'repISS', 'repIPI', 'repINSS'];
			let soma = 0;
			
			campos.forEach(id => {
				const input = document.getElementById(id);
				if (input) {
					const valor = parseFloat(input.value) || 0;
					soma += valor;
				}
			});
			
			const somaElement = document.getElementById('somaReparticao');
			const statusElement = document.getElementById('statusReparticao');
			
			if (somaElement) {
				somaElement.textContent = `Soma: ${soma.toFixed(2)}%`;
				
				if (Math.abs(soma - 100) < 0.01) {
					somaElement.className = "text-xs font-bold text-green-600";
					if (statusElement) {
						statusElement.textContent = "✅ Soma correta (100%)";
						statusElement.className = "text-xs text-green-600";
						statusElement.classList.remove('hidden');
					}
				} else if (soma < 100) {
					somaElement.className = "text-xs font-bold text-yellow-600";
					if (statusElement) {
						statusElement.textContent = `⚠️ Faltam ${(100 - soma).toFixed(2)}%`;
						statusElement.className = "text-xs text-yellow-600";
						statusElement.classList.remove('hidden');
					}
				} else {
					somaElement.className = "text-xs font-bold text-red-600";
					if (statusElement) {
						statusElement.textContent = `❌ Excesso de ${(soma - 100).toFixed(2)}%`;
						statusElement.className = "text-xs text-red-600";
						statusElement.classList.remove('hidden');
					}
				}
			}
		}

		// Função para mostrar/ocultar formulário Simples Nacional
		function toggleFormularioSimples() {
			const container = document.getElementById('containerFormFaixaSimples');
			const botao = document.getElementById('novaFaixaSimples');
			
			if (formularioSimplesAberto) {
				container.classList.add('hidden');
				botao.innerHTML = '<i class="fas fa-plus mr-1"></i> Nova Faixa';
				botao.classList.remove('bg-red-600');
				botao.classList.add('bg-brand-600');
			} else {
				// Fechar outros formulários se abertos
				if (formularioPresumidoAberto) toggleFormularioPresumido();
				if (formularioRealAberto) toggleFormularioReal();
				
				container.classList.remove('hidden');
				botao.innerHTML = '<i class="fas fa-times mr-1"></i> Cancelar';
				botao.classList.remove('bg-brand-600');
				botao.classList.add('bg-red-600');
				
				// Rolar até o formulário
				container.scrollIntoView({ behavior: 'smooth' });
			}
			
			formularioSimplesAberto = !formularioSimplesAberto;
		}

		// Função para mostrar/ocultar formulário Lucro Presumido
		function toggleFormularioPresumido() {
			const container = document.getElementById('containerFormPresumido');
			const botao = document.getElementById('novaConfigPresumido');
			
			if (formularioPresumidoAberto) {
				container.classList.add('hidden');
				botao.innerHTML = '<i class="fas fa-plus mr-1"></i> Nova Configuração';
				botao.classList.remove('bg-red-600');
				botao.classList.add('bg-brand-600');
			} else {
				// Fechar outros formulários se abertos
				if (formularioSimplesAberto) toggleFormularioSimples();
				if (formularioRealAberto) toggleFormularioReal();
				
				container.classList.remove('hidden');
				botao.innerHTML = '<i class="fas fa-times mr-1"></i> Cancelar';
				botao.classList.remove('bg-brand-600');
				botao.classList.add('bg-red-600');
				
				// Rolar até o formulário
				container.scrollIntoView({ behavior: 'smooth' });
			}
			
			formularioPresumidoAberto = !formularioPresumidoAberto;
		}

		// Função para mostrar/ocultar formulário Lucro Real
		function toggleFormularioReal() {
			const container = document.getElementById('containerFormReal');
			const botao = document.getElementById('novaConfigReal');
			
			if (formularioRealAberto) {
				container.classList.add('hidden');
				botao.innerHTML = '<i class="fas fa-plus mr-1"></i> Nova Configuração';
				botao.classList.remove('bg-red-600');
				botao.classList.add('bg-brand-600');
			} else {
				// Fechar outros formulários se abertos
				if (formularioSimplesAberto) toggleFormularioSimples();
				if (formularioPresumidoAberto) toggleFormularioPresumido();
				
				container.classList.remove('hidden');
				botao.innerHTML = '<i class="fas fa-times mr-1"></i> Cancelar';
				botao.classList.remove('bg-brand-600');
				botao.classList.add('bg-red-600');
				
				// Rolar até o formulário
				container.scrollIntoView({ behavior: 'smooth' });
			}
			
			formularioRealAberto = !formularioRealAberto;
		}

		// Função para limpar e fechar formulário Simples
		function limparFormularioSimples() {
			document.getElementById('formFaixaSimples').reset();
			document.getElementById('faixaId').value = '';
			calcularSomaReparticao();
			if (formularioSimplesAberto) toggleFormularioSimples();
		}

		// Função para limpar e fechar formulário Presumido
		function limparFormularioPresumido() {
			document.getElementById('formPresumido').reset();
			document.getElementById('configPresumidoId').value = '';
			if (formularioPresumidoAberto) toggleFormularioPresumido();
		}

		// Função para limpar e fechar formulário Real
		function limparFormularioReal() {
			document.getElementById('formReal').reset();
			document.getElementById('configRealId').value = '';
			if (formularioRealAberto) toggleFormularioReal();
		}

		// Função para salvar faixa do Simples Nacional com vigência
		function salvarFaixaSimples(e) {
			e.preventDefault();
			
			// Coletar dados básicos
			const id = document.getElementById('faixaId').value;
			const anexo = document.getElementById('faixaAnexo').value;
			const vigencia = document.getElementById('faixaVigencia').value; // formato YYYY-MM
			const nome = document.getElementById('faixaNome').value;
			const aliquota = parseFloat(document.getElementById('faixaAliquota').value);
			const inicio = parseFloat(document.getElementById('faixaInicio').value);
			const fim = parseFloat(document.getElementById('faixaFim').value);
			const deduzir = parseFloat(document.getElementById('faixaDeduzir').value);
			
			// Validações
			if (!vigencia) {
				mostrarMensagem("Informe a vigência da faixa.", 'error');
				return;
			}
			
			if (inicio >= fim) {
				mostrarMensagem("O valor de RBT Início deve ser menor que RBT Fim.", 'error');
				return;
			}
			
			if (aliquota <= 0 || aliquota > 100) {
				mostrarMensagem("Alíquota deve ser maior que 0% e menor ou igual a 100%.", 'error');
				return;
			}
			
			// Coletar repartição
			const reparticao = {
				IRPJ: parseFloat(document.getElementById('repIRPJ').value) || 0,
				CSLL: parseFloat(document.getElementById('repCSLL').value) || 0,
				COFINS: parseFloat(document.getElementById('repCOFINS').value) || 0,
				PIS: parseFloat(document.getElementById('repPIS').value) || 0,
				CPP: parseFloat(document.getElementById('repCPP').value) || 0,
				ICMS: parseFloat(document.getElementById('repICMS').value) || 0,
				ISS: parseFloat(document.getElementById('repISS').value) || 0,
				IPI: parseFloat(document.getElementById('repIPI').value) || 0,
				INSS: parseFloat(document.getElementById('repINSS').value) || 0
			};
			
			// Validar soma da repartição
			const somaReparticao = Object.values(reparticao).reduce((a, b) => a + b, 0);
			if (Math.abs(somaReparticao - 100) > 0.01) {
				mostrarMensagem(`A soma da repartição (${somaReparticao.toFixed(2)}%) deve ser igual a 100%`, 'error');
				return;
			}
			
			const novaFaixa = {
				id: id || Date.now().toString(),
				anexo,
				vigencia,
				nome,
				aliquota,
				inicio,
				fim,
				deduzir,
				reparticao,
				dataCriacao: new Date().toISOString()
			};
			
			let faixas = JSON.parse(localStorage.getItem('paramFaixasSimples')) || [];
			
			if (id) {
				// Edição
				const index = faixas.findIndex(f => f.id === id);
				if (index !== -1) {
					faixas[index] = novaFaixa;
					mostrarMensagem("Faixa atualizada com sucesso!");
				}
			} else {
				// Verificar se já existe uma faixa para o mesmo anexo, mesma vigência e intervalo sobreposto
				const conflito = faixas.find(f => 
					f.anexo === anexo && 
					f.vigencia === vigencia &&
					((inicio >= f.inicio && inicio <= f.fim) || 
					 (fim >= f.inicio && fim <= f.fim) || 
					 (inicio <= f.inicio && fim >= f.fim))
				);
				
				if (conflito) {
					mostrarMensagem(`Já existe uma faixa para o Anexo ${anexo} na vigência ${vigencia} com intervalo sobreposto.`, 'error');
					return;
				}
				
				faixas.push(novaFaixa);
				mostrarMensagem("Nova faixa cadastrada com sucesso!");
			}
			
			localStorage.setItem('paramFaixasSimples', JSON.stringify(faixas));
			carregarFaixasSimples();
			limparFormularioSimples();
		}

		// Função para carregar faixas do Simples Nacional agrupadas por anexo e vigência
		function carregarFaixasSimples() {
			const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples')) || [];
			const lista = document.getElementById('listaFaixasSimples');
			if (!lista) return;
			
			lista.innerHTML = '';
			
			if (faixas.length === 0) {
				lista.innerHTML = `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-folder-open text-3xl mb-3"></i>
						<p>Nenhuma faixa cadastrada.</p>
						<p class="text-sm mt-2">Clique em "Nova Faixa" para começar.</p>
					</div>
				`;
				return;
			}
			
			// Agrupar faixas por anexo e depois por vigência
			const faixasPorAnexo = {};
			
			faixas.forEach(faixa => {
				if (!faixasPorAnexo[faixa.anexo]) {
					faixasPorAnexo[faixa.anexo] = {};
				}
				if (!faixasPorAnexo[faixa.anexo][faixa.vigencia]) {
					faixasPorAnexo[faixa.anexo][faixa.vigencia] = [];
				}
				faixasPorAnexo[faixa.anexo][faixa.vigencia].push(faixa);
			});
			
			// Ordenar anexos
			const anexosOrdenados = Object.keys(faixasPorAnexo).sort();
			
			anexosOrdenados.forEach(anexo => {
				// Criar container do anexo
				const anexoContainer = document.createElement('div');
				anexoContainer.className = "bg-white rounded-xl border border-gray-200 p-6 mb-6";
				
				let anexoNome = '';
				switch(anexo) {
					case 'I': anexoNome = 'Anexo I - Comércio'; break;
					case 'II': anexoNome = 'Anexo II - Indústria'; break;
					case 'III': anexoNome = 'Anexo III - Serviços'; break;
					case 'IV': anexoNome = 'Anexo IV - Serviços (+)'; break;
					case 'V': anexoNome = 'Anexo V - Serviços (++)'; break;
					default: anexoNome = `Anexo ${anexo}`;
				}
				
				anexoContainer.innerHTML = `
					<div class="flex items-center justify-between mb-4">
						<h4 class="font-bold text-lg text-gray-800">${anexoNome}</h4>
						<button onclick="adicionarFaixaNoAnexo('${anexo}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded">
							<i class="fas fa-plus mr-1"></i>Adicionar Faixa
						</button>
					</div>
				`;
				
				// Ordenar vigencias (da mais recente para a mais antiga)
				const vigenciasOrdenadas = Object.keys(faixasPorAnexo[anexo]).sort().reverse();
				
				vigenciasOrdenadas.forEach(vigencia => {
					const faixasVigencia = faixasPorAnexo[anexo][vigencia];
					
					// Ordenar faixas por RBT início (crescente)
					faixasVigencia.sort((a, b) => a.inicio - b.inicio);
					
					const vigenciaContainer = document.createElement('div');
					vigenciaContainer.className = "mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200";
					
					// Formatar a vigência para exibição
					const [ano, mes] = vigencia.split('-');
					const vigenciaFormatada = `${mes}/${ano}`;
					
					let faixasHTML = '';
					faixasVigencia.forEach(faixa => {
						// Calcular soma da repartição
						const somaReparticao = faixa.reparticao ? 
							Object.values(faixa.reparticao).reduce((a, b) => a + b, 0) : 0;
						
						let reparticaoHTML = '';
						if (faixa.reparticao) {
							const tributosComValor = Object.entries(faixa.reparticao)
								.filter(([_, valor]) => valor > 0)
								.map(([tributo, valor]) => ({ tributo, valor }));
							
							if (tributosComValor.length > 0) {
								reparticaoHTML = `
									<div class="mt-2 pt-2 border-t border-gray-100">
										<p class="text-xs font-medium text-gray-600 mb-1">Repartição:</p>
										<div class="flex flex-wrap gap-1">
											${tributosComValor.map(t => `
												<span class="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
													${t.tributo}: ${t.valor.toFixed(2)}%
												</span>
											`).join('')}
										</div>
									</div>
								`;
							}
						}
						
						faixasHTML += `
							<div class="p-3 bg-white rounded border border-gray-200 mb-2 last:mb-0 hover:bg-gray-50">
								<div class="flex justify-between items-start">
									<div class="flex-1">
										<div class="flex items-center gap-2 mb-1">
											<span class="font-medium text-gray-800">${faixa.nome}</span>
											<span class="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
												${faixa.aliquota}%
											</span>
										</div>
										<p class="text-sm text-gray-600">
											RBT de ${formatarMoeda(faixa.inicio)} até ${formatarMoeda(faixa.fim)}
										</p>
										<p class="text-xs text-gray-500">
											Dedução: ${formatarMoeda(faixa.deduzir)}
										</p>
										${reparticaoHTML}
									</div>
									<div class="flex gap-2 ml-4">
										<button onclick="editarFaixaSimples('${faixa.id}')" class="text-brand-600 hover:bg-brand-50 p-1.5 rounded" title="Editar">
											<i class="fas fa-edit"></i>
										</button>
										<button onclick="excluirFaixaSimples('${faixa.id}')" class="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Excluir">
											<i class="fas fa-trash"></i>
										</button>
									</div>
								</div>
							</div>
						`;
					});
					
					vigenciaContainer.innerHTML = `
						<div class="flex justify-between items-center mb-3">
							<div class="flex items-center gap-2">
								<span class="font-bold text-gray-700">Vigência a partir de ${vigenciaFormatada}</span>
								<span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
									${faixasVigencia.length} faixa(s)
								</span>
							</div>							
						</div>
						<div>${faixasHTML}</div>
					`;
					
					anexoContainer.appendChild(vigenciaContainer);
				});
				
				lista.appendChild(anexoContainer);
			});
		}

		// Função para adicionar faixa em um anexo específico
		function adicionarFaixaNoAnexo(anexo) {
			document.getElementById('faixaAnexo').value = anexo;
			
			// Definir vigência padrão como mês atual
			const hoje = new Date();
			const mesAtual = hoje.toISOString().slice(0, 7); // YYYY-MM
			document.getElementById('faixaVigencia').value = mesAtual;
			
			if (!formularioSimplesAberto) toggleFormularioSimples();
		}

		// Função para adicionar faixa em uma vigência específica
		function adicionarFaixaNaVigencia(anexo, vigencia) {
			document.getElementById('faixaAnexo').value = anexo;
			document.getElementById('faixaVigencia').value = vigencia;
			
			if (!formularioSimplesAberto) toggleFormularioSimples();
		}

		// Função para editar faixa do Simples Nacional
		function editarFaixaSimples(id) {
			const faixas = JSON.parse(localStorage.getItem('paramFaixasSimples')) || [];
			const faixa = faixas.find(f => f.id === id);
			
			if (!faixa) return;
			
			// Preencher formulário
			document.getElementById('faixaId').value = faixa.id;
			document.getElementById('faixaAnexo').value = faixa.anexo;
			document.getElementById('faixaVigencia').value = faixa.vigencia;
			document.getElementById('faixaNome').value = faixa.nome;
			document.getElementById('faixaAliquota').value = faixa.aliquota;
			document.getElementById('faixaInicio').value = faixa.inicio;
			document.getElementById('faixaFim').value = faixa.fim;
			document.getElementById('faixaDeduzir').value = faixa.deduzir;
			
			// Preencher repartição
			if (faixa.reparticao) {
				document.getElementById('repIRPJ').value = faixa.reparticao.IRPJ || 0;
				document.getElementById('repCSLL').value = faixa.reparticao.CSLL || 0;
				document.getElementById('repCOFINS').value = faixa.reparticao.COFINS || 0;
				document.getElementById('repPIS').value = faixa.reparticao.PIS || 0;
				document.getElementById('repCPP').value = faixa.reparticao.CPP || 0;
				document.getElementById('repICMS').value = faixa.reparticao.ICMS || 0;
				document.getElementById('repISS').value = faixa.reparticao.ISS || 0;
				document.getElementById('repIPI').value = faixa.reparticao.IPI || 0;
				document.getElementById('repINSS').value = faixa.reparticao.INSS || 0;
			}
			
			// Atualizar soma da repartição
			calcularSomaReparticao();
			
			if (!formularioSimplesAberto) toggleFormularioSimples();
			
			mostrarMensagem("Faixa carregada para edição", 'warning');
		}

		// Função para excluir faixa do Simples Nacional
		function excluirFaixaSimples(id) {
			mostrarModalConfirmacao(
				"Excluir Faixa",
				"Tem certeza que deseja excluir esta faixa do Simples Nacional?",
				() => {
					let faixas = JSON.parse(localStorage.getItem('paramFaixasSimples')) || [];
					faixas = faixas.filter(f => f.id !== id);
					localStorage.setItem('paramFaixasSimples', JSON.stringify(faixas));
					carregarFaixasSimples();
					mostrarMensagem("Faixa excluída com sucesso!");
				},
				false,
				true
			);
		}

		// ====================================================
		// PARAMETRIZAÇÃO - LUCRO PRESUMIDO COM VIGÊNCIA
		// ====================================================

		// Função para salvar configuração do Lucro Presumido
		function salvarConfigPresumido(e) {
			e.preventDefault();
			
			const id = document.getElementById('configPresumidoId').value;
			const vigencia = document.getElementById('presumidoVigencia').value;
			const nome = document.getElementById('presumidoNome').value;
			const atividade = document.getElementById('presumidoAtividade').value;
			const tipo = document.getElementById('presumidoTipo').value;
			
			if (!vigencia) {
				mostrarMensagem("Informe a vigência da configuração.", 'error');
				return;
			}
			
			const config = {
				id: id || Date.now().toString(),
				vigencia,
				nome,
				atividade: atividade || '',
				tipo,
				presuncaoIRPJ: parseFloat(document.getElementById('presumidoPresuncaoIRPJ').value),
				aliquotaIRPJ: parseFloat(document.getElementById('presumidoAliquotaIRPJ').value),
				adicionalIRPJ: parseFloat(document.getElementById('presumidoAdicionalIRPJ').value),
				presuncaoCSLL: parseFloat(document.getElementById('presuncaoCSLL').value),
				aliquotaCSLL: parseFloat(document.getElementById('presumidoAliquotaCSLL').value),
				PISCOFINS: parseFloat(document.getElementById('presumidoPISCOFINS').value),
				ISS: parseFloat(document.getElementById('presumidoISS').value),
				ICMS: parseFloat(document.getElementById('presumidoICMS').value),
				dataCriacao: new Date().toISOString()
			};
			
			let configs = JSON.parse(localStorage.getItem('paramPresumido')) || [];
			
			if (id) {
				const index = configs.findIndex(c => c.id === id);
				if (index !== -1) {
					configs[index] = config;
					mostrarMensagem("Configuração atualizada!");
				}
			} else {
				configs.push(config);
				mostrarMensagem("Configuração salva!");
			}
			
			localStorage.setItem('paramPresumido', JSON.stringify(configs));
			carregarConfigsPresumido();
			limparFormularioPresumido();
		}

		// Função para carregar configurações do Lucro Presumido
		function carregarConfigsPresumido() {
			const configs = JSON.parse(localStorage.getItem('paramPresumido')) || [];
			const lista = document.getElementById('listaConfigsPresumido');
			if (!lista) return;
			
			lista.innerHTML = '';
			
			if (configs.length === 0) {
				lista.innerHTML = `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-chart-bar text-3xl mb-3"></i>
						<p>Nenhuma configuração cadastrada.</p>
						<p class="text-sm mt-2">Clique em "Nova Configuração" para começar.</p>
					</div>
				`;
				return;
			}
			
			// Agrupar configurações por vigência (mais recente primeiro)
			configs.sort((a, b) => b.vigencia.localeCompare(a.vigencia));
			
			// Agrupar por vigência
			const configsPorVigencia = {};
			configs.forEach(config => {
				if (!configsPorVigencia[config.vigencia]) {
					configsPorVigencia[config.vigencia] = [];
				}
				configsPorVigencia[config.vigencia].push(config);
			});
			
			Object.entries(configsPorVigencia).forEach(([vigencia, configsVigencia]) => {
				const [ano, mes] = vigencia.split('-');
				const vigenciaFormatada = `${mes}/${ano}`;
				
				const vigenciaContainer = document.createElement('div');
				vigenciaContainer.className = "bg-white rounded-xl border border-gray-200 p-6 mb-6";
				
				vigenciaContainer.innerHTML = `
					<div class="flex justify-between items-center mb-4">
						<h4 class="font-bold text-lg text-gray-800">Vigência a partir de ${vigenciaFormatada}</h4>
						<button onclick="adicionarConfigPresumidoVigencia('${vigencia}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded">
							<i class="fas fa-plus mr-1"></i>Adicionar Configuração
						</button>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="configs-${vigencia}"></div>
				`;
				
				const containerConfigs = vigenciaContainer.querySelector(`#configs-${vigencia}`);
				
				configsVigencia.forEach(config => {
					const div = document.createElement('div');
					div.className = "bg-gray-50 p-4 rounded-lg border border-gray-200";
					
					div.innerHTML = `
						<div class="flex justify-between items-start mb-3">
							<div>
								<h5 class="font-bold text-gray-800">${config.nome}</h5>
								${config.atividade ? `<p class="text-sm text-gray-600">${config.atividade}</p>` : ''}
								<span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full mt-1 inline-block">
									${config.tipo}
								</span>
							</div>
							<div class="flex gap-2">
								<button onclick="editarConfigPresumido('${config.id}')" class="text-brand-600 hover:bg-brand-50 p-1.5 rounded">
									<i class="fas fa-edit"></i>
								</button>
								<button onclick="excluirConfigPresumido('${config.id}')" class="text-red-500 hover:bg-red-50 p-1.5 rounded" title="Excluir">
									<i class="fas fa-trash"></i>
								</button>
							</div>
						</div>
						
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="font-medium">Presunção IRPJ:</span>
								<span class="text-blue-600 ml-1">${config.presuncaoIRPJ}%</span>
							</div>
							<div>
								<span class="font-medium">Alíquota IRPJ:</span>
								<span class="text-blue-600 ml-1">${config.aliquotaIRPJ}%</span>
							</div>
							<div>
								<span class="font-medium">Adicional IRPJ:</span>
								<span class="text-blue-600 ml-1">${config.adicionalIRPJ}%</span>
							</div>
							<div>
								<span class="font-medium">Presunção CSLL:</span>
								<span class="text-green-600 ml-1">${config.presuncaoCSLL}%</span>
							</div>
							<div>
								<span class="font-medium">Alíquota CSLL:</span>
								<span class="text-green-600 ml-1">${config.aliquotaCSLL}%</span>
							</div>
							<div>
								<span class="font-medium">PIS/COFINS:</span>
								<span class="text-purple-600 ml-1">${config.PISCOFINS}%</span>
							</div>
							${config.ISS > 0 ? `
							<div>
								<span class="font-medium">ISS:</span>
								<span class="text-orange-600 ml-1">${config.ISS}%</span>
							</div>` : ''}
							${config.ICMS > 0 ? `
							<div>
								<span class="font-medium">ICMS:</span>
								<span class="text-red-600 ml-1">${config.ICMS}%</span>
							</div>` : ''}
						</div>
					`;
					
					containerConfigs.appendChild(div);
				});
				
				lista.appendChild(vigenciaContainer);
			});
		}

		// Função para adicionar configuração em uma vigência específica
		function adicionarConfigPresumidoVigencia(vigencia) {
			document.getElementById('presumidoVigencia').value = vigencia;
			
			if (!formularioPresumidoAberto) toggleFormularioPresumido();
		}

		// Função para editar configuração do Lucro Presumido
		function editarConfigPresumido(id) {
			const configs = JSON.parse(localStorage.getItem('paramPresumido')) || [];
			const config = configs.find(c => c.id === id);
			
			if (!config) return;
			
			document.getElementById('configPresumidoId').value = config.id;
			document.getElementById('presumidoVigencia').value = config.vigencia;
			document.getElementById('presumidoNome').value = config.nome;
			document.getElementById('presumidoAtividade').value = config.atividade || '';
			document.getElementById('presumidoTipo').value = config.tipo || 'servicos';
			document.getElementById('presumidoPresuncaoIRPJ').value = config.presuncaoIRPJ;
			document.getElementById('presumidoAliquotaIRPJ').value = config.aliquotaIRPJ;
			document.getElementById('presumidoAdicionalIRPJ').value = config.adicionalIRPJ;
			document.getElementById('presuncaoCSLL').value = config.presuncaoCSLL;
			document.getElementById('presumidoAliquotaCSLL').value = config.aliquotaCSLL;
			document.getElementById('presumidoPISCOFINS').value = config.PISCOFINS;
			document.getElementById('presumidoISS').value = config.ISS || 0;
			document.getElementById('presumidoICMS').value = config.ICMS || 0;
			
			if (!formularioPresumidoAberto) toggleFormularioPresumido();
			
			mostrarMensagem("Configuração carregada para edição", 'warning');
		}

		// Função para excluir configuração do Lucro Presumido
		function excluirConfigPresumido(id) {
			mostrarModalConfirmacao(
				"Excluir Configuração",
				"Tem certeza que deseja excluir esta configuração?",
				() => {
					let configs = JSON.parse(localStorage.getItem('paramPresumido')) || [];
					configs = configs.filter(c => c.id !== id);
					localStorage.setItem('paramPresumido', JSON.stringify(configs));
					carregarConfigsPresumido();
					mostrarMensagem("Configuração excluída!");
				},
				false,
				true
			);
		}

		// ====================================================
		// PARAMETRIZAÇÃO - LUCRO REAL COM VIGÊNCIA
		// ====================================================

		// Função para salvar configuração do Lucro Real
		function salvarConfigReal(e) {
			e.preventDefault();
			
			const id = document.getElementById('configRealId').value;
			const vigencia = document.getElementById('realVigencia').value;
			const nome = document.getElementById('realNome').value;
			const atividade = document.getElementById('realAtividade').value;
			const tipo = document.getElementById('realTipo').value;
			
			if (!vigencia) {
				mostrarMensagem("Informe a vigência da configuração.", 'error');
				return;
			}
			
			const config = {
				id: id || Date.now().toString(),
				vigencia,
				nome,
				atividade: atividade || '',
				tipo,
				aliquotaIRPJ: parseFloat(document.getElementById('realAliquotaIRPJ').value),
				adicionalIRPJ: parseFloat(document.getElementById('realAdicionalIRPJ').value),
				aliquotaCSLL: parseFloat(document.getElementById('realAliquotaCSLL').value),
				PIS: parseFloat(document.getElementById('realPIS').value),
				COFINS: parseFloat(document.getElementById('realCOFINS').value),
				CSLLAdicional: parseFloat(document.getElementById('realCSLLAdicional').value) || 0,
				ISS: parseFloat(document.getElementById('realISS').value) || 0,
				ICMS: parseFloat(document.getElementById('realICMS').value) || 0,
				isencaoIRPJ: parseFloat(document.getElementById('realIsencaoIRPJ').value) || 0,
				isencaoCSLL: parseFloat(document.getElementById('realIsencaoCSLL').value) || 0,
				limiteAdicional: parseFloat(document.getElementById('realLimiteAdicional').value) || 0,
				dataCriacao: new Date().toISOString()
			};
			
			let configs = JSON.parse(localStorage.getItem('paramReal')) || [];
			
			if (id) {
				const index = configs.findIndex(c => c.id === id);
				if (index !== -1) {
					configs[index] = config;
					mostrarMensagem("Configuração atualizada!");
				}
			} else {
				configs.push(config);
				mostrarMensagem("Configuração salva!");
			}
			
			localStorage.setItem('paramReal', JSON.stringify(configs));
			carregarConfigsReal();
			limparFormularioReal();
		}

		// Função para carregar configurações do Lucro Real
		function carregarConfigsReal() {
			const configs = JSON.parse(localStorage.getItem('paramReal')) || [];
			const lista = document.getElementById('listaConfigsReal');
			if (!lista) return;
			
			lista.innerHTML = '';
			
			if (configs.length === 0) {
				lista.innerHTML = `
					<div class="text-center py-10 text-gray-400">
						<i class="fas fa-chart-line text-3xl mb-3"></i>
						<p>Nenhuma configuração cadastrada.</p>
						<p class="text-sm mt-2">Clique em "Nova Configuração" para começar.</p>
					</div>
				`;
				return;
			}
			
			// Agrupar configurações por vigência (mais recente primeiro)
			configs.sort((a, b) => b.vigencia.localeCompare(a.vigencia));
			
			// Agrupar por vigência
			const configsPorVigencia = {};
			configs.forEach(config => {
				if (!configsPorVigencia[config.vigencia]) {
					configsPorVigencia[config.vigencia] = [];
				}
				configsPorVigencia[config.vigencia].push(config);
			});
			
			Object.entries(configsPorVigencia).forEach(([vigencia, configsVigencia]) => {
				const [ano, mes] = vigencia.split('-');
				const vigenciaFormatada = `${mes}/${ano}`;
				
				const vigenciaContainer = document.createElement('div');
				vigenciaContainer.className = "bg-white rounded-xl border border-gray-200 p-6 mb-6";
				
				vigenciaContainer.innerHTML = `
					<div class="flex justify-between items-center mb-4">
						<h4 class="font-bold text-lg text-gray-800">Vigência a partir de ${vigenciaFormatada}</h4>
						<button onclick="adicionarConfigRealVigencia('${vigencia}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded">
							<i class="fas fa-plus mr-1"></i>Adicionar Configuração
						</button>
					</div>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4" id="configs-real-${vigencia}"></div>
				`;
				
				const containerConfigs = vigenciaContainer.querySelector(`#configs-real-${vigencia}`);
				
				configsVigencia.forEach(config => {
					const div = document.createElement('div');
					div.className = "bg-gray-50 p-4 rounded-lg border border-gray-200";
					
					div.innerHTML = `
						<div class="flex justify-between items-start mb-3">
							<div>
								<h5 class="font-bold text-gray-800">${config.nome}</h5>
								${config.atividade ? `<p class="text-sm text-gray-600">${config.atividade}</p>` : ''}
								<span class="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full mt-1 inline-block">
									${config.tipo}
								</span>
							</div>
							<div class="flex gap-2">
								<button onclick="editarConfigReal('${config.id}')" class="text-brand-600 hover:bg-brand-50 p-1.5 rounded">
									<i class="fas fa-edit"></i>
								</button>
								<button onclick="excluirConfigReal('${config.id}')" class="text-red-500 hover:bg-red-50 p-1.5 rounded">
									<i class="fas fa-trash"></i>
								</button>
							</div>
						</div>
						
						<div class="grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="font-medium">IRPJ:</span>
								<span class="text-blue-600 ml-1">${config.aliquotaIRPJ}%</span>
							</div>
							<div>
								<span class="font-medium">Adicional IRPJ:</span>
								<span class="text-blue-600 ml-1">${config.adicionalIRPJ}%</span>
							</div>
							<div>
								<span class="font-medium">CSLL:</span>
								<span class="text-green-600 ml-1">${config.aliquotaCSLL}%</span>
							</div>
							<div>
								<span class="font-medium">PIS:</span>
								<span class="text-purple-600 ml-1">${config.PIS}%</span>
							</div>
							<div>
								<span class="font-medium">COFINS:</span>
								<span class="text-purple-600 ml-1">${config.COFINS}%</span>
							</div>
							${config.CSLLAdicional > 0 ? `
							<div>
								<span class="font-medium">CSLL Adicional:</span>
								<span class="text-green-600 ml-1">${config.CSLLAdicional}%</span>
							</div>` : ''}
							${config.ISS > 0 ? `
							<div>
								<span class="font-medium">ISS:</span>
								<span class="text-orange-600 ml-1">${config.ISS}%</span>
							</div>` : ''}
							${config.ICMS > 0 ? `
							<div>
								<span class="font-medium">ICMS:</span>
								<span class="text-red-600 ml-1">${config.ICMS}%</span>
							</div>` : ''}
						</div>
						
						${config.isencaoIRPJ > 0 || config.isencaoCSLL > 0 ? `
						<div class="mt-2 pt-2 border-t border-gray-200">
							<p class="text-xs font-medium text-gray-600 mb-1">Isenções:</p>
							<div class="text-xs">
								${config.isencaoIRPJ > 0 ? `<div>IRPJ isento até: ${formatarMoeda(config.isencaoIRPJ)}</div>` : ''}
								${config.isencaoCSLL > 0 ? `<div>CSLL isento até: ${formatarMoeda(config.isencaoCSLL)}</div>` : ''}
							</div>
						</div>` : ''}
					`;
					
					containerConfigs.appendChild(div);
				});
				
				lista.appendChild(vigenciaContainer);
			});
		}

		// Função para adicionar configuração em uma vigência específica
		function adicionarConfigRealVigencia(vigencia) {
			document.getElementById('realVigencia').value = vigencia;
			
			if (!formularioRealAberto) toggleFormularioReal();
		}

		// Função para editar configuração do Lucro Real
		function editarConfigReal(id) {
			const configs = JSON.parse(localStorage.getItem('paramReal')) || [];
			const config = configs.find(c => c.id === id);
			
			if (!config) return;
			
			document.getElementById('configRealId').value = config.id;
			document.getElementById('realVigencia').value = config.vigencia;
			document.getElementById('realNome').value = config.nome;
			document.getElementById('realAtividade').value = config.atividade || '';
			document.getElementById('realTipo').value = config.tipo || 'geral';
			document.getElementById('realAliquotaIRPJ').value = config.aliquotaIRPJ;
			document.getElementById('realAdicionalIRPJ').value = config.adicionalIRPJ;
			document.getElementById('realAliquotaCSLL').value = config.aliquotaCSLL;
			document.getElementById('realPIS').value = config.PIS;
			document.getElementById('realCOFINS').value = config.COFINS;
			document.getElementById('realCSLLAdicional').value = config.CSLLAdicional || 0;
			document.getElementById('realISS').value = config.ISS || 0;
			document.getElementById('realICMS').value = config.ICMS || 0;
			document.getElementById('realIsencaoIRPJ').value = config.isencaoIRPJ || 0;
			document.getElementById('realIsencaoCSLL').value = config.isencaoCSLL || 0;
			document.getElementById('realLimiteAdicional').value = config.limiteAdicional || 0;
			
			if (!formularioRealAberto) toggleFormularioReal();
			
			mostrarMensagem("Configuração carregada para edição", 'warning');
		}

		// Função para excluir configuração do Lucro Real
		function excluirConfigReal(id) {
			mostrarModalConfirmacao(
				"Excluir Configuração",
				"Tem certeza que deseja excluir esta configuração?",
				() => {
					let configs = JSON.parse(localStorage.getItem('paramReal')) || [];
					configs = configs.filter(c => c.id !== id);
					localStorage.setItem('paramReal', JSON.stringify(configs));
					carregarConfigsReal();
					mostrarMensagem("Configuração excluída!");
				},
				false,
				true
			);
		}

        // --- 9. FUNÇÕES DE BACKUP (IMPORTAR/EXPORTAR) ---

        function exportarDados() {
			const dados = {
				clientes: JSON.parse(localStorage.getItem('clientes')) || [],
				situacoes: JSON.parse(localStorage.getItem('situacoes')) || [],
				faturamento: JSON.parse(localStorage.getItem('faturamento')) || [], // Alterado de vendas
				paramFaixasSimples: JSON.parse(localStorage.getItem('paramFaixasSimples')) || [],
				paramPresumido: JSON.parse(localStorage.getItem('paramPresumido')) || [],
				paramReal: JSON.parse(localStorage.getItem('paramReal')) || [],
				dataExportacao: new Date().toISOString(),
				versao: '5.0-com-faturamento',
				descricao: 'Backup completo do sistema Caderno Contábil com módulo de faturamento'
			};
			
			const jsonString = JSON.stringify(dados, null, 2);
			const blob = new Blob([jsonString], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `caderno_backup_${new Date().toISOString().substring(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			
			mostrarMensagem("Backup exportado com sucesso!", 'success');
		}

		// Atualizar a função de importação para carregar os novos dados
		function importarDados(event) {
			const file = event.target.files[0];
			if (!file) return;

			const reader = new FileReader();
			reader.onload = function(e) {
				try {
					const dadosImportados = JSON.parse(e.target.result);
					
					// Compatibilidade com versões antigas que usavam 'vendas'
					if (dadosImportados.vendas && !dadosImportados.faturamento) {
						dadosImportados.faturamento = dadosImportados.vendas;
						delete dadosImportados.vendas;
					}
					
					if (dadosImportados.clientes && dadosImportados.situacoes && dadosImportados.faturamento) {
						mostrarModalConfirmacao("Confirmação de Importação", 
							"Atenção: A importação irá SOBRESCREVER todos os dados atuais do sistema. Deseja continuar?", 
							() => {
								localStorage.setItem('clientes', JSON.stringify(dadosImportados.clientes));
								localStorage.setItem('situacoes', JSON.stringify(dadosImportados.situacoes));
								localStorage.setItem('faturamento', JSON.stringify(dadosImportados.faturamento));
								
								if (dadosImportados.paramFaixasSimples) {
									localStorage.setItem('paramFaixasSimples', JSON.stringify(dadosImportados.paramFaixasSimples));
								}
								if (dadosImportados.paramPresumido) {
									localStorage.setItem('paramPresumido', JSON.stringify(dadosImportados.paramPresumido));
								}
								if (dadosImportados.paramReal) {
									localStorage.setItem('paramReal', JSON.stringify(dadosImportados.paramReal));
								}
								
								// Recarregar toda a UI
								carregarClientes();
								carregarSituacoes();
								carregarFaturamento(); // Alterado de carregarVendas
								atualizarGraficoFaturamento();
								carregarFaixasSimples();
								carregarConfigsPresumido();
								carregarConfigsReal();
								atualizarSelects();
								calcularSomaReparticao();
								
								// Resetar formulários
								document.getElementById('clienteForm').reset();
								const submitBtn = document.querySelector('#clienteForm button[type="submit"]');
								if (submitBtn) {
									submitBtn.innerHTML = 'Salvar';
									submitBtn.classList.remove('bg-yellow-600');
									submitBtn.classList.add('bg-brand-600');
								}
								
								mostrarMensagem("Dados importados com sucesso! Sistema recarregado.", 'success');
							},
							false,
							true
						);
					} else {
						mostrarMensagem("Arquivo de backup inválido ou incompleto.", 'error');
					}
					
				} catch (error) {
					console.error("Erro ao ler/parsear o arquivo:", error);
					mostrarMensagem("Erro ao processar o arquivo. Verifique se é um JSON válido.", 'error');
				}
			};
			reader.readAsText(file);
		}

        function confirmarLimparTudo() {
            mostrarModalConfirmacao("Limpar Todos os Dados", 
                "Você tem certeza que deseja APAGAR TODOS os dados? Esta ação é irreversível.", 
                () => {
                    localStorage.clear();
                    initApp();
                    window.location.reload();
                    mostrarMensagem("Todos os dados foram limpos e o sistema foi reiniciado.", 'success');
                }
            );
        }
		
		function resetarDadosClientes() {
			mostrarModal('Resetar Dados', 
				'Tem certeza que deseja resetar todos os dados de clientes? Esta ação não pode ser desfeita.',
				() => {
					localStorage.setItem('clientes', JSON.stringify([]));
					localStorage.setItem('situacoes', JSON.stringify([]));
					localStorage.setItem('vendas', JSON.stringify([]));
					
					// Recarregar interface
					carregarClientes();
					carregarSituacoes();
					carregarVendas();
					atualizarSelects();
					
					mostrarMensagem('Dados resetados com sucesso!');
				}
			);
		}