// ==================================================================
// SEÇÃO 1: A MEMÓRIA DO SITE (Variáveis Globais)
// ==================================================================
// Imagine que aqui são "caixas" onde guardamos informações temporárias
// enquanto a pessoa navega na página.

// 'usuarioLogado': Se a pessoa entrar com senha, guardamos os dados dela aqui (nome, foto).
// Se estiver 'null', o site sabe que é apenas um visitante anônimo.
let usuarioLogado = null;

// 'filtroAtual': Guarda se a pessoa clicou para ver apenas "Corrida", "Caminhada", etc.
let filtroAtual = null; 

// 'mainContent': É o palco principal da tela onde vamos desenhar e apagar coisas.
const mainContent = document.getElementById('main-content');


// ==================================================================
// SEÇÃO 2: O PONTO DE PARTIDA
// ==================================================================
// Este comando diz: "Assim que a página terminar de carregar, faça isso imediatamente:"
document.addEventListener('DOMContentLoaded', () => {
    renderizarMainAtividades(1); // 1. Desenhe o feed de atividades na página 1.
    configurarListenerLogo();    // 2. Configure o botão da logo no topo.
});

// Função que configura a Logo do site.
// Objetivo: Se alguém clicar na logo, o site "reseta" (limpa filtros e volta pra página inicial).
function configurarListenerLogo() {
    const logoButton = document.getElementById('logo-header-btn');
    if (logoButton) {
        // (Técnica para garantir que o botão não tenha comandos duplicados)
        const novoLogo = logoButton.cloneNode(true);
        logoButton.parentNode.replaceChild(novoLogo, logoButton);
        
        // Ação: Ao clicar, limpa o filtro e recarrega a lista.
        novoLogo.addEventListener('click', () => {
            filtroAtual = null; 
            renderizarMainAtividades(1);
        });
    }
}


// ==================================================================
// SEÇÃO 3: O FILTRO DE ATIVIDADES
// ==================================================================
// Funciona como um interruptor.
// Se clicar em "Corrida" e já estiver em "Corrida", ele desliga o filtro (mostra tudo).
// Se clicar em um novo, ele liga esse novo filtro.
window.filtrarAtividades = function(tipo) {
    if (filtroAtual === tipo) {
        filtroAtual = null; // Desliga
    } else {
        filtroAtual = tipo; // Liga novo filtro
    }
    // Depois de mudar a chave, manda redesenhar a tela com a nova regra.
    renderizarMainAtividades(1);
}


// ==================================================================
// SEÇÃO 4: SISTEMA DE LOGIN (Entrada do Usuário)
// ==================================================================
// Gerencia a janelinha (modal) onde a pessoa digita e-mail e senha.
function configurarLogin() {
    // Identifica os elementos da tela (botões e formulários)
    const modal = document.getElementById('login-modal');
    const btnLoginHeader = document.getElementById('login-button');
    const btnClose = document.getElementById('close-modal-btn'); // Botão X
    const btnCancel = document.getElementById('cancel-btn');     // Botão Cancelar
    const form = document.getElementById('login-form');

    // Configura o botão de "Login/Logout" no topo do site
    if (btnLoginHeader) {
        const novoBtn = btnLoginHeader.cloneNode(true);
        btnLoginHeader.parentNode.replaceChild(novoBtn, btnLoginHeader);
        
        novoBtn.addEventListener('click', () => {
            if (usuarioLogado) {
                fazerLogout(); // Se já tem alguém, sai da conta.
            } else {
                if (modal) modal.classList.remove('hidden'); // Se não, abre a janela de login.
            }
        });
    }

    // Configura os botões que fecham a janela de login sem fazer nada
    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancel) btnCancel.onclick = () => modal.classList.add('hidden');

    // Lógica de quando a pessoa clica em "ENTRAR"
    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault(); // Impede a página de recarregar sozinha

            limparErros(form); // Apaga mensagens de erro antigas

            // Pega o que foi digitado
            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('password');
            
            const email = emailInput.value.trim();
            const senha = senhaInput.value.trim();
            let temErro = false;

            // Verifica se deixou em branco
            if (!email) {
                mostrarErro(emailInput, 'O e-mail é obrigatório.');
                temErro = true;
            }
            if (!senha) {
                mostrarErro(senhaInput, 'A senha é obrigatória.');
                temErro = true;
            }

            if (temErro) return; // Se tiver erro, para por aqui.

            try {
                // Envia e-mail e senha para o servidor conferir
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                // Se o servidor disser que a senha está errada:
                if (!response.ok) {
                    mostrarErro(emailInput, '');
                    mostrarErro(senhaInput, 'E-mail ou senha incorretos.'); 
                    return;
                }

                // Se deu certo: Salva os dados do usuário na "memória" do site
                const dadosUsuario = await response.json();
                usuarioLogado = dadosUsuario;

                // Fecha a janela e atualiza a tela para modo "Logado"
                modal.classList.add('hidden');
                atualizarInterfaceUsuario();
                
                filtroAtual = null; 
                renderizarMainAtividades(1);

                // Limpa os campos de texto
                emailInput.value = '';
                senhaInput.value = '';

                alert(`Bem-vindo, ${usuarioLogado.nome_usuario}!`);

            } catch (erro) {
                console.error(erro);
                alert('Erro ao tentar fazer login.');
            }
        };
    }
}

// Função visual: Faz aparecer o texto vermelho de erro embaixo do campo
function mostrarErro(inputElement, mensagem) {
    inputElement.classList.add('input-error');
    
    const parent = inputElement.parentElement;
    let span = parent.querySelector('.error-message');
    
    if (!span) {
        span = document.createElement('span');
        span.className = 'error-message';
        parent.appendChild(span);
    }
    
    span.innerText = mensagem;
}

// Função visual: Apaga todos os textos vermelhos de erro
function limparErros(formElement) {
    const inputs = formElement.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));
    
    const mensagens = formElement.querySelectorAll('.error-message');
    mensagens.forEach(msg => msg.remove());
}

// Função de Sair da Conta
function fazerLogout() {
    usuarioLogado = null; // Apaga a memória do usuário
    filtroAtual = null;
    atualizarInterfaceUsuario(); // Muda a tela de volta para visitante
    renderizarMainAtividades(1);
    alert("Você saiu da conta.");
}

// ==================================================================
// SEÇÃO 5: BARRA LATERAL (Sidebar)
// ==================================================================
// Esta função decide o que mostrar na lateral esquerda do site.
// Cenário A (Tem Usuário): Mostra foto, estatísticas e botão "Nova Atividade".
// Cenário B (Visitante): Mostra apenas a logo do site.
function atualizarInterfaceUsuario() {
    const sidebarContainer = document.querySelector('.sidebar');
    
    // Muda o texto do botão no topo (Login ou Logout)
    const btnLoginHeader = document.getElementById('login-button');
    if (btnLoginHeader) {
        btnLoginHeader.innerText = usuarioLogado ? "Logout" : "Login";
        btnLoginHeader.className = usuarioLogado ? "login-button logout-button" : "login-button";
    }

    if (usuarioLogado) {
        // --- HTML PARA USUÁRIO LOGADO ---
        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/${usuarioLogado.imagem}" alt="Avatar" id="logo-header-btn-sidebar">
                <h3>@${usuarioLogado.nome_usuario}</h3>

                <div class="profile-stats">
                    <div class="stat-item">
                        <span>Atividades</span>
                        <strong>${usuarioLogado.stats.totalAtividades}</strong>
                    </div>
                    <div class="stat-item">
                        <span>Calorias</span>
                        <strong>${usuarioLogado.stats.totalCalorias}</strong>
                    </div>
                </div>
            </div>
            <button id="open-registro-btn" class="atividade-btn" style="margin-top: 20px;">
                    <img src="./images/progresso.svg" id="progresso" alt="Progresso">
                    Atividade
                </button>
            <footer class="main-footer">
                <span>SAEPSaúde</span>
                <div class="footer-icons">
                    <img src="./images/instagram.svg" alt="Instagram">
                    <img src="./images/tiktok.svg" alt="Facebook">
                    <img src="./images/twitter.svg" alt="Twitter">
                </div>
                <p>Copyright - 2025/2026</p>
            </footer>
        `;
        
        // Reativa o clique na logo da sidebar
        const logoSidebar = document.getElementById('logo-header-btn-sidebar');
        if(logoSidebar) logoSidebar.onclick = () => { filtroAtual = null; renderizarMainAtividades(1); };

        // Configura o botão "Atividade" para abrir a tela de cadastro
        const openRegistroBtn = document.getElementById('open-registro-btn');
        if (openRegistroBtn) {
            openRegistroBtn.addEventListener('click', () => {
                openRegistroBtn.classList.add('atividade-ativo');
                renderizarMainGerenciamento();
            });
        }

    } else {
        // --- HTML PARA VISITANTE (SEM LOGIN) ---
        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/SAEPSaude.png" alt="Avatar do Usuário" id="logo-header-btn-sidebar">
                <h3>SAEPSaúde</h3>
                <div class="profile-stats">
                    <div class="stat-item"><span>Atividades</span><strong>12</strong></div>
                    <div class="stat-item"><span>Calorias</span><strong>3500</strong></div>
                </div>
            </div>
            <footer class="main-footer">
                <span>SAEPSaúde</span>
                <div class="footer-icons">
                    <img src="./images/instagram.svg" alt="Instagram">
                    <img src="./images/tiktok.svg" alt="Facebook">
                    <img src="./images/twitter.svg" alt="Twitter">
                </div>
                <p>Copyright - 2025/2026</p>
            </footer>
        `;
        
        const logoSidebar = document.getElementById('logo-header-btn-sidebar');
        if(logoSidebar) logoSidebar.onclick = () => { filtroAtual = null; renderizarMainAtividades(1); };
    }
}


// ==================================================================
// SEÇÃO 6: O FEED DE NOTÍCIAS (Renderização Principal)
// ==================================================================
// Esta é a função principal que "desenha" a lista de atividades na tela.
async function renderizarMainAtividades(pagina = 1) {
    if (!mainContent) return;

    const paginaNum = parseInt(pagina);

    // Remove destaque do botão de cadastro se ele estiver ativo
    const btnAtividade = document.getElementById('open-registro-btn');
    if (btnAtividade) {
        btnAtividade.classList.remove('atividade-ativo');
    }

    // Função auxiliar para destacar o botão de filtro selecionado
    const getClass = (tipo) => filtroAtual === tipo ? 'active' : '';

    // 1. Desenha a estrutura básica (Cabeçalho + Filtros + Área vazia de posts)
    mainContent.innerHTML = `
        <header class="main-header">
            <h2>Atividades Recentes</h2>
            <button id="login-button" class="${ usuarioLogado ? 'login-button logout-button' : 'login-button'}">${usuarioLogado ? 'Logout' : 'Login'}</button>
        </header>

        <div class="filters">
            <button class="${getClass('corrida')}" onclick="filtrarAtividades('corrida')">Corrida</button>
            <button class="${getClass('caminhada')}" onclick="filtrarAtividades('caminhada')">Caminhada</button>
            <button class="${getClass('trilha')}" onclick="filtrarAtividades('trilha')">Trilha</button>
        </div>
        
        <section id="activity-list" class="feed-list">
            <p style="text-align:center; padding:60px; color:#888;">Carregando atividades...</p>
        </section>
        <div id="pagination-controls" class="pagination-container"></div>
    `;

    configurarLogin(); // Reconecta o botão de login que acabamos de redesenhar

    const container = document.getElementById('activity-list');

    try {
        // 2. Prepara o pedido para o servidor (API)
        const usuarioIdParam = usuarioLogado ? usuarioLogado.id : 0;
        const tipoParam = filtroAtual ? `&tipo=${filtroAtual}` : '';
        
        // Busca as atividades
        const response = await fetch(`/atividades?pagina=${pagina}&usuarioId=${usuarioIdParam}${tipoParam}`);

        if (!response.ok) {
            throw new Error('Falha ao buscar atividades.');
        }

        const data = await response.json();
        const atividades = data.atividades;
        const totalPaginas = data.totalPaginas;

        // 3. Se a lista estiver vazia, avisa. Se tiver conteúdo, cria os Cards.
        if (atividades.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">Nenhuma atividade encontrada com esse filtro.</p>';
        } else {
            // Transforma os dados em HTML visual
            container.innerHTML = atividades.map(criarCardAtividade).join('');

            // Ativa os botões de Like e Comentário para cada card criado
            atividades.forEach(atividade => {
                ligarEventosCard(atividade.id);
            });
        }

        // 4. Cria os botões de paginação no final da tela (1, 2, Próximo...)
        renderizarPaginacao(totalPaginas, paginaNum);

    } catch (error) {
        console.error("Erro ao carregar atividades:", error);
        container.innerHTML = '<p>Erro ao carregar atividades.</p>';
    }
}

// Gera os botões "Anterior", "1", "2", "Próximo"
function renderizarPaginacao(totalPaginas, paginaAtual) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    container.innerHTML = '';

    // Botão "Anterior"
    if (paginaAtual > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Anterior';
        prevBtn.classList.add('page-btn');
        prevBtn.addEventListener('click', () => {
            renderizarMainAtividades(paginaAtual - 1);
            window.scrollTo(0, 0); // Rola a tela para o topo
        });
        container.appendChild(prevBtn);
    }

    // Botões Numéricos
    for (let i = 1; i <= totalPaginas; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.classList.add('page-btn');

        if (i === paginaAtual) {
            pageBtn.classList.add('active'); // Destaca a página atual
        }

        pageBtn.addEventListener('click', () => {
            renderizarMainAtividades(i);
            window.scrollTo(0, 0);
        });
        container.appendChild(pageBtn);
    }

    // Botão "Próximo"
    if (paginaAtual < totalPaginas) {
        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Próximo';
        nextBtn.classList.add('page-btn');
        nextBtn.addEventListener('click', () => {
            renderizarMainAtividades(paginaAtual + 1);
            window.scrollTo(0, 0);
        });
        container.appendChild(nextBtn);
    }
}


// ==================================================================
// SEÇÃO 7: INTERAÇÃO SOCIAL (Likes e Comentários)
// ==================================================================
// "Liga" os botões de um post específico para que funcionem quando clicados
function ligarEventosCard(atividadeId) {
    const btnLike = document.querySelector(`[data-like-id="${atividadeId}"]`);
    const btnComment = document.querySelector(`[data-comment-id="${atividadeId}"]`);

    if (btnLike) {
        btnLike.addEventListener('click', async () => {
            // Se não estiver logado, abre o modal de login em vez de dar like
            if (!usuarioLogado) {
                const modal = document.getElementById('login-modal');
                if (modal) modal.classList.remove('hidden');
                return;
            }
            await toggleLike(atividadeId);
        });
    }

    if (btnComment) {
        btnComment.addEventListener('click', () => {
            if (!usuarioLogado) {
                const modal = document.getElementById('login-modal');
                if (modal) modal.classList.remove('hidden');
                return;
            }
            toggleComentarioForm(atividadeId); // Abre/Fecha a área de comentários
        });
    }
}

// Lógica da Curtida (Like)
async function toggleLike(atividadeId) {
    const btnLike = document.querySelector(`[data-like-id="${atividadeId}"]`);
    const imgLike = btnLike.querySelector('img');
    const spanLikes = document.querySelector(`[data-likes-count="${atividadeId}"]`);
    
    const jaCurtiu = imgLike.src.includes('CoracaoVermelho');
    let totalAtual = parseInt(spanLikes.textContent || '0');

    // Efeito visual imediato (para parecer rápido para o usuário)
    if(jaCurtiu) {
        imgLike.src = './images/coracao.svg'; // Tira o vermelho
        spanLikes.textContent = Math.max(0, totalAtual - 1);
    } else {
        imgLike.src = './images/CoracaoVermelho.svg'; // Bota o vermelho
        spanLikes.textContent = totalAtual + 1;
    }

    // Avisa o servidor que curtiu (em segundo plano)
    try {
        const response = await fetch(`/atividades/${atividadeId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: usuarioLogado.id })
        });

        if (!response.ok) throw new Error('Erro API');

    } catch (error) {
        console.error('Erro ao dar like:', error);
        // Se der erro no servidor, desfazemos a mudança visual
        if(jaCurtiu) {
            imgLike.src = './images/CoracaoVermelho.svg';
            spanLikes.textContent = totalAtual;
        } else {
            imgLike.src = './images/coracao.svg';
            spanLikes.textContent = totalAtual;
        }
        alert('Erro ao processar like');
    }
}

// Exibe ou esconde a caixinha de digitar comentário
function toggleComentarioForm(atividadeId) {
    const formContainer = document.getElementById(`comment-form-${atividadeId}`);
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        carregarComentarios(atividadeId); // Carrega as mensagens se abrir
    } else {
        formContainer.classList.add('hidden');
    }
}

// Envia o texto do comentário para o servidor
async function enviarComentario(atividadeId) {
    const textarea = document.getElementById(`comment-input-${atividadeId}`);
    const conteudo = textarea.value.trim();

    if(!conteudo){
        alert('Não é possível enviar um comentário vazio.');
        return;
    }
    if (conteudo.length <= 2) {
        alert('Comentário deve ter mais de 2 caracteres');
        return;
    }

    try {
        const response = await fetch(`/atividades/${atividadeId}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuarioId: usuarioLogado.id,
                conteudo: conteudo
            })
        });

        if (!response.ok) {
            alert('Erro ao enviar comentário');
            return;
        }

        // Limpa o campo e atualiza a lista
        textarea.value = '';

        const spanComments = document.querySelector(`[data-comments-count="${atividadeId}"]`);
        const commentsRes = await fetch(`/atividades/${atividadeId}/comentarios`);
        const commentsData = await commentsRes.json();
        spanComments.textContent = commentsData.total;

        carregarComentarios(atividadeId);
        alert('Comentário adicionado!');

    } catch (error) {
        console.error('Erro ao enviar comentário:', error);
        alert('Erro ao enviar comentário');
    }
}

// Busca os comentários do banco de dados e desenha na tela
async function carregarComentarios(atividadeId) {
    const listaComentarios = document.getElementById(`comments-list-${atividadeId}`);
    try {
        const response = await fetch(`/atividades/${atividadeId}/comentarios`);
        const data = await response.json();

        if (data.comentarios.length === 0) {
            listaComentarios.innerHTML = '<p style="text-align: center; color: #888;">Nenhum comentário ainda.</p>';
            return;
        }

        // Cria o HTML de cada comentário
        listaComentarios.innerHTML = data.comentarios.map(comentario => `
            <div class="comment-item">
                <img src="./images/${comentario.usuario_id.imagem}" alt="Avatar">
                <div>
                    <strong>@${comentario.usuario_id.nome_usuario}</strong>
                    <p>${comentario.content}</p>
                    <span class="comment-date">${formatarData(comentario.created_at)}</span>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erro ao carregar comentários:', error);
    }
}


// ==================================================================
// SEÇÃO 8: TELA DE GERENCIAMENTO (Criar Atividade)
// ==================================================================
// Renderiza a tela onde o usuário preenche os dados para salvar uma atividade
async function renderizarMainGerenciamento() {
    if (!usuarioLogado) return renderizarMainAtividades(1);
    if (!mainContent) return;

    // Desenha o formulário na tela
    mainContent.innerHTML = `
        <header class="main-header">
            <h2>Gerenciamento de Atividades</h2>
            <button id="login-button" class="login-button logout-button">Logout</button>
        </header>

        <div class="activity-registration-container">
            <h3>Crie sua atividade</h3>
            
            <form id="atividade-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="tipo_atividade_form">Tipo da atividade</label>
                        <input type="text" id="tipo_atividade_form" placeholder="Ex: Caminhada">
                    </div>

                    <div class="form-group">
                        <label for="distancia_form">Distância percorrida</label>
                        <input type="text" id="distancia_form" placeholder="Ex: 1000 metros">
                    </div>

                    <div class="form-group">
                        <label for="duracao_form">Duração da atividade</label>
                        <input type="text" id="duracao_form" placeholder="Ex: 120 min">
                    </div>

                    <div class="form-group">
                        <label for="calorias_form">Quantidade de Calorias</label>
                        <input type="text" id="calorias_form" placeholder="Ex: 300">
                    </div>
                </div>

                <div class="form-footer-right">
                    <button type="submit" class="btn-black">Criar Atividade</button>
                </div>
            </form>
        </div>

        <h3>Minhas Atividades Registradas</h3>
        <div id="minhas-atividades-lista">
            <p style="text-align:center; padding:60px; color:#888;">Carregando suas atividades...</p>
        </div>
    `;

    configurarLogin();

    // Prepara o formulário para receber o "submit" (clique em enviar)
    const atividadeForm = document.getElementById('atividade-form');
    if (atividadeForm) {
        atividadeForm.addEventListener('submit', handleRegistroAtividade);
    }

    carregarMinhasAtividades();
}

// Busca apenas as atividades do PRÓPRIO usuário para mostrar no histórico pessoal
async function carregarMinhasAtividades() {

    const openRegistroBtn = document.getElementById('open-registro-btn');
    const listaDiv = document.getElementById('minhas-atividades-lista');

    if (!listaDiv || !usuarioLogado) return;

    openRegistroBtn.classList.add('atividade-ativo');

    const usuarioId = usuarioLogado.id;

    try {
        const response = await fetch(`/minhas-atividades?usuarioId=${usuarioId}`);
        if (!response.ok) throw new Error('Falha ao buscar atividades pessoais.');

        const atividades = await response.json();

        if (atividades.length === 0) {
            listaDiv.innerHTML = '<p>Você ainda não registrou nenhuma atividade.</p>';
            return;
        }
        listaDiv.innerHTML = `<div class="feed-list">${atividades.map(criarCardAtividade).join('')}</div>`;

        atividades.forEach(atividade => {
            ligarEventosCard(atividade.id);
        });

    } catch (error) {
        console.error('Erro ao carregar atividades pessoais:', error);
        listaDiv.innerHTML = '<p>Erro ao carregar sua lista de atividades.</p>';
    }
}

// Processa o cadastro da nova atividade
async function handleRegistroAtividade(e) {
    e.preventDefault(); // Evita recarregar a página
    if (!usuarioLogado) {
        alert("Você precisa estar logado.");
        return;
    }

    const form = e.target;
    
    limparErros(form);

    // Captura os campos
    const tipoInput = form.tipo_atividade_form;
    const distanciaInput = form.distancia_form;
    const duracaoInput = form.duracao_form;
    const caloriasInput = form.calorias_form;

    let temErro = false;
    // Validação: Confere se está tudo preenchido
    if (!tipoInput.value.trim()) { mostrarErro(tipoInput, 'Campo obrigatório'); temErro = true; }
    if (!distanciaInput.value.trim()) { mostrarErro(distanciaInput, 'Campo obrigatório'); temErro = true; }
    if (!duracaoInput.value.trim()) { mostrarErro(duracaoInput, 'Campo obrigatório'); temErro = true; }
    if (!caloriasInput.value.trim()) { mostrarErro(caloriasInput, 'Campo obrigatório'); temErro = true; }

    if (temErro) return;

    // Limpa os dados (Ex: remove letras dos campos de números)
    const tipoTexto = tipoInput.value.trim();
    const distanciaTexto = distanciaInput.value.replace(/\D/g, ""); 
    const duracaoTexto = duracaoInput.value.replace(/\D/g, "");
    const caloriasTexto = caloriasInput.value.replace(/\D/g, "");

    // Verifica se o tipo é válido
    const tiposPermitidos = ['corrida', 'caminhada', 'trilha'];
    if (!tiposPermitidos.includes(tipoTexto.toLowerCase())) {
        mostrarErro(tipoInput, 'Apenas: Corrida, Caminhada ou Trilha');
        return; 
    }

    const tipoFormatado = tipoTexto.charAt(0).toLowerCase() + tipoTexto.slice(1).toLowerCase();

    // Cria o objeto com os dados finais
    const novaAtividade = {
        tipo_atividade: tipoFormatado,
        distancia_percorrida: parseInt(distanciaTexto),
        duracao_atividade: parseInt(duracaoTexto),
        quantidade_calorias: parseInt(caloriasTexto),
        usuario_id: usuarioLogado.id
    };

    // Envia para o servidor
    try {
        const response = await fetch('/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaAtividade)
        });

        if (!response.ok) throw new Error('Falha ao registrar.');

        alert('Atividade registrada com sucesso!');
        form.reset();
        limparErros(form);

        // Pequeno truque para atualizar os dados do usuário (contagem de atividades)
        const resLogin = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: usuarioLogado.email, senha: usuarioLogado.senha })
        });
        if (resLogin.ok) {
            usuarioLogado = await resLogin.json();
            atualizarInterfaceUsuario();
        }
        carregarMinhasAtividades();

    } catch (erro) {
        console.error(erro);
        alert('Erro ao registrar atividade.');
    }
}


// ==================================================================
// SEÇÃO 9: UTILITÁRIOS (Ajudantes Visuais)
// ==================================================================

// Função "Forma de Bolo": Pega os dados da atividade e cria o HTML do Card
function criarCardAtividade(atividade) {
    // Converte metros para KM
    const distKM = (atividade.distancia_percorrida / 1000).toFixed(2);
    // Formata o tempo (ex: 90min -> 1h 30min)
    const duracaoFormatada = formatarDuracao(atividade.duracao_atividade);
    // Formata a data
    const dataFormatada = formatarData(atividade.createdAt || atividade.createdat);

    const autor = atividade.usuario_id || {};
    const nomeUsuario = autor.nome_usuario || 'Desconhecido';
    const imagemUsuario = autor.imagem || 'SAEPSaude.png';
    
    // Verifica se EU curti esse post para pintar o coração de vermelho
    const usuarioCurtiu = usuarioLogado &&
        atividade.usuariosQueCurtiram &&
        atividade.usuariosQueCurtiram.some(id => Number(id) === Number(usuarioLogado.id));
    const iconeLike = usuarioCurtiu ? './images/CoracaoVermelho.svg' : './images/coracao.svg';

    return `
        <article class="activity-card">
            <div class="card-header">
                <div class="user-info">
                    <img src="./images/${imagemUsuario}" alt="Avatar">
                    <span>@${nomeUsuario}</span>
                </div>
                <span class="card-date">${dataFormatada}</span>
            </div>
            <h4 class="activity-title">${atividade.tipo_atividade}</h4>
            <div class="card-stats">
                <p>Distância: <strong>${distKM} km</strong></p>
                <p>Duração: <strong>${duracaoFormatada}</strong></p>
                <p>Calorias: <strong>${atividade.quantidade_calorias} kcal</strong></p>
            </div>
            <div class="card-footer">
                <button class="icon-button" data-like-id="${atividade.id}">
                    <img src="${iconeLike}" alt="Like">
                    <span data-likes-count="${atividade.id}">${atividade.totalLikes || 0}</span>
                </button>
                <button class="icon-button" data-comment-id="${atividade.id}">
                    <img src="./images/comentario.svg" alt="Comentar">
                    <span data-comments-count="${atividade.id}">${atividade.totalComentarios || 0}</span>
                </button>
            </div>
            
            <div id="comment-form-${atividade.id}" class="comment-form hidden">
                <div id="comments-list-${atividade.id}" class="comments-list"></div>
                <div class="comment-input-container">
                    <textarea 
                        id="comment-input-${atividade.id}" 
                        placeholder="Escrever um comentário..."
                        maxlength="500"
                    ></textarea>
                    <button onclick="enviarComentario(${atividade.id})" class="send-btn">
                        <img src="./images/send.svg" alt="Enviar">
                    </button>
                </div>
            </div>
        </article>
    `;
}

// Função ajudante: Converte minutos em horas e minutos legíveis
function formatarDuracao(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    if (horas === 0) return `${minutos}min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
}

// Função ajudante: Transforma a data do sistema em Dia/Mês/Ano Hora:Minuto
function formatarData(isoString) {
    if (!isoString) return '';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}