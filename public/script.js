let usuarioLogado = null;
const mainContent = document.getElementById('main-content');

// ----------------------------------------------------------------------
// 1. INICIALIZAÇÃO E NAVEGAÇÃO
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    renderizarMainAtividades(1);
    configurarLogin();
    configurarListenerLogo();
});

function configurarListenerLogo() {
    const logoButton = document.getElementById('logo-header-btn');
    if (logoButton) {
        logoButton.removeEventListener('click', () => renderizarMainAtividades(1));
        logoButton.addEventListener('click', () => {
            renderizarMainAtividades(1);
        });
    }
}

// ----------------------------------------------------------------------
// 2. LOGIC: LOGIN / LOGOUT
// ----------------------------------------------------------------------

function configurarLogin() {
    const modal = document.getElementById('login-modal');
    const btnLoginHeader = document.getElementById('login-button');
    const btnClose = document.getElementById('close-modal-btn');
    const form = document.getElementById('login-form');

    if (btnLoginHeader) {
        btnLoginHeader.addEventListener('click', () => {
            if (usuarioLogado) {
                fazerLogout();
            } else {
                if (modal) {
                    modal.classList.remove('hidden');
                }
            }
        });
    }

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const senha = document.getElementById('password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                if (!response.ok) {
                    alert('Email ou senha incorretos!');
                    return;
                }

                const dadosUsuario = await response.json();
                usuarioLogado = dadosUsuario;

                modal.classList.add('hidden');
                atualizarInterfaceUsuario();

                alert(`Bem-vindo, ${usuarioLogado.nome_usuario}!`);
                renderizarMainAtividades(1)

            } catch (erro) {
                console.error(erro);
                alert('Erro ao tentar fazer login. Verifique sua rota POST /login.');
            }
        });
    }
}

function fazerLogout() {
    usuarioLogado = null;
    atualizarInterfaceUsuario();
    renderizarMainAtividades(1);
    alert("Você saiu da conta.");
}

// ----------------------------------------------------------------------
// 3. ATUALIZAÇÃO DA INTERFACE (SIDEBAR)
// ----------------------------------------------------------------------

function atualizarInterfaceUsuario() {
    const btnLoginHeader = document.getElementById('login-button');
    const sidebarContainer = document.querySelector('.sidebar');

    if (usuarioLogado) {
        if (btnLoginHeader) {
            btnLoginHeader.innerText = "Sair";
            btnLoginHeader.style.backgroundColor = "#d9534f";
        }

        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/${usuarioLogado.imagem}" alt="Avatar" id="logo-header-btn">
                <h3>@${usuarioLogado.nome_usuario}</h3>
                <p>${usuarioLogado.nome || ''}</p> 

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
                
                <button id="open-registro-btn" class="submit-btn" style="margin-top: 20px;">
                    Registrar Atividade
                </button>
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

        configurarListenerLogo();

        const openRegistroBtn = document.getElementById('open-registro-btn');
        if (openRegistroBtn) {
            openRegistroBtn.addEventListener('click', () => {
                renderizarMainGerenciamento();
            });
        }

    } else {
        if (btnLoginHeader) {
            btnLoginHeader.innerText = "Login";
            btnLoginHeader.style.backgroundColor = "#483DAD";
        }

        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/SAEPSaude.png" alt="Avatar do Usuário" id="logo-header-btn">
                <h3>SAEPSaúde</h3>
                <div class="profile-stats">
                    <div class="stat-item">
                        <span>Atividades</span>
                        <strong>12</strong>
                    </div>
                    <div class="stat-item">
                        <span>Calorias</span>
                        <strong>3500</strong>
                    </div>
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
        configurarListenerLogo();
    }
}

// ----------------------------------------------------------------------
// 4. RENDERIZAÇÃO DA PÁGINA PRINCIPAL (FEED)
// ----------------------------------------------------------------------

async function renderizarMainAtividades(pagina = 1) {
    if (!mainContent) return;

    mainContent.innerHTML = `
        <header class="main-header">
            <h2>Atividades Recentes</h2>
            <button id="login-button">${usuarioLogado ? 'Sair' : 'Login'}</button>
        </header>

        <div class="filters">
            <button>Corrida</button>
            <button>Caminhada</button>
            <button>Trilha</button>
        </div>
        
        <section id="activity-list" class="feed-list">
            <p>Carregando atividades...</p>
        </section>
        <div id="pagination-controls" class="pagination-container"></div>
    `;

    configurarLogin();

    const container = document.getElementById('activity-list');

    try {

        const usuarioIdParam = usuarioLogado ? usuarioLogado.id : 0;

        const response = await fetch(`/atividades?pagina=${pagina}&usuarioId=${usuarioIdParam}`);

        if (!response.ok) {
            throw new Error('Falha ao buscar atividades.');
        }

        const data = await response.json();
        const atividades = data.atividades;
        const totalPaginas = data.totalPaginas;

        if (atividades.length === 0) {
            container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
        } else {
            // Busca likes e comentários para cada atividade
            for (let atividade of atividades) {
                const likesRes = await fetch(`/atividades/${atividade.id}/likes`);
                const likesData = await likesRes.json();
                atividade.totalLikes = likesData.total;
                atividade.usuariosQueCurtiram = likesData.usuarios;

                const commentsRes = await fetch(`/atividades/${atividade.id}/comentarios`);
                const commentsData = await commentsRes.json();
                atividade.totalComentarios = commentsData.total;
                atividade.comentarios = commentsData.comentarios;
            }

            container.innerHTML = atividades.map(criarCardAtividade).join('');

            // Liga os event listeners de like e comentário
            atividades.forEach(atividade => {
                ligarEventosCard(atividade.id);
            });
        }

        renderizarPaginacao(totalPaginas, pagina);

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
            renderizarMainAtividades(paginaAtual - 1)
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
            renderizarMainAtividades(paginaAtual + 1)
            window.scrollTo(0, 0);
        });
        container.appendChild(nextBtn);
    }
}

// ----------------------------------------------------------------------
// 5. LIKES E COMENTÁRIOS
// ----------------------------------------------------------------------

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
    try {
        const response = await fetch(`/atividades/${atividadeId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: usuarioLogado.id })
        });

        if (!response.ok) {
            alert('Erro ao processar like');
            return;
        }

        const data = await response.json();

        // Atualiza a UI
        const btnLike = document.querySelector(`[data-like-id="${atividadeId}"]`);
        const imgLike = btnLike.querySelector('img');
        const spanLikes = document.querySelector(`[data-likes-count="${atividadeId}"]`);

        // Busca o total atualizado
        const likesRes = await fetch(`/atividades/${atividadeId}/likes`);
        const likesData = await likesRes.json();

        spanLikes.textContent = likesData.total;

        // Verifica se o usuário atual curtiu
        const usuarioCurtiu = likesData.usuarios.includes(usuarioLogado.id);

        if (usuarioCurtiu) {
            // Curtiu: Usa o CoracaoVermelho.svg
            imgLike.src = './images/CoracaoVermelho.svg';
            imgLike.style.filter = 'none'; // Remove o filtro se houver
        } else {
            // Não curtiu: Volta para o coracao.svg original (vazio)
            imgLike.src = './images/coracao.svg';
            imgLike.style.filter = 'none';
        }

    } catch (error) {
        console.error('Erro ao dar like:', error);
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

        // Limpa o campo
        textarea.value = '';

        // Atualiza a contagem
        const spanComments = document.querySelector(`[data-comments-count="${atividadeId}"]`);
        const commentsRes = await fetch(`/atividades/${atividadeId}/comentarios`);
        const commentsData = await commentsRes.json();
        spanComments.textContent = commentsData.total;

        // Recarrega os comentários
        carregarComentarios(atividadeId);

        alert('Comentário adicionado com sucesso!');

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

// ----------------------------------------------------------------------
// 6. RENDERIZAÇÃO DA PÁGINA DE GERENCIAMENTO
// ----------------------------------------------------------------------

async function renderizarMainGerenciamento() {
    if (!usuarioLogado) {
        return renderizarMainAtividades(1);
    }

    if (!mainContent) return;

    mainContent.innerHTML = `
        <header class="main-header">
            <h2>Gerenciamento de Atividades</h2>
            <button id="login-button">Sair</button>
        </header>

        <div id="cadastro-container">
            <h3>Registrar Nova Atividade</h3>
            <form id="atividade-form" class="form-page">
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="tipo_atividade_form">Tipo</label>
                        <select id="tipo_atividade_form" required>
                            <option value="corrida">Corrida</option>
                            <option value="caminhada">Caminhada</option>
                            <option value="trilha">Trilha</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="distancia_form">Distância (m)</label>
                        <input type="number" id="distancia_form" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="duracao_form">Duração (min)</label>
                        <input type="number" id="duracao_form" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="calorias_form">Calorias</label>
                        <input type="number" id="calorias_form" min="1" required>
                    </div>
                </div>
                <div class="form-actions-full">
                    <button type="submit" class="submit-btn" style="width: 100%;">Registrar</button>
                </div>
            </form>
        </div>

        <h3>Minhas Atividades Registradas</h3>
        <div id="minhas-atividades-lista">
            <p>Carregando suas atividades...</p>
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

        // Busca likes e comentários
        for (let atividade of atividades) {
            const likesRes = await fetch(`/atividades/${atividade.id}/likes`);
            const likesData = await likesRes.json();
            atividade.totalLikes = likesData.total;
            atividade.usuariosQueCurtiram = likesData.usuarios;

            const commentsRes = await fetch(`/atividades/${atividade.id}/comentarios`);
            const commentsData = await commentsRes.json();
            atividade.totalComentarios = commentsData.total;
            atividade.comentarios = commentsData.comentarios;
        }

        listaDiv.innerHTML = `<div class="feed-list">${atividades.map(criarCardAtividade).join('')}</div>`;

        // Liga eventos
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
        alert("Você precisa estar logado para registrar uma atividade.");
        return;
    }

    const form = e.target;
    const novaAtividade = {
        tipo_atividade: form.tipo_atividade_form.value,
        distancia_percorrida: form.distancia_form.value,
        duracao_atividade: form.duracao_form.value,
        quantidade_calorias: form.calorias_form.value,
        usuario_id: usuarioLogado.id
    };

    try {
        const response = await fetch('/atividades', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(novaAtividade)
        });

        if (!response.ok) {
            throw new Error('Falha ao registrar atividade.');
        }

        alert('Atividade registrada com sucesso!');
        form.reset();

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

    console.log(`🔎 Analisando Atividade ${atividade.id}:`);
    console.log("   Eu sou:", usuarioLogado);
    console.log("   Quem curtiu (lista):", atividade.usuariosQueCurtiram);
    
    if (usuarioLogado && atividade.usuariosQueCurtiram) {
         // Teste de comparação direta pra ver se o JS tá de birra com tipos
        const temMeuId = atividade.usuariosQueCurtiram.some(id => id == usuarioLogado.id);
        console.log(`   Match (==): ${temMeuId}`);
    } else {
        console.log("   ❌ Não deu pra comparar (usuário deslogado ou lista vazia)");
    }

    const distKM = (atividade.distancia_percorrida / 1000).toFixed(2);
    const duracaoFormatada = formatarDuracao(atividade.duracao_atividade);
    const dataFormatada = formatarData(atividade.createdAt || atividade.createdat);

    const autor = atividade.usuario_id;
    const nomeUsuario = autor && autor.nome_usuario ? autor.nome_usuario : (atividade.nome_usuario_rel || 'Desconhecido');
    const imagemUsuario = autor && autor.imagem ? autor.imagem : (atividade.imagem_rel || 'SAEPSaude.png');
    
    // Verifica se o usuário atual curtiu
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

    if (horas === 0) {
        return `${minutos}min`;
    }

    if (minutos === 0) {
        return `${horas}h`;
    }

    return `${horas}h ${minutos}min`;
}

function formatarData(isoString) {
    if (!isoString) return '';
    const data = new Date(isoString);

    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}