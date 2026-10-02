// js/empresaController.js
/**
 * CONTROLLER DE EMPRESAS - Gerencia o cadastro de empresas
 * Fluxo 2 do sistema: Cadastro de Empresa 
 */

class EmpresaController {
    constructor() {
        this.formulario = null;
        this.tabelaBody = null;
        this.modoEdicao = false;
        this.empresaEditandoId = null;
        
        this.inicializar();
    }

    /**
     * Inicializa o controller
     */
    inicializar() {
        this.formulario = document.getElementById('clienteForm');
        this.tabelaBody = document.getElementById('listaClientesBody');
        
        if (!this.formulario || !this.tabelaBody) {
            console.error('Elementos do DOM não encontrados para empresas');
            return;
        }
        
        this.configurarEventos();
        this.carregarListaEmpresas();
        
        // Formatar CNPJ enquanto digita
        const cnpjInput = document.getElementById('cnpj');
        if (cnpjInput) {
            cnpjInput.addEventListener('input', (e) => UIUtils.formatarCNPJ(e.target));
        }
    }

    /**
     * Configura os eventos do formulário e botões
     */
    configurarEventos() {
        // Evento de submit do formulário
        this.formulario.addEventListener('submit', (e) => this.salvarEmpresa(e));
        
        // Evento do botão limpar
        const btnLimpar = document.getElementById('limparCliente');
        if (btnLimpar) {
            btnLimpar.addEventListener('click', () => this.limparFormulario());
        }
        
        // Evento para adicionar sócio
        const btnAddSocio = document.getElementById('btnAdicionarSocio');
        if (btnAddSocio) {
            btnAddSocio.addEventListener('click', () => this.adicionarCampoSocio());
        }
    }
    
    /**
     * Valida um CNPJ
     */
    validarCNPJ(cnpj) {
		// Remove qualquer formatação
		cnpj = cnpj.replace(/[^\d]+/g, '');
		
		// Verifica se tem 14 dígitos
		if (cnpj.length !== 14) return false;
		
		// Elimina CNPJs com todos os dígitos iguais
		if (/^(\d)\1{13}$/.test(cnpj)) return false;
		
		// Validação dos dígitos verificadores
		let tamanho = cnpj.length - 2;
		let numeros = cnpj.substring(0, tamanho);
		let digitos = cnpj.substring(tamanho);
		let soma = 0;
		let pos = tamanho - 7;
		
		// Primeiro dígito verificador
		for (let i = tamanho; i >= 1; i--) {
			soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
			if (pos < 2) pos = 9;
		}
		
		let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
		if (resultado !== parseInt(digitos.charAt(0))) return false;
		
		// Segundo dígito verificador
		tamanho = tamanho + 1;
		numeros = cnpj.substring(0, tamanho);
		soma = 0;
		pos = tamanho - 7;
		
		for (let i = tamanho; i >= 1; i--) {
			soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
			if (pos < 2) pos = 9;
		}
		
		resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
		return resultado === parseInt(digitos.charAt(1));
	}

    /**
     * Adiciona campos para um novo sócio
     */
    adicionarCampoSocio() {
        const container = document.getElementById('sociosContainer');
        if (!container) return;
        
        const index = container.children.length;
        
        const socioDiv = document.createElement('div');
        socioDiv.className = 'socio-item border p-3 rounded mb-2 bg-gray-50';
        socioDiv.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-medium">Sócio ${index + 1}</h4>
                <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('.socio-item').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label class="block text-sm font-medium mb-1">CPF</label>
                    <input type="text" name="socios[${index}][cpf]" 
                           class="cpf-input w-full px-3 py-2 border rounded" 
                           placeholder="000.000.000-00">
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">Nome Completo</label>
                    <input type="text" name="socios[${index}][nome]" 
                           class="w-full px-3 py-2 border rounded" 
                           placeholder="Nome do sócio">
                </div>
            </div>
        `;
        
        container.appendChild(socioDiv);
        
        // Configurar formatação do CPF
        const cpfInput = socioDiv.querySelector('.cpf-input');
        cpfInput.addEventListener('input', (e) => UIUtils.formatarCPF(e.target));
    }

    /**
     * Salva ou atualiza uma empresa
     */
    salvarEmpresa(event) {
		event.preventDefault();
		
		const formData = new FormData(this.formulario);
		
		// Coletar dados básicos
		const empresaData = {
			cnpj: formData.get('cnpj') || '',
			razaoSocial: formData.get('razaoSocial') || '',
			nomeFantasia: formData.get('nomeFantasia') || '',
			dataAbertura: formData.get('dataAbertura') || '',
			socios: [] // Inicializa vazio por enquanto
		};
		
		console.log('📋 Dados coletados do formulário (raw):', empresaData);
		
		// CORREÇÃO: Formatar data de abertura corretamente para evitar problemas de fuso horário
		if (empresaData.dataAbertura) {
			// Parse da data sem problemas de fuso horário
			const dataObj = UIUtils.corrigirFusoHorarioData(empresaData.dataAbertura);
			// Salvar no formato ISO sem o componente de tempo
			empresaData.dataAbertura = dataObj.toISOString().split('T')[0];
			console.log('📅 Data formatada para salvamento:', empresaData.dataAbertura);
		}
		
		// VALIDAÇÃO SIMPLIFICADA
		if (!empresaData.cnpj.trim() || !empresaData.razaoSocial.trim()) {
			UIUtils.mostrarToast('CNPJ e Razão Social são obrigatórios', 'error');
			return;
		}
		
		// VALIDAÇÃO BÁSICA DE CNPJ (APENAS VERIFICA SE TEM 14+ DÍGITOS)
		const cnpjNumeros = empresaData.cnpj.replace(/\D/g, '');
		if (cnpjNumeros.length < 14) {
			UIUtils.mostrarToast('CNPJ deve ter 14 dígitos numéricos', 'error');
			return;
		}
		
		// Verificar se CNPJ já existe (versão simplificada)
		const empresasExistentes = DataStore.obterTodos('empresas', []);
		const cnpjJaExiste = empresasExistentes.some(emp => {
			const cnpjEmp = emp.cnpj.replace(/\D/g, '');
			const cnpjNovo = empresaData.cnpj.replace(/\D/g, '');
			return cnpjEmp === cnpjNovo;
		});
		
		if (cnpjJaExiste && !this.modoEdicao) {
			UIUtils.mostrarToast('Este CNPJ já está cadastrado no sistema', 'error');
			return;
		}
        
        // Coletar sócios
        const socios = [];
        const sociosInputs = this.formulario.querySelectorAll('[name^="socios["]');
        const sociosPorIndice = {};
        
        sociosInputs.forEach(input => {
            const match = input.name.match(/socios\[(\d+)\]\[(\w+)\]/);
            if (match) {
                const index = match[1];
                const campo = match[2];
                const valor = input.value.trim();
                
                if (!sociosPorIndice[index]) {
                    sociosPorIndice[index] = {};
                }
                
                sociosPorIndice[index][campo] = valor;
            }
        });
        
        // Converter para array e validar sócios
        Object.values(sociosPorIndice).forEach(socio => {
            if (socio.cpf || socio.nome) {
                socios.push({
                    cpf: socio.cpf || '',
                    nome: socio.nome || ''
                });
            }
        });
        
        empresaData.socios = socios;
        
        // SALVAR NO BANCO DE DADOS
        let resultado;
        
        if (this.modoEdicao && this.empresaEditandoId) {
            // MODO EDIÇÃO
            resultado = DataStore.atualizarItem('empresas', this.empresaEditandoId, empresaData);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Empresa atualizada com sucesso!', 'success');
                this.sairModoEdicao();
            } else {
                UIUtils.mostrarToast(`❌ Erro ao atualizar: ${resultado.error}`, 'error');
            }
        } else {
            // MODO CADASTRO NOVO
            resultado = DataStore.salvarItem('empresas', empresaData);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Empresa cadastrada com sucesso!', 'success');
                this.limparFormulario();
            } else {
                UIUtils.mostrarToast(`❌ Erro ao cadastrar: ${resultado.error}`, 'error');
            }
        }
        
        // Atualizar a lista
        this.carregarListaEmpresas();
        
        // Atualizar selects em outras abas
        if (window.UIUtils && typeof window.UIUtils.atualizarSelects === 'function') {
			window.UIUtils.atualizarSelects();
		}
    }

    /**
	 * Carrega a lista de empresas na tabela
	 */
	carregarListaEmpresas() {
		console.log('🔄 Carregando lista de empresas...');
		
		// Usar a função com paginação
		this.atualizarTabelaComPaginacao(1, 10);
		
		// Atualizar contadores
		this.atualizarContadores();
	}

    /**
     * Adiciona eventos aos botões da tabela
     */
    adicionarEventosBotoes() {
        // Botões de editar
        document.querySelectorAll('.btn-editar-empresa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const empresaId = e.currentTarget.getAttribute('data-id');
                this.editarEmpresa(empresaId);
            });
        });
        
        // Botões de excluir
        document.querySelectorAll('.btn-excluir-empresa').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const empresaId = e.currentTarget.getAttribute('data-id');
                this.confirmarExclusao(empresaId);
            });
        });
        
        // Botões de ver sócios
        document.querySelectorAll('.btn-ver-socios').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const empresaId = e.currentTarget.getAttribute('data-id');
                this.mostrarSocios(empresaId);
            });
        });
    }

    /**
     * Preenche o formulário para edição
     */
    editarEmpresa(empresaId) {
        const empresa = DataStore.obterPorId('empresas', empresaId);
        
        if (!empresa) {
            UIUtils.mostrarToast('Empresa não encontrada', 'error');
            return;
        }
        
        console.log('✏️ Editando empresa:', empresa);
        
        // Preencher campos do formulário
        document.getElementById('cnpj').value = empresa.cnpj || '';
        document.getElementById('razaoSocial').value = empresa.razaoSocial || '';
        document.getElementById('nomeFantasia').value = empresa.nomeFantasia || '';
        
        // CORREÇÃO: Formatar data para o input type="date"
        if (empresa.dataAbertura) {
            const dataParaInput = UIUtils.corrigirFusoHorarioData(empresa.dataAbertura);
            document.getElementById('dataAbertura').value = dataParaInput.toISOString().split('T')[0];
            console.log('📅 Data carregada para edição:', document.getElementById('dataAbertura').value);
        } else {
            document.getElementById('dataAbertura').value = '';
        }
        
        // Limpar e preencher sócios
        const sociosContainer = document.getElementById('sociosContainer');
        if (sociosContainer) {
            sociosContainer.innerHTML = '';
            
            if (empresa.socios && empresa.socios.length > 0) {
                empresa.socios.forEach((socio, index) => {
                    // Adiciona um novo campo de sócio
                    const socioDiv = document.createElement('div');
                    socioDiv.className = 'socio-item border p-3 rounded mb-2 bg-gray-50';
                    socioDiv.innerHTML = `
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="font-medium">Sócio ${index + 1}</h4>
                            <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('.socio-item').remove()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label class="block text-sm font-medium mb-1">CPF</label>
                                <input type="text" name="socios[${index}][cpf]" 
                                       class="cpf-input w-full px-3 py-2 border rounded" 
                                       value="${socio.cpf || ''}"
                                       placeholder="000.000.000-00">
                            </div>
                            <div>
                                <label class="block text-sm font-medium mb-1">Nome Completo</label>
                                <input type="text" name="socios[${index}][nome]" 
                                       class="w-full px-3 py-2 border rounded" 
                                       value="${socio.nome || ''}"
                                       placeholder="Nome do sócio">
                            </div>
                        </div>
                    `;
                    sociosContainer.appendChild(socioDiv);
                    
                    // Configurar formatação do CPF
                    const cpfInput = socioDiv.querySelector('.cpf-input');
                    cpfInput.addEventListener('input', (e) => UIUtils.formatarCPF(e.target));
                });
            }
        }
        
        // Alterar aparência do formulário para modo edição
        this.modoEdicao = true;
        this.empresaEditandoId = empresaId;
        
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Atualizar Empresa';
            submitBtn.classList.remove('bg-brand-600', 'hover:bg-brand-700');
            submitBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
        }
        
        // Adicionar botão cancelar se não existir
        if (!document.getElementById('btnCancelarEdicao')) {
            const btnLimpar = document.getElementById('limparCliente');
            const btnCancelar = document.createElement('button');
            btnCancelar.type = 'button';
            btnCancelar.id = 'btnCancelarEdicao';
            btnCancelar.className = 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600';
            btnCancelar.innerHTML = '<i class="fas fa-times mr-2"></i>Cancelar';
            btnCancelar.addEventListener('click', () => this.sairModoEdicao());
            
            btnLimpar.parentNode.insertBefore(btnCancelar, btnLimpar.nextSibling);
        }
        
        UIUtils.mostrarToast(`✏️ Editando: ${empresa.razaoSocial}`, 'warning');
        
        // Rolar até o formulário
        this.formulario.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Sai do modo de edição
     */
    sairModoEdicao() {
        this.modoEdicao = false;
        this.empresaEditandoId = null;
        this.limparFormulario();
        
        const submitBtn = this.formulario.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i> Salvar Empresa';
            submitBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            submitBtn.classList.add('bg-brand-600', 'hover:bg-brand-700');
        }
        
        // Remover botão cancelar
        const btnCancelar = document.getElementById('btnCancelarEdicao');
        if (btnCancelar) {
            btnCancelar.remove();
        }
    }

    /**
     * Confirma a exclusão de uma empresa
     */
    confirmarExclusao(empresaId) {
        const empresa = DataStore.obterPorId('empresas', empresaId);
        
        if (!empresa) return;
        
        // Verificar se a empresa tem situações ou faturamentos vinculados
        const situacoes = DataStore.filtrarPorPropriedade('situacoes', 'empresaId', empresaId);
        const faturamentos = DataStore.filtrarPorPropriedade('faturamentos', 'empresaId', empresaId);
        
        let mensagem = `Tem certeza que deseja excluir a empresa <strong>${empresa.razaoSocial}</strong>?`;
        
        if (situacoes.length > 0 || faturamentos.length > 0) {
            mensagem += `<br><br><span class="text-red-600 text-sm">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                ATENÇÃO: Esta empresa possui 
                ${situacoes.length} situação(ões) tributária(s) e 
                ${faturamentos.length} registro(s) de faturamento vinculados.
                Todos serão excluídos permanentemente!
            </span>`;
        }
        
        if (confirm(mensagem.replace(/<[^>]*>/g, ''))) {
            // Primeiro excluir dados vinculados
            situacoes.forEach(situacao => {
                DataStore.excluirItem('situacoes', situacao.id);
            });
            
            faturamentos.forEach(faturamento => {
                DataStore.excluirItem('faturamentos', faturamento.id);
            });
            
            // Agora excluir a empresa
            const resultado = DataStore.excluirItem('empresas', empresaId);
            
            if (resultado.success) {
                UIUtils.mostrarToast('✅ Empresa excluída com sucesso', 'success');
                this.carregarListaEmpresas();
                
                if (window.UIUtils && typeof window.UIUtils.atualizarSelects === 'function') {
					window.UIUtils.atualizarSelects();
				}
            } else {
                UIUtils.mostrarToast(`❌ Erro ao excluir: ${resultado.error}`, 'error');
            }
        }
    }

    /**
     * Mostra os sócios de uma empresa em um modal
     */
    mostrarSocios(empresaId) {
		const empresa = DataStore.obterPorId('empresas', empresaId);
		
		if (!empresa || !empresa.socios || empresa.socios.length === 0) {
			UIUtils.mostrarToast('Esta empresa não tem sócios cadastrados', 'info');
			return;
		}
		
		let sociosHTML = '<div class="space-y-3">';
		
		empresa.socios.forEach((socio, index) => {
			sociosHTML += `
				<div class="border rounded p-3">
					<div class="flex justify-between items-start">
						<div>
							<h4 class="font-medium">Sócio ${index + 1}</h4>
							<div class="text-sm text-gray-600 mt-1">
								<div><span class="font-medium">CPF:</span> ${socio.cpf || 'Não informado'}</div>
								<div><span class="font-medium">Nome:</span> ${socio.nome || 'Não informado'}</div>
							</div>
						</div>
					</div>
				</div>
			`;
		});
		
		sociosHTML += '</div>';
		
		// Verificar se modal já existe
		let modal = document.getElementById('modalSocios');
		
		if (!modal) {
			// CRIAR MODAL PELA PRIMEIRA VEZ
			modal = document.createElement('div');
			modal.id = 'modalSocios';
			modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
			modal.innerHTML = `
				<div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" id="modalSociosContainer">
					<div class="flex justify-between items-center p-4 border-b">
						<h3 class="text-lg font-semibold">Sócios da Empresa</h3>
						<button id="fecharModalSocios" class="text-gray-500 hover:text-gray-700">
							<i class="fas fa-times"></i>
						</button>
					</div>
					<div class="p-4" id="modalSociosContent">
						${sociosHTML}
					</div>
					<div class="p-4 border-t text-right">
						<button id="btnFecharModalSocios" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
							Fechar
						</button>
					</div>
				</div>
			`;
			document.body.appendChild(modal);
		} else {
			// ATUALIZAR CONTEÚDO DO MODAL EXISTENTE
			const contentDiv = document.getElementById('modalSociosContent');
			if (contentDiv) {
				contentDiv.innerHTML = sociosHTML;
			} else {
				// Se não existe o content, recria o modal
				modal.innerHTML = `
					<div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" id="modalSociosContainer">
						<div class="flex justify-between items-center p-4 border-b">
							<h3 class="text-lg font-semibold">Sócios da Empresa</h3>
							<button id="fecharModalSocios" class="text-gray-500 hover:text-gray-700">
								<i class="fas fa-times"></i>
							</button>
						</div>
						<div class="p-4" id="modalSociosContent">
							${sociosHTML}
						</div>
						<div class="p-4 border-t text-right">
							<button id="btnFecharModalSocios" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
								Fechar
							</button>
						</div>
					</div>
				`;
			}
		}
		
		// FUNÇÃO PARA FECHAR (deve estar no escopo correto)
		const fecharModal = () => {
			modal.classList.add('hidden');
		};
		
		// CONFIGURAR EVENT LISTENERS (usando IDs explícitos)
		const btnFecharX = document.getElementById('fecharModalSocios');
		const btnFechar = document.getElementById('btnFecharModalSocios');
		
		if (btnFecharX) {
			// Remover listener antigo e adicionar novo
			btnFecharX.replaceWith(btnFecharX.cloneNode(true));
			document.getElementById('fecharModalSocios').addEventListener('click', fecharModal);
		}
		
		if (btnFechar) {
			// Remover listener antigo e adicionar novo
			btnFechar.replaceWith(btnFechar.cloneNode(true));
			document.getElementById('btnFecharModalSocios').addEventListener('click', fecharModal);
		}
		
		// Fechar ao clicar fora do conteúdo
		modal.addEventListener('click', (e) => {
			if (e.target === modal) {
				fecharModal();
			}
		});
		
		// DEBUG: Verificar se os botões foram encontrados
		console.log('Modal criado/atualizado');
		console.log('Botão X encontrado:', !!btnFecharX);
		console.log('Botão Fechar encontrado:', !!btnFechar);
		
		// MOSTRAR MODAL
		modal.classList.remove('hidden');
	}

    /**
     * Limpa o formulário
     */
    limparFormulario() {
        this.formulario.reset();
        
        // Limpar sócios
        const sociosContainer = document.getElementById('sociosContainer');
        if (sociosContainer) {
            sociosContainer.innerHTML = '';
        }
        
        // Sair do modo edição se estiver
        if (this.modoEdicao) {
            this.sairModoEdicao();
        }
    }
	
	/**
	 * Atualiza os contadores de clientes na interface
	 */
	atualizarContadores() {
		try {
			const empresas = DataStore.obterTodos('empresas', []);
			const totalEmpresas = empresas.length;
			
			// 1. Atualizar badge no cabeçalho
			const badge = document.getElementById('totalClientesBadge');
			if (badge) {
				badge.textContent = `${totalEmpresas} ${totalEmpresas === 1 ? 'empresa' : 'empresas'}`;
				badge.className = `text-xs ${totalEmpresas > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'} px-2 py-1 rounded border`;
			}
			
			// 2. Atualizar contadores de paginação
			const clientesExibidos = document.getElementById('clientesExibidos');
			const totalClientes = document.getElementById('totalClientes');
			
			if (clientesExibidos && totalClientes) {
				// Calcular quantas empresas estão sendo exibidas (todas por enquanto)
				const empresasExibidas = Math.min(totalEmpresas, 10); // Exemplo: máximo 10 por página
				
				clientesExibidos.textContent = empresasExibidas;
				totalClientes.textContent = totalEmpresas;
				
				// Mostrar/ocultar paginação baseado no total
				const paginacaoContainer = document.querySelector('.pagination-container');
				if (paginacaoContainer) {
					paginacaoContainer.style.display = totalEmpresas > 10 ? 'flex' : 'none';
				}
			}
			
			// 3. Atualizar mensagem de lista vazia
			const listaVazia = document.querySelector('#listaClientesBody tr td[colspan="7"]');
			if (listaVazia && totalEmpresas === 0) {
				listaVazia.innerHTML = `
					<div class="text-center py-10">
						<i class="fas fa-building text-4xl text-gray-300 mb-3"></i>
						<p class="text-gray-400 font-medium">Nenhuma empresa cadastrada</p>
						<p class="text-sm text-gray-500 mt-1">Use o formulário ao lado para cadastrar a primeira empresa</p>
					</div>
				`;
			}
			
			console.log(`📊 Contadores atualizados: ${totalEmpresas} empresas`);
			return totalEmpresas;
			
		} catch (error) {
			console.error('❌ Erro ao atualizar contadores:', error);
			return 0;
		}
	}

	/**
	 * Atualiza a tabela de empresas com paginação básica
	 */
	atualizarTabelaComPaginacao(pagina = 1, itensPorPagina = 10) {
		const empresas = DataStore.obterTodos('empresas', []);
		const tbody = document.getElementById('listaClientesBody');
		
		if (!tbody) return;
		
		// Calcular paginação
		const totalPaginas = Math.ceil(empresas.length / itensPorPagina);
		const inicio = (pagina - 1) * itensPorPagina;
		const fim = inicio + itensPorPagina;
		const empresasPagina = empresas.slice(inicio, fim);
		
		// Limpar tabela
		tbody.innerHTML = '';
		
		if (empresasPagina.length === 0) {
			tbody.innerHTML = `
				<tr>
					<td colspan="7" class="text-center py-10 text-gray-400">
						<i class="fas fa-building text-3xl mb-2"></i>
						Nenhuma empresa encontrada
					</td>
				</tr>
			`;
			return;
		}
		
		// Preencher tabela com empresas da página atual
		empresasPagina.forEach(empresa => {
			// CORREÇÃO: Formatar data para exibição corretamente
			const dataAbertura = empresa.dataAbertura ? 
				UIUtils.formatarDataParaExibicao(empresa.dataAbertura) : 
				'Não informada';
			
			const numSocios = empresa.socios ? empresa.socios.length : 0;
			
			const row = document.createElement('tr');
			row.className = 'hover:bg-gray-50';
			row.setAttribute('data-empresa-id', empresa.id);
			
			row.innerHTML = `
				<td class="px-4 py-3 border-b">
					<div class="font-medium">${empresa.razaoSocial || 'Sem razão social'}</div>
					<div class="text-sm text-gray-500">${empresa.nomeFantasia || 'Sem nome fantasia'}</div>
				</td>
				<td class="px-4 py-3 border-b">${empresa.cnpj || 'Sem CNPJ'}</td>
				<td class="px-4 py-3 border-b">${dataAbertura}</td>
				<td class="px-4 py-3 border-b">
					<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${numSocios > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
						${numSocios} sócio(s)
					</span>
				</td>
				<td class="px-4 py-3 border-b">
					<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
						Ativa
					</span>
				</td>
				<td class="px-4 py-3 border-b text-sm text-gray-500">
					${empresa.dataCadastro ? UIUtils.formatarDataParaExibicao(empresa.dataCadastro) : '--/--/----'}
				</td>
				<td class="px-4 py-3 border-b text-right">
					<div class="flex justify-end space-x-2">
						<button class="btn-editar-empresa text-blue-600 hover:text-blue-800 p-1" 
								data-id="${empresa.id}"
								title="Editar">
							<i class="fas fa-edit"></i>
						</button>
						<button class="btn-excluir-empresa text-red-600 hover:text-red-800 p-1" 
								data-id="${empresa.id}"
								title="Excluir">
							<i class="fas fa-trash"></i>
						</button>
						<button class="btn-ver-socios text-gray-600 hover:text-gray-800 p-1" 
								data-id="${empresa.id}"
								title="Ver sócios">
							<i class="fas fa-users"></i>
						</button>
					</div>
				</td>
			`;
			
			tbody.appendChild(row);
		});
		
		// Atualizar controles de paginação
		this.atualizarControlesPaginacao(pagina, totalPaginas);
		
		// Re-adicionar eventos aos botões
		this.adicionarEventosBotoes();
		
		// Atualizar contadores
		this.atualizarContadores();
	}

	/**
	 * Atualiza os controles de paginação
	 */
	atualizarControlesPaginacao(paginaAtual, totalPaginas) {
		const container = document.querySelector('.pagination-container');
		if (!container) return;
		
		// Só mostrar paginação se tiver mais de uma página
		if (totalPaginas <= 1) {
			container.innerHTML = '';
			return;
		}
		
		let html = `
			<div class="flex items-center justify-between w-full">
				<div class="text-xs text-gray-500">
					Página ${paginaAtual} de ${totalPaginas}
				</div>
				<div class="flex gap-1">
		`;
		
		// Botão anterior
		html += `
			<button class="btn-pagina-anterior p-1 ${paginaAtual === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}" 
					${paginaAtual === 1 ? 'disabled' : ''}
					data-pagina="${paginaAtual - 1}">
				<i class="fas fa-chevron-left"></i>
			</button>
		`;
		
		// Botões de página (máximo 5)
		const inicioPagina = Math.max(1, paginaAtual - 2);
		const fimPagina = Math.min(totalPaginas, inicioPagina + 4);
		
		for (let i = inicioPagina; i <= fimPagina; i++) {
			html += `
				<button class="btn-pagina p-1 text-xs w-6 h-6 rounded ${i === paginaAtual ? 'bg-brand-600 text-white' : 'text-gray-600 hover:text-gray-800'}" 
						data-pagina="${i}">
					${i}
				</button>
			`;
		}
		
		// Botão próximo
		html += `
			<button class="btn-pagina-proximo p-1 ${paginaAtual === totalPaginas ? 'text-gray-400 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}" 
					${paginaAtual === totalPaginas ? 'disabled' : ''}
					data-pagina="${paginaAtual + 1}">
				<i class="fas fa-chevron-right"></i>
			</button>
		`;
		
		html += `
				</div>
			</div>
		`;
		
		container.innerHTML = html;
		
		// Adicionar eventos aos botões de paginação
		this.adicionarEventosPaginacao();
	}

	/**
	 * Adiciona eventos aos botões de paginação
	 */
	adicionarEventosPaginacao() {
		// Botão página anterior
		const btnAnterior = document.querySelector('.btn-pagina-anterior');
		if (btnAnterior) {
			btnAnterior.addEventListener('click', (e) => {
				if (!e.currentTarget.disabled) {
					const pagina = parseInt(e.currentTarget.getAttribute('data-pagina'));
					this.atualizarTabelaComPaginacao(pagina);
				}
			});
		}
		
		// Botões de número de página
		document.querySelectorAll('.btn-pagina').forEach(btn => {
			btn.addEventListener('click', (e) => {
				const pagina = parseInt(e.currentTarget.getAttribute('data-pagina'));
				this.atualizarTabelaComPaginacao(pagina);
			});
		});
		
		// Botão próxima página
		const btnProximo = document.querySelector('.btn-pagina-proximo');
		if (btnProximo) {
			btnProximo.addEventListener('click', (e) => {
				if (!e.currentTarget.disabled) {
					const pagina = parseInt(e.currentTarget.getAttribute('data-pagina'));
					this.atualizarTabelaComPaginacao(pagina);
				}
			});
		}
	}
}