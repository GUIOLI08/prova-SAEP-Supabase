document.addEventListener('DOMContentLoaded', () => {
    carregarAtividades(1);
});

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