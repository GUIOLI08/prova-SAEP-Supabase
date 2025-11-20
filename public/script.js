let usuarioLogado = null;
let filtroAtual = null; 

const mainContent = document.getElementById('main-content');


document.addEventListener('DOMContentLoaded', () => {
    renderizarMainAtividades(1);
    configurarListenerLogo();
});

function configurarListenerLogo() {
    const logoButton = document.getElementById('logo-header-btn');
    if (logoButton) {
        const novoLogo = logoButton.cloneNode(true);
        logoButton.parentNode.replaceChild(novoLogo, logoButton);
        
        novoLogo.addEventListener('click', () => {
            filtroAtual = null; 
            renderizarMainAtividades(1);
        });
    }
}

window.filtrarAtividades = function(tipo) {
    if (filtroAtual === tipo) {
        filtroAtual = null;
    } else {
        filtroAtual = tipo;
    }
    renderizarMainAtividades(1);
}

function configurarLogin() {
    const modal = document.getElementById('login-modal');
    const btnLoginHeader = document.getElementById('login-button');
    const btnClose = document.getElementById('close-modal-btn');
    const btnCancel = document.getElementById('cancel-btn');
    const form = document.getElementById('login-form');

    if (btnLoginHeader) {
        const novoBtn = btnLoginHeader.cloneNode(true);
        btnLoginHeader.parentNode.replaceChild(novoBtn, btnLoginHeader);
        
        novoBtn.addEventListener('click', () => {
            if (usuarioLogado) {
                fazerLogout();
            } else {
                if (modal) modal.classList.remove('hidden');
            }
        });
    }

    if (btnClose) btnClose.onclick = () => modal.classList.add('hidden');
    if (btnCancel) btnCancel.onclick = () => modal.classList.add('hidden');

    if (form) {
        form.onsubmit = async (e) => {
            e.preventDefault();

            limparErros(form);

            const emailInput = document.getElementById('email');
            const senhaInput = document.getElementById('password');
            
            const email = emailInput.value.trim();
            const senha = senhaInput.value.trim();
            let temErro = false;

            if (!email) {
                mostrarErro(emailInput, 'O e-mail é obrigatório.');
                temErro = true;
            }
            if (!senha) {
                mostrarErro(senhaInput, 'A senha é obrigatória.');
                temErro = true;
            }

            if (temErro) return;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                if (!response.ok) {
                    mostrarErro(emailInput, '');
                    mostrarErro(senhaInput, 'E-mail ou senha incorretos.'); 
                    return;
                }

                const dadosUsuario = await response.json();
                usuarioLogado = dadosUsuario;

                modal.classList.add('hidden');
                atualizarInterfaceUsuario();
                
                filtroAtual = null; 
                renderizarMainAtividades(1);

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

function limparErros(formElement) {
    const inputs = formElement.querySelectorAll('.input-error');
    inputs.forEach(input => input.classList.remove('input-error'));
    
    const mensagens = formElement.querySelectorAll('.error-message');
    mensagens.forEach(msg => msg.remove());
}

function fazerLogout() {
    usuarioLogado = null;
    filtroAtual = null;
    atualizarInterfaceUsuario();
    renderizarMainAtividades(1);
    alert("Você saiu da conta.");
}

function atualizarInterfaceUsuario() {
    const sidebarContainer = document.querySelector('.sidebar');
    
    const btnLoginHeader = document.getElementById('login-button');
    if (btnLoginHeader) {
        btnLoginHeader.innerText = usuarioLogado ? "Logout" : "Login";
        btnLoginHeader.className = usuarioLogado ? "login-button logout-button" : "login-button";
    }

    if (usuarioLogado) {
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
        
        const logoSidebar = document.getElementById('logo-header-btn-sidebar');
        if(logoSidebar) logoSidebar.onclick = () => { filtroAtual = null; renderizarMainAtividades(1); };

        const openRegistroBtn = document.getElementById('open-registro-btn');
        if (openRegistroBtn) {
            openRegistroBtn.addEventListener('click', () => {
                openRegistroBtn.classList.add('atividade-ativo')
                renderizarMainGerenciamento();
            });
        }

    } else {
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

async function renderizarMainAtividades(pagina = 1) {
    if (!mainContent) return;

    const paginaNum = parseInt(pagina);

    const btnAtividade = document.getElementById('open-registro-btn');
    if (btnAtividade) {
        btnAtividade.classList.remove('atividade-ativo');
    }

    const getClass = (tipo) => filtroAtual === tipo ? 'active' : '';

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

    configurarLogin();

    const container = document.getElementById('activity-list');

    try {
        const usuarioIdParam = usuarioLogado ? usuarioLogado.id : 0;
        
        const tipoParam = filtroAtual ? `&tipo=${filtroAtual}` : '';
        
        const response = await fetch(`/atividades?pagina=${pagina}&usuarioId=${usuarioIdParam}${tipoParam}`);

        if (!response.ok) {
            throw new Error('Falha ao buscar atividades.');
        }

        const data = await response.json();
        const atividades = data.atividades;
        const totalPaginas = data.totalPaginas;

        if (atividades.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">Nenhuma atividade encontrada com esse filtro.</p>';
        } else {
            
            container.innerHTML = atividades.map(criarCardAtividade).join('');

            atividades.forEach(atividade => {
                ligarEventosCard(atividade.id);
            });
        }

        renderizarPaginacao(totalPaginas, paginaNum);

    } catch (error) {
        console.error("Erro ao carregar atividades:", error);
        container.innerHTML = '<p>Erro ao carregar atividades.</p>';
    }
}

function renderizarPaginacao(totalPaginas, paginaAtual) {
    const container = document.getElementById('pagination-controls');
    if (!container) return;

    container.innerHTML = '';

    if (paginaAtual > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Anterior';
        prevBtn.classList.add('page-btn');
        prevBtn.addEventListener('click', () => {
            renderizarMainAtividades(paginaAtual - 1);
            window.scrollTo(0, 0);
        });
        container.appendChild(prevBtn);
    }

    for (let i = 1; i <= totalPaginas; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.classList.add('page-btn');

        if (i === paginaAtual) {
            pageBtn.classList.add('active');
        }

        pageBtn.addEventListener('click', () => {
            renderizarMainAtividades(i);
            window.scrollTo(0, 0);
        });
        container.appendChild(pageBtn);
    }

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

function ligarEventosCard(atividadeId) {
    const btnLike = document.querySelector(`[data-like-id="${atividadeId}"]`);
    const btnComment = document.querySelector(`[data-comment-id="${atividadeId}"]`);

    if (btnLike) {
        btnLike.addEventListener('click', async () => {
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
            toggleComentarioForm(atividadeId);
        });
    }
}

async function toggleLike(atividadeId) {
    const btnLike = document.querySelector(`[data-like-id="${atividadeId}"]`);
    const imgLike = btnLike.querySelector('img');
    const spanLikes = document.querySelector(`[data-likes-count="${atividadeId}"]`);
    
    const jaCurtiu = imgLike.src.includes('CoracaoVermelho');
    let totalAtual = parseInt(spanLikes.textContent || '0');

    if(jaCurtiu) {
        imgLike.src = './images/coracao.svg';
        spanLikes.textContent = Math.max(0, totalAtual - 1);
    } else {
        imgLike.src = './images/CoracaoVermelho.svg';
        spanLikes.textContent = totalAtual + 1;
    }

    try {
        const response = await fetch(`/atividades/${atividadeId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: usuarioLogado.id })
        });

        if (!response.ok) throw new Error('Erro API');

    } catch (error) {
        console.error('Erro ao dar like:', error);
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

function toggleComentarioForm(atividadeId) {
    const formContainer = document.getElementById(`comment-form-${atividadeId}`);
    if (formContainer.classList.contains('hidden')) {
        formContainer.classList.remove('hidden');
        carregarComentarios(atividadeId);
    } else {
        formContainer.classList.add('hidden');
    }
}

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

async function carregarComentarios(atividadeId) {
    const listaComentarios = document.getElementById(`comments-list-${atividadeId}`);
    try {
        const response = await fetch(`/atividades/${atividadeId}/comentarios`);
        const data = await response.json();

        if (data.comentarios.length === 0) {
            listaComentarios.innerHTML = '<p style="text-align: center; color: #888;">Nenhum comentário ainda.</p>';
            return;
        }

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

async function renderizarMainGerenciamento() {
    if (!usuarioLogado) return renderizarMainAtividades(1);
    if (!mainContent) return;

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

    const atividadeForm = document.getElementById('atividade-form');
    if (atividadeForm) {
        atividadeForm.addEventListener('submit', handleRegistroAtividade);
    }

    carregarMinhasAtividades();
}

async function carregarMinhasAtividades() {
    const listaDiv = document.getElementById('minhas-atividades-lista');
    if (!listaDiv || !usuarioLogado) return;

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

async function handleRegistroAtividade(e) {
    e.preventDefault();
    if (!usuarioLogado) {
        alert("Você precisa estar logado.");
        return;
    }

    const form = e.target;
    
    limparErros(form);

    const tipoInput = form.tipo_atividade_form;
    const distanciaInput = form.distancia_form;
    const duracaoInput = form.duracao_form;
    const caloriasInput = form.calorias_form;

    let temErro = false;
    if (!tipoInput.value.trim()) {
        mostrarErro(tipoInput, 'Campo obrigatório');
        temErro = true;
    }
    if (!distanciaInput.value.trim()) {
        mostrarErro(distanciaInput, 'Campo obrigatório');
        temErro = true;
    }
    if (!duracaoInput.value.trim()) {
        mostrarErro(duracaoInput, 'Campo obrigatório');
        temErro = true;
    }
    if (!caloriasInput.value.trim()) {
        mostrarErro(caloriasInput, 'Campo obrigatório');
        temErro = true;
    }

    if (temErro) return;

    const tipoTexto = tipoInput.value.trim();
    const distanciaTexto = distanciaInput.value.replace(/\D/g, ""); 
    const duracaoTexto = duracaoInput.value.replace(/\D/g, "");
    const caloriasTexto = caloriasInput.value.replace(/\D/g, "");

    const tiposPermitidos = ['corrida', 'caminhada', 'trilha'];
    
    if (!tiposPermitidos.includes(tipoTexto.toLowerCase())) {
        mostrarErro(tipoInput, 'Apenas: Corrida, Caminhada ou Trilha');
        return; 
    }

    const tipoFormatado = tipoTexto.charAt(0).toLowerCase() + tipoTexto.slice(1).toLowerCase();

    const novaAtividade = {
        tipo_atividade: tipoFormatado,
        distancia_percorrida: parseInt(distanciaTexto),
        duracao_atividade: parseInt(duracaoTexto),
        quantidade_calorias: parseInt(caloriasTexto),
        usuario_id: usuarioLogado.id
    };

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

function criarCardAtividade(atividade) {
    const distKM = (atividade.distancia_percorrida / 1000).toFixed(2);
    const duracaoFormatada = formatarDuracao(atividade.duracao_atividade);
    const dataFormatada = formatarData(atividade.createdAt || atividade.createdat);

    const autor = atividade.usuario_id || {};
    const nomeUsuario = autor.nome_usuario || 'Desconhecido';
    const imagemUsuario = autor.imagem || 'SAEPSaude.png';
    
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

function formatarDuracao(totalMinutos) {
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    if (horas === 0) return `${minutos}min`;
    if (minutos === 0) return `${horas}h`;
    return `${horas}h ${minutos}min`;
}

function formatarData(isoString) {
    if (!isoString) return '';
    const data = new Date(isoString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}