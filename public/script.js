let usuarioLogado = null;
const mainContent = document.getElementById('main-content'); // Elemento <main id="main-content">

// ----------------------------------------------------------------------
// 1. INICIALIZAÇÃO E NAVEGAÇÃO
// ----------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Começa renderizando o feed de atividades
    renderizarMainAtividades(1); 
    // 2. Configura a lógica inicial de login (modal e o primeiro btn do header)
    configurarLogin();
    
    // 3. Configura o clique no logo para voltar para o feed principal
    configurarListenerLogo();
});

function configurarListenerLogo() {
    // Liga o listener do logo que sempre deve levar ao feed principal
    const logoButton = document.getElementById('logo-header-btn'); 
    if (logoButton) {
        // Remove listeners antigos para evitar duplicação (boa prática)
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
    // O botão de login/sair é recriado dentro da main, então buscamos ele aqui
    const btnLoginHeader = document.getElementById('login-button'); 
    const btnClose = document.getElementById('close-modal-btn');
    const form = document.getElementById('login-form');

    // Listener do botão no Header (Login ou Sair)
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

    // Listeners do Modal
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
    // Volta para o feed principal ao deslogar
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
        // MODO LOGADO
        if (btnLoginHeader) {
            btnLoginHeader.innerText = "Sair";
            btnLoginHeader.style.backgroundColor = "#d9534f"; // Cor para Sair
        }

        // Renderiza a sidebar com os dados REAIS e o botão de registro
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
        
        // RE-LIGA O LISTENER DO LOGO (foi recriado)
        configurarListenerLogo();
        
        // Liga o listener DEPOIS que o botão foi injetado!
        const openRegistroBtn = document.getElementById('open-registro-btn');
        if (openRegistroBtn) {
             openRegistroBtn.addEventListener('click', () => {
                 // Chama a função para renderizar a nova tela
                 renderizarMainGerenciamento(); 
             });
        }


    } else {
        // MODO DESLOGADO (Volta ao padrão)
        if (btnLoginHeader) {
            btnLoginHeader.innerText = "Login";
            btnLoginHeader.style.backgroundColor = "#483DAD"; // Cor para Login
        }

        // Renderiza a sidebar padrão do HTML
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
        // RE-LIGA O LISTENER DO LOGO (foi recriado)
        configurarListenerLogo();
    }
}

// ----------------------------------------------------------------------
// 4. RENDERIZAÇÃO DA PÁGINA PRINCIPAL (FEED)
// ----------------------------------------------------------------------

async function renderizarMainAtividades(pagina = 1) {
    if (!mainContent) return;
    
    // 1. Injeta a estrutura do Feed
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

    // 2. RE-LIGA O LISTENER DO BOTÃO DE LOGIN/SAIR
    configurarLogin();
    
    const container = document.getElementById('activity-list');

    try {
        const response = await fetch(`/atividades?pagina=${pagina}`);
        if (!response.ok) {
            throw new Error('Falha ao buscar atividades.');
        }

        const data = await response.json();
        const atividades = data.atividades;
        const totalPaginas = data.totalPaginas;

        if (atividades.length === 0) {
            container.innerHTML = '<p>Nenhuma atividade encontrada.</p>';
        } else {
             // Usa a função auxiliar para criar todos os cards
            container.innerHTML = atividades.map(criarCardAtividade).join('');
        }
        
        renderizarPaginacao(totalPaginas, pagina);

    } catch (error) {
        console.error("Erro ao carregar atividades:", error);
        container.innerHTML = '<p>Erro ao carregar atividades. (Verifique o servidor Node.js/Express).</p>';
    }
}

// 💥 FUNÇÃO CORRIGIDA 💥
function renderizarPaginacao(totalPaginas, paginaAtual) {
    const container = document.getElementById('pagination-controls');
    if (!container) return; 
    
    container.innerHTML = '';
    
    // 1. Cria o botão 'Anterior'
    if (paginaAtual > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.innerText = 'Anterior';
        prevBtn.classList.add('page-btn'); // Adicione uma classe para estilização
        prevBtn.addEventListener('click', () => {
            renderizarMainAtividades(paginaAtual - 1)
            window.scrollTo(0, 0); // Opcional: Rola para o topo da página ao mudar
        });
        container.appendChild(prevBtn);
    }

    // 2. Cria os botões de página (1, 2, 3...)
    for (let i = 1; i <= totalPaginas; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.innerText = i;
        pageBtn.classList.add('page-btn');
        
        if (i === paginaAtual) {
            pageBtn.classList.add('active'); // Destaca a página atual
        }
        
        pageBtn.addEventListener('click', () => {
            renderizarMainAtividades(i);
            window.scrollTo(0, 0); // Opcional: Rola para o topo da página ao mudar
        });
        container.appendChild(pageBtn);
    }

    // 3. Cria o botão 'Próximo'
    if (paginaAtual < totalPaginas) {
        const nextBtn = document.createElement('button');
        nextBtn.innerText = 'Próximo';
        nextBtn.classList.add('page-btn'); // Adicione uma classe para estilização
        nextBtn.addEventListener('click', () => {
            renderizarMainAtividades(paginaAtual + 1)
            window.scrollTo(0, 0); // Opcional: Rola para o topo da página ao mudar
        });
        container.appendChild(nextBtn);
    }
}


// ----------------------------------------------------------------------
// 5. RENDERIZAÇÃO DA PÁGINA DE GERENCIAMENTO (FORM + LISTA DO USUÁRIO)
// ----------------------------------------------------------------------

async function renderizarMainGerenciamento() {
    if (!usuarioLogado) {
        // Se deslogado, volta para a home
        return renderizarMainAtividades(1); 
    }
    
    if (!mainContent) return;

    // 💥 INJETA A ESTRUTURA DO FORMULÁRIO E LISTA - REQUISITO 2 e 3 💥
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

    // RE-LIGA O LISTENER DO BOTÃO DE SAIR (agora recriado)
    configurarLogin();
    
    // Liga o formulário ao manipulador de eventos
    const atividadeForm = document.getElementById('atividade-form');
    if (atividadeForm) {
        atividadeForm.addEventListener('submit', handleRegistroAtividade);
    }
    
    // Carrega a lista do usuário
    carregarMinhasAtividades(); 
}

async function carregarMinhasAtividades() {
    const listaDiv = document.getElementById('minhas-atividades-lista');
    if (!listaDiv || !usuarioLogado) return;
    
    const usuarioId = usuarioLogado.id;

    try {
        // Rota para buscar as atividades de um usuário específico
        const response = await fetch(`/minhas-atividades?usuarioId=${usuarioId}`);
        if (!response.ok) throw new Error('Falha ao buscar atividades pessoais.');
        
        const atividades = await response.json();
        
        if (atividades.length === 0) {
            listaDiv.innerHTML = '<p>Você ainda não registrou nenhuma atividade.</p>';
            return;
        }

        // Renderiza a lista reutilizando a função de card
        listaDiv.innerHTML = `<div class="feed-list">${atividades.map(criarCardAtividade).join('')}</div>`;

    } catch (error) {
        console.error('Erro ao carregar atividades pessoais:', error);
        listaDiv.innerHTML = '<p>Erro ao carregar sua lista de atividades. (Verifique sua rota GET /minhas-atividades).</p>';
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

        // 1. RECARREGA OS STATS: Força o re-login para pegar os totais atualizados
        // Isso assume que sua rota /login retorna os dados atualizados
        const resLogin = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: usuarioLogado.email, senha: usuarioLogado.senha })
        });
        
        if (resLogin.ok) {
            usuarioLogado = await resLogin.json();
            atualizarInterfaceUsuario(); // Atualiza a sidebar com novos stats
        }

        // 2. ATUALIZA A LISTA PESSOAL NA TELA ATUAL
        carregarMinhasAtividades(); 

    } catch (erro) {
        console.error(erro);
        alert('Erro ao registrar atividade. (Verifique sua rota POST /atividades).');
    }
}


// ----------------------------------------------------------------------
// 6. FUNÇÕES AUXILIARES (UTILITY)
// ----------------------------------------------------------------------

// Função extraída para criar um card HTML
function criarCardAtividade(atividade) {
    // 6.2. Os valores de distância deverão ser convertidos para km.
    const distKM = (atividade.distancia_percorrida / 1000).toFixed(2);
    // 6.3. Os valores de duração da atividade deverão ser convertidos para horas.
    const duracaoFormatada = formatarDuracao(atividade.duracao_atividade);
    const dataFormatada = formatarData(atividade.createdAt || atividade.createdat); 
    
    // Lógica para obter dados do autor (adaptada para a estrutura do seu backend)
    // Se o backend fizer JOIN, 'usuario_id' será um objeto. Se não, terá que ser buscado.
    const autor = atividade.usuario_id;
    const nomeUsuario = autor && autor.nome_usuario ? autor.nome_usuario : (atividade.nome_usuario_rel || 'Desconhecido');
    const imagemUsuario = autor && autor.imagem ? autor.imagem : (atividade.imagem_rel || 'SAEPSaude.png'); 
    
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
                <button class="icon-button"><img src="./images/coracao.svg" alt="Like"></button>
                <button class="icon-button"><img src="./images/comentario.svg" alt="Comentar"></button>
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