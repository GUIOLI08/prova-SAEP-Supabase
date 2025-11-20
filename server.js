import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Certifique-se que este arquivo exporta o client inicializado com a SERVICE ROLE KEY
import supabase from './supabaseClient.js'; 

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware padrão
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------------
// ROTA PRINCIPAL (Serve o HTML)
// ----------------------------------------------------------------------
app.get('/', (req, res) => {
    console.log('➡️\t Entrando na rota principal');
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ----------------------------------------------------------------------
// 🚀 ROTA DE ATIVIDADES (COM FILTROS E OTIMIZADA)
// ----------------------------------------------------------------------
app.get('/atividades', async (req, res) => {
    const pagina = parseInt(req.query.pagina) || 1;
    // 🚨 NOVO: Captura o tipo do filtro da URL (ex: ?tipo=corrida)
    const filtroTipo = req.query.tipo; 

    const itensPorPagina = 4;
    const from = (pagina - 1) * itensPorPagina;
    const to = from + itensPorPagina - 1;

    console.log(`➡️\t Buscando atividades (Pág ${pagina} | Filtro: ${filtroTipo || 'Todos'})`);

    try {
        // 1. INICIA A QUERY BÁSICA
        let query = supabase
            .from('atividades')
            .select(`
                *,
                usuario:usuario_id ( nome_usuario, imagem ),
                likes ( usuario_id ),
                comments ( id )
            `, { count: 'exact' });

        // 2. APLICA O FILTRO SE ELE EXISTIR
        // Só aplica se for um dos tipos válidos do banco
        if (filtroTipo && ['corrida', 'caminhada', 'trilha'].includes(filtroTipo)) {
            query = query.eq('tipo_atividade', filtroTipo);
        }

        // 3. FINALIZA A QUERY (ORDENAÇÃO E PAGINAÇÃO)
        const { data, count, error } = await query
            .order('createdat', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('❌ Erro Supabase:', error);
            return res.status(500).send(error);
        }

        // 4. FORMATA OS DADOS (Igual antes)
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

// ----------------------------------------------------------------------
// REGISTRO DE ATIVIDADE
// ----------------------------------------------------------------------
app.post('/atividades', async (req, res) => {
    const { tipo_atividade, distancia_percorrida, duracao_atividade, quantidade_calorias, usuario_id } = req.body;

    console.log(`➡️\t Nova atividade do usuário: ${usuario_id}`);

    const novaAtividade = {
        tipo_atividade,
        distancia_percorrida: parseInt(distancia_percorrida),
        duracao_atividade: parseInt(duracao_atividade),
        quantidade_calorias: parseInt(quantidade_calorias),
        usuario_id: parseInt(usuario_id)
    };

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

// ----------------------------------------------------------------------
// LOGIN
// ----------------------------------------------------------------------
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;
    console.log(`➡️\t Login: ${email}`);

    // 1. Verifica credenciais
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();

    if (error || !usuario) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    // 2. Busca estatísticas (Contagem rápida)
    const { count: totalAtividades } = await supabase
        .from('atividades')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuario.id);

    // 3. Soma de calorias (precisa de query simples)
    const { data: caloriasData } = await supabase
        .from('atividades')
        .select('quantidade_calorias')
        .eq('usuario_id', usuario.id);
        
    const totalCalorias = caloriasData 
        ? caloriasData.reduce((acc, curr) => acc + curr.quantidade_calorias, 0) 
        : 0;

    res.status(200).json({
        ...usuario,
        stats: {
            totalAtividades: totalAtividades || 0,
            totalCalorias: totalCalorias
        }
    });
});

// ----------------------------------------------------------------------
// 🚀 ROTA MINHAS ATIVIDADES (OTIMIZADA)
// ----------------------------------------------------------------------
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
            .eq('usuario_id', usuarioId)
            .order('createdat', { ascending: false });

        if (error) return res.status(500).send(error);

        const atividadesFormatadas = data.map(item => {
            const likesArray = item.likes || [];
            const commentsArray = item.comments || [];

            return {
                ...item,
                usuario_id: item.usuario, // Ajusta estrutura para o frontend
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

// ----------------------------------------------------------------------
// TOGGLE LIKE (ADICIONAR / REMOVER)
// ----------------------------------------------------------------------
app.post('/atividades/:id/like', async (req, res) => {
    const atividadeId = req.params.id;
    const { usuarioId } = req.body;

    if (!usuarioId) return res.status(400).json({ erro: "ID do usuário obrigatório" });

    try {
        // Tenta deletar direto. Se retornar dado, é porque existia e deletou.
        const { data: deleted, error: deleteError } = await supabase
            .from('likes')
            .delete()
            .eq('usuario_id', usuarioId)
            .eq('atividade_id', atividadeId)
            .select();

        if (deleteError) throw deleteError;

        if (deleted && deleted.length > 0) {
            // Se deletou algo, retorna que removeu
            return res.status(200).json({ acao: 'removido' });
        } else {
            // Se não deletou nada, é porque não existia, então INSERE
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

// Rota Auxiliar de Likes (caso precise atualizar contador via fetch isolado)
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

// ----------------------------------------------------------------------
// COMENTÁRIOS (ADICIONAR E LISTAR)
// ----------------------------------------------------------------------
app.post('/atividades/:id/comentarios', async (req, res) => {
    const { usuarioId, conteudo } = req.body;

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

// Rota de teste
app.get('/testar-db', async (req, res) => {
    const { data, error } = await supabase.from('usuarios').select('*').limit(1);
    return error ? res.status(500).send(error) : res.status(200).send(data);
});

app.listen(PORT, () => {
    console.log(`🔥 Server VOANDO na porta ${PORT}`);
});