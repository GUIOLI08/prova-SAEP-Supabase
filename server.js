// ==================================================================
// PASSO 1: IMPORTANDO AS FERRAMENTAS NECESSÁRIAS
// ==================================================================
// Aqui trazemos bibliotecas externas para o código funcionar:
// - express: Cria o servidor web.
// - path/url: Ajudam a navegar nas pastas do computador.
// - supabase: Nossa conexão com o Banco de Dados.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabaseClient.js'; 

// ==================================================================
// PASSO 2: CONFIGURANDO O SERVIDOR
// ==================================================================
const app = express(); // Cria a aplicação
const PORT = 3000;     // Define a porta (endereço) onde vai rodar

// Configuração para lidar com arquivos e pastas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// "Middlewares" (Configurações padrão):
// Ensina o servidor a ler dados enviados em formato JSON (muito importante!)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diz ao servidor onde estão os arquivos do Front-end (HTML, CSS, Imagens)
// para que ele possa mostrá-los no navegador.
app.use(express.static(path.join(__dirname, 'public')));

// ==================================================================
// PASSO 3: ROTA PRINCIPAL (A "PORTA DE ENTRADA")
// ==================================================================
// Quando alguém acessa "http://localhost:3000/", o servidor envia o arquivo index.html.
app.get('/', (req, res) => {
    console.log('➡️\t Entrando na rota principal');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================================================================
// PASSO 4: O FEED DE ATIVIDADES (COM FILTRO E PAGINAÇÃO)
// ==================================================================
// Rota: GET /atividades
// O que faz: Busca as atividades no banco para mostrar no feed geral.
app.get('/atividades', async (req, res) => {
    // Pega o número da página e o filtro (ex: corrida) que vieram do Front-end
    const pagina = parseInt(req.query.pagina) || 1;
    const filtroTipo = req.query.tipo; 

    // Define que mostraremos apenas 4 atividades por vez
    const itensPorPagina = 4;
    const from = (pagina - 1) * itensPorPagina;
    const to = from + itensPorPagina - 1;

    console.log(`➡️\t Buscando atividades (Pág ${pagina} | Filtro: ${filtroTipo || 'Todos'})`);

    try {
        // Prepara a busca no banco, pedindo também os dados do usuário (nome, foto), likes e comentários
        let query = supabase
            .from('atividades')
            .select(`
                *,
                usuario:usuario_id ( nome_usuario, imagem ),
                likes ( usuario_id ),
                comments ( id )
            `, { count: 'exact' });

        // Se tiver filtro, aplica (ex: busca só "corrida")
        if (filtroTipo && ['corrida', 'caminhada', 'trilha'].includes(filtroTipo)) {
            query = query.eq('tipo_atividade', filtroTipo);
        }

        // Executa a busca ordenando do mais recente para o mais antigo
        const { data, count, error } = await query
            .order('createdat', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('❌ Erro Supabase:', error);
            return res.status(500).send(error);
        }

        // Formata os dados para facilitar o uso no Front-end (calcula total de likes, etc)
        const atividadesFormatadas = data.map(item => {
            const likesArray = item.likes || [];
            const commentsArray = item.comments || [];
            
            return {
                ...item,
                usuario_id: item.usuario || { nome_usuario: 'Desconhecido', imagem: 'SAEPSaude.png' },
                usuariosQueCurtiram: likesArray.map(l => l.usuario_id),
                totalLikes: likesArray.length,
                totalComentarios: commentsArray.length,
                comentarios: [] 
            };
        });

        // Calcula quantas páginas existem no total e envia a resposta
        const totalPaginas = Math.ceil(count / itensPorPagina);

        res.status(200).send({
            atividades: atividadesFormatadas,
            totalPaginas: totalPaginas
        });

    } catch (e) {
        console.error('Erro CRÍTICO no servidor:', e);
        res.status(500).send({ message: 'Erro interno ao buscar atividades.' });
    }
});

// ==================================================================
// PASSO 5: REGISTRAR UMA NOVA ATIVIDADE
// ==================================================================
// Rota: POST /atividades
// O que faz: Recebe os dados do formulário e salva no banco.
app.post('/atividades', async (req, res) => {
    // Recebe os dados enviados pelo usuário
    const { tipo_atividade, distancia_percorrida, duracao_atividade, quantidade_calorias, usuario_id } = req.body;

    console.log(`➡️\t Nova atividade do usuário: ${usuario_id}`);

    // Cria o objeto certinho para o banco
    const novaAtividade = {
        tipo_atividade,
        distancia_percorrida: parseInt(distancia_percorrida),
        duracao_atividade: parseInt(duracao_atividade),
        quantidade_calorias: parseInt(quantidade_calorias),
        usuario_id: parseInt(usuario_id)
    };

    // Insere no Supabase
    const { error } = await supabase
        .from('atividades')
        .insert([novaAtividade]);

    if (error) {
        console.error('❌ Erro ao registrar:', error);
        return res.status(500).json({ erro: "Falha ao registrar.", detalhes: error.message });
    }

    console.log(`✅ Atividade registrada!`);
    res.status(201).json({ mensagem: "Atividade registrada com sucesso!" });
});

// ==================================================================
// PASSO 6: SISTEMA DE LOGIN
// ==================================================================
// Rota: POST /login
// O que faz: Verifica email/senha e calcula as estatísticas do usuário.
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    console.log(`➡️\t Login: ${email}`);

    // 1. Verifica se o usuário existe com esse email e senha
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();

    if (error || !usuario) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    // 2. Conta quantas atividades esse usuário já fez
    const { count: totalAtividades } = await supabase
        .from('atividades')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

    // 3. Soma todas as calorias que ele já gastou
    const { data: caloriasData } = await supabase
        .from('atividades')
        .select('quantidade_calorias')
        .eq('usuario_id', usuario.id);
        
    const totalCalorias = caloriasData 
        ? caloriasData.reduce((acc, curr) => acc + curr.quantidade_calorias, 0) 
        : 0;

    // Retorna os dados do usuário + as estatísticas calculadas
    res.status(200).json({
        ...usuario,
        stats: {
            totalAtividades: totalAtividades || 0,
            totalCalorias: totalCalorias
        }
    });
});

// ==================================================================
// PASSO 7: PERFIL DO USUÁRIO ("MINHAS ATIVIDADES")
// ==================================================================
// Rota: GET /minhas-atividades
// O que faz: Busca apenas as atividades de um usuário específico.
app.get('/minhas-atividades', async (req, res) => {
    const usuarioId = req.query.usuarioId;

    if (!usuarioId) return res.status(400).send({ erro: "ID do usuário é obrigatório." });

    try {
        const { data, error } = await supabase
            .from('atividades')
            .select(`
                *,
                usuario:usuario_id ( nome_usuario, imagem ),
                likes ( usuario_id ),
                comments ( id )
            `)
            .eq('usuario_id', usuarioId) // Aqui está o filtro principal: SÓ DESTE USUÁRIO
            .order('createdat', { ascending: false });

        if (error) return res.status(500).send(error);

        // Formatação dos dados (igual ao feed principal)
        const atividadesFormatadas = data.map(item => {
            const likesArray = item.likes || [];
            const commentsArray = item.comments || [];

            return {
                ...item,
                usuario_id: item.usuario,
                usuariosQueCurtiram: likesArray.map(l => l.usuario_id),
                totalLikes: likesArray.length,
                totalComentarios: commentsArray.length,
                comentarios: []
            };
        });

        res.status(200).json(atividadesFormatadas);

    } catch (e) {
        console.error('Erro servidor:', e);
        res.status(500).send({ erro: 'Erro interno do servidor.' });
    }
});

// ==================================================================
// PASSO 8: INTERAÇÕES SOCIAIS (LIKES E COMENTÁRIOS)
// ==================================================================

// --- Funcionalidade de Like ---
// Se já curtiu, remove o like. Se não curtiu, adiciona o like.
app.post('/atividades/:id/like', async (req, res) => {
    const atividadeId = req.params.id;
    const { usuarioId } = req.body;

    if (!usuarioId) return res.status(400).json({ erro: "ID do usuário obrigatório" });

    try {
        // Tenta deletar o like existente
        const { data: deleted, error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('usuario_id', usuarioId)
            .eq('atividade_id', atividadeId)
            .select();

        if (deleteError) throw deleteError;

        // Se deletou algo, avisa que removeu. Se não, insere um novo like.
        if (deleted && deleted.length > 0) {
            return res.status(200).json({ acao: 'removido' });
        } else {
            const { error: insertError } = await supabase
                .from('likes')
                .insert([{ usuario_id: usuarioId, atividade_id: atividadeId }]);
            
            if (insertError) throw insertError;
            
            return res.status(201).json({ acao: 'adicionado' });
        }
    } catch (e) {
        console.error('Erro Like:', e);
        res.status(500).json({ erro: 'Erro interno no like' });
    }
});

// (Rota auxiliar apenas para conferir likes)
app.get('/atividades/:id/likes', async (req, res) => {
    try {
        const { data } = await supabase
            .from('likes')
            .select('usuario_id')
            .eq('atividade_id', req.params.id);

        res.status(200).json({
            total: data ? data.length : 0,
            usuarios: data ? data.map(l => l.usuario_id) : []
        });
    } catch (e) {
        res.status(500).json({ erro: 'Erro servidor' });
    }
});

// --- Funcionalidade de Comentários ---
// Salva um comentário no banco.
app.post('/atividades/:id/comentarios', async (req, res) => {
    const { usuarioId, conteudo } = req.body;

    // Validação simples: comentário não pode ser vazio ou muito curto
    if (!usuarioId || !conteudo || conteudo.trim().length <= 2) {
        return res.status(400).json({ erro: "Comentário inválido" });
    }

    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                content: conteudo.trim(),
                usuario_id: usuarioId,
                atividade_id: req.params.id
            }])
            .select();

        if (error) throw error;

        res.status(201).json({ mensagem: "Comentário salvo", comentario: data[0] });
    } catch (e) {
        console.error(e);
        res.status(500).json({ erro: 'Erro ao comentar' });
    }
});

// Busca os comentários de uma atividade específica
app.get('/atividades/:id/comentarios', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                usuario_id ( nome_usuario, imagem )
            `)
            .eq('atividade_id', req.params.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json({
            total: data.length,
            comentarios: data
        });
    } catch (e) {
        res.status(500).json({ erro: 'Erro ao buscar comentários' });
    }
});

// Rota extra só para testar se o banco está conectado
app.get('/testar-db', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('*').limit(1);
    return error ? res.status(500).send(error) : res.status(200).send(data);
});

// ==================================================================
// PASSO 9: INICIALIZANDO
// ==================================================================
// Faz o servidor começar a ouvir as requisições na porta 3000
app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`);
});