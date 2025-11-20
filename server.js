import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url';
import supabase from './supabaseClient.js' // Assume que este arquivo inicializa e exporta o cliente
const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    console.log('➡️\t Entrando na rota principal');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 🔄 ROTA ATUALIZADA: Agora usa RPC para buscar atividades com dados de like
app.get('/atividades', async (req, res) => {

    console.log("➡️\t Buscando atividades e colocando em páginas (Usando RPC)");

    const itensPorPagina = 4;
    const pagina = parseInt(req.query.pagina) || 1;
    // 🚨 NOVO: ID do usuário é capturado para checagem de like (passamos 0 se deslogado)
    const usuarioId = parseInt(req.query.usuarioId) || 0;
    const offset = (pagina - 1) * itensPorPagina;

    try {
        // 1. CHAMA A FUNÇÃO RPC do Supabase para buscar todas as informações
        const { data: atividades, error: errorDados } = await supabase.rpc('get_feed_atividades', {
            p_user_id: usuarioId,
            p_page_size: itensPorPagina,
            p_offset: offset
        });

        // 2. Conta o total de atividades (para a paginação)
        const { count, error: errorCount } = await supabase
            .from('atividades')
            .select('id', { count: 'exact', head: true });

        if (errorDados) {
            console.error('❌ Erro RPC:', errorDados);
            return res.status(500).send(errorDados);
        }
        if (errorCount) {
            return res.status(500).send(errorCount);
        }

        if (count === null) {
            return res.status(500).send({ message: "Count nulo" });
        }

        console.log(`Count total encontrado: ${count}`);

        const totalPaginas = Math.ceil(count / itensPorPagina);

        res.status(200).send({
            atividades: atividades,
            totalPaginas: totalPaginas
        });
    } catch (e) {
        console.error('Erro na rota GET /atividades:', e.message);
        res.status(500).send({ message: 'Erro interno ao buscar atividades.' });
    }
});

app.post('/atividades', async (req, res) => {
    const { tipo_atividade, distancia_percorrida, duracao_atividade, quantidade_calorias, usuario_id } = req.body;

    console.log(`➡️\t Tentativa de registro de nova atividade para o usuário ${usuario_id}`);

    const novaAtividade = {
        tipo_atividade,
        distancia_percorrida: parseInt(distancia_percorrida),
        duracao_atividade: parseInt(duracao_atividade),
        quantidade_calorias: parseInt(quantidade_calorias),
        usuario_id: parseInt(usuario_id)
    };

    // Inserir no Supabase
    const { data, error } = await supabase
        .from('atividades')
        .insert([novaAtividade]);

    if (error) {
        console.error('❌ Erro ao registrar atividade:', error);
        return res.status(500).json({ erro: "Falha ao registrar atividade no banco de dados.", detalhes: error.message });
    }

    console.log(`✅ Atividade registrada com sucesso: ${tipo_atividade}`);
    // Retorna 201 Created para indicar sucesso na criação do recurso
    res.status(201).json({ mensagem: "Atividade registrada com sucesso!" });
});

app.post('/login', async (req, res) => {

    const { email, senha } = req.body;

    console.log(`Tentativa de login: ${email}`);

    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();

    if (error || !usuario) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    const { data: atividades } = await supabase
        .from('atividades')
        .select('quantidade_calorias')
        .eq('usuario_id', usuario.id);

    let totalAtividades = 0;
    let totalCalorias = 0;

    if (atividades) {
        totalAtividades = atividades.length;
        totalCalorias = atividades.reduce((acc, curr) => acc + curr.quantidade_calorias, 0);
    }

    res.status(200).json({
        ...usuario,
        stats: {
            totalAtividades,
            totalCalorias
        }
    });
});

app.get('/minhas-atividades', async (req, res) => {
    const usuarioId = req.query.usuarioId;

    if (!usuarioId) {
        return res.status(400).send({ erro: "ID do usuário é obrigatório." });
    }

    try {

        const { data: atividades, error } = await supabase
            .from('atividades')
            .select(`
                *,
                usuario_id ( nome_usuario, imagem )
            `)
            .eq('usuario_id', usuarioId)
            .order('createdat', { ascending: false });

        if (error) {
            console.error('Erro ao buscar atividades do usuário:', error.message);
            return res.status(500).send(error);
        }

        res.status(200).json(atividades);

    } catch (e) {
        console.error('Erro de servidor:', e);
        res.status(500).send({ erro: 'Erro interno do servidor.' });
    }
});

app.post('/atividades/:id/like', async (req, res) => {
    const atividadeId = req.params.id;
    const { usuarioId } = req.body;

    if (!usuarioId) {
        return res.status(400).json({ erro: "ID do usuário é obrigatório" });
    }

    console.log(`➡️\t Toggle like - Atividade: ${atividadeId}, Usuário: ${usuarioId}`);

    try {
        // Verifica se o like já existe
        const { data: likeExistente, error: errorCheck } = await supabase
            .from('likes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .eq('atividade_id', atividadeId)
            .single();

        if (errorCheck && errorCheck.code !== 'PGRST116') { // PGRST116 = não encontrado
            console.error('Erro ao verificar like:', errorCheck);
            return res.status(500).json({ erro: "Erro ao verificar like" });
        }

        if (likeExistente) {
            // Remove o like
            const { error: errorDelete } = await supabase
                .from('likes')
                .delete()
                .eq('usuario_id', usuarioId)
                .eq('atividade_id', atividadeId);

            if (errorDelete) {
                console.error('Erro ao remover like:', errorDelete);
                return res.status(500).json({ erro: "Erro ao remover like" });
            }

            console.log(`✅ Like removido`);
            return res.status(200).json({ acao: 'removido' });
        } else {
            // Adiciona o like
            const { error: errorInsert } = await supabase
                .from('likes')
                .insert([{ usuario_id: usuarioId, atividade_id: atividadeId }]);

            if (errorInsert) {
                console.error('Erro ao adicionar like:', errorInsert);
                return res.status(500).json({ erro: "Erro ao adicionar like" });
            }

            console.log(`✅ Like adicionado`);
            return res.status(201).json({ acao: 'adicionado' });
        }
    } catch (e) {
        console.error('Erro no servidor:', e);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

// ROTA: Buscar likes de uma atividade
app.get('/atividades/:id/likes', async (req, res) => {
    const atividadeId = req.params.id;

    try {
        const { data: likes, error } = await supabase
            .from('likes')
            .select('usuario_id')
            .eq('atividade_id', atividadeId);

        if (error) {
            console.error('Erro ao buscar likes:', error);
            return res.status(500).json({ erro: "Erro ao buscar likes" });
        }

        res.status(200).json({
            total: likes.length,
            usuarios: likes.map(like => like.usuario_id)
        });
    } catch (e) {
        console.error('Erro no servidor:', e);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

app.post('/atividades/:id/comentarios', async (req, res) => {
    const atividadeId = req.params.id;
    const { usuarioId, conteudo } = req.body;

    if (!usuarioId || !conteudo) {
        return res.status(400).json({ erro: "Usuário e conteúdo são obrigatórios" });
    }

    if (conteudo.trim().length <= 2) {
        return res.status(400).json({ erro: "Comentário deve ter mais de 2 caracteres" });
    }

    console.log(`➡️\t Novo comentário - Atividade: ${atividadeId}, Usuário: ${usuarioId}`);

    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([{
                content: conteudo.trim(),
                usuario_id: usuarioId,
                atividade_id: atividadeId
            }])
            .select();

        if (error) {
            console.error('Erro ao adicionar comentário:', error);
            return res.status(500).json({ erro: "Erro ao adicionar comentário" });
        }

        console.log(`✅ Comentário adicionado`);
        res.status(201).json({ mensagem: "Comentário adicionado com sucesso", comentario: data[0] });
    } catch (e) {
        console.error('Erro no servidor:', e);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

app.get('/atividades/:id/comentarios', async (req, res) => {
    const atividadeId = req.params.id;

    try {
        const { data: comentarios, error } = await supabase
            .from('comments')
            .select(`
                *,
                usuario_id ( nome_usuario, imagem )
            `)
            .eq('atividade_id', atividadeId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar comentários:', error);
            return res.status(500).json({ erro: "Erro ao buscar comentários" });
        }

        res.status(200).json({
            total: comentarios.length,
            comentarios: comentarios
        });
    } catch (e) {
        console.error('Erro no servidor:', e);
        res.status(500).json({ erro: 'Erro interno do servidor' });
    }
});

app.get('/testar-db', async (req, res) => {

    console.log("➡️\t Testando conexão com o banco consultando a tabela 'usuarios' ...");

    let { data: usuarios, error } = await supabase
        .from('usuarios')
        .select('*')
        .limit(1);

    return error ? res.status(500).send(error) : res.status(200).send(usuarios);

});

app.listen(PORT, () => {
    console.log(`Server is running in http://localhost:${PORT}`);
});