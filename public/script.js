let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarAtividades(1);
    configurarLogin();
});

function configurarLogin() {
    const modal = document.getElementById('login-modal');
    const btnLoginHeader = document.getElementById('login-button'); // Botão no topo
    const btnClose = document.getElementById('close-modal-btn');
    const form = document.getElementById('login-form');

    btnLoginHeader.addEventListener('click', () => {
        if (usuarioLogado) {
            fazerLogout();
        } else {
            modal.classList.remove('hidden');
        }
    });

    btnClose.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

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
            alert('Erro ao tentar fazer login.');
        }
    });
}

function atualizarInterfaceUsuario() {
    const btnLoginHeader = document.getElementById('login-button');
    const sidebarContainer = document.querySelector('.sidebar');

    if (usuarioLogado) {

        btnLoginHeader.innerText = "Sair";
        btnLoginHeader.style.backgroundColor = "#d9534f";

        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/${usuarioLogado.imagem}" alt="Avatar">
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

    } else {

        btnLoginHeader.innerText = "Login";
        btnLoginHeader.style.backgroundColor = "#483DAD";

        sidebarContainer.innerHTML = `
            <div class="profile-card">
                <img src="./images/SAEPSaude.png" alt="Avatar do Usuário">
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
    }
}

function fazerLogout() {
    usuarioLogado = null;
    atualizarInterfaceUsuario();
    alert("Você saiu da conta.");
}

async function carregarAtividades(pagina) {

    const container = document.getElementById('activity-list');
    container.innerHTML = '<p>Carregando atividades...</p>';

    try {

        const response = await fetch(`/atividades?pagina=${pagina}`);

        if (!response.ok) {
            throw new Error('Falha ao buscar dados do servidor.');
        }

        const data = await response.json();
        const atividades = data.atividades;
        const totalPaginas = data.totalPaginas;

        container.innerHTML = '';

        for (const atividade of atividades) {
            const distKM = atividade.distancia_percorrida / 1000;
            const duracaoFormatada = formatarDuracao(atividade.duracao_atividade);
            const dataFormatada = formatarData(atividade.createdat);
            const autor = atividade.usuario_id;

            const cardHTML = `
                <article class="activity-card">
                    <div class="card-header">
                        <div class="user-info">
                            <img src="./images/${autor.imagem}" alt="Avatar">
                            <span>@${autor.nome_usuario}</span>
                        </div>
                        <span class="card-date">${dataFormatada}</span>
                    </div>
                    <h4>${atividade.tipo_atividade}</h4>
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
            container.innerHTML += cardHTML;
        }

        renderizarPaginacao(totalPaginas, pagina);

    } catch (error) {
        console.error("Erro no front-end:", error);
        container.innerHTML = '<p>Erro ao carregar atividades. Tente novamente.</p>';
    }
}

function renderizarPaginacao(totalPaginas, paginaAtual) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';

    const btnAnterior = document.createElement('button');
    btnAnterior.innerText = 'Anterior';

    btnAnterior.disabled = (paginaAtual === 1);

    btnAnterior.addEventListener('click', () => {

        if (paginaAtual > 1) {
            carregarAtividades(paginaAtual - 1);
        }
    });
    container.appendChild(btnAnterior);

    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('button');
        btnPagina.innerText = i;

        if (i === paginaAtual) {
            btnPagina.classList.add('active');
        }

        btnPagina.dataset.pagina = i;

        btnPagina.addEventListener('click', (evento) => {
            const paginaClicada = parseInt(evento.currentTarget.dataset.pagina);
            carregarAtividades(paginaClicada);
        });
        container.appendChild(btnPagina);
    }

    const btnProximo = document.createElement('button');
    btnProximo.innerText = 'Próximo';

    btnProximo.disabled = (paginaAtual >= totalPaginas);

    btnProximo.addEventListener('click', () => {

        if (paginaAtual < totalPaginas) {
            carregarAtividades(paginaAtual + 1);
        }
    });
    container.appendChild(btnProximo);
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

    const data = new Date(isoString);

    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}