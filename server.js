import express from 'express';
import path from 'path'
import { fileURLToPath } from 'url';
import supabase from './supabaseClient.js'
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

app.get('/atividades', async (req, res) => {
    
    console.log("➡️\t Buscando atividades e colocando em páginas");

    const itensPorPagina = 4;
    const pagina = parseInt(req.query.pagina) || 1;
    const inicio = (pagina - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina - 1;

    const { data: atividades, error: errorDados } = await supabase
        .from('atividades')
        .select(`
            *,
            usuario_id ( nome_usuario, imagem )
        `)
        .order('createdat', { ascending: false })
        .range(inicio, fim);

    const { count, error: errorCount } = await supabase
        .from('atividades')
        .select('id', { count: 'exact', head: true }); 

    if (errorDados) {
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
});

app.post('/atividades', async (req, res) => {
    // Dados esperados do frontend
    const { tipo_atividade, distancia_percorrida, duracao_atividade, quantidade_calorias, usuario_id } = req.body;

    console.log(`➡️\t Tentativa de registro de nova atividade para o usuário ${usuario_id}`);
    
    // Objeto de dados para inserção, garantindo a conversão para inteiro
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
        .insert([novaAtividade]); // Supabase espera um array para inserção

    if (error) {
        console.error('❌ Erro ao registrar atividade:', error);
        // Retorna 500 para indicar falha no servidor/BD
        return res.status(500).json({ erro: "Falha ao registrar atividade no banco de dados.", detalhes: error.message });
    }

    console.log(`✅ Atividade registrada com sucesso: ${tipo_atividade}`);
    // Retorna 201 Created para indicar sucesso na criação do recurso
    res.status(201).json({ mensagem: "Atividade registrada com sucesso!" });
});

app.post('/login', async (req, res) => {

    const { email, senha } = req.body;

    console.log(`Tentativa de login: ${email}`);

    // 1. Busca o usuário
    const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('senha', senha)
        .single();

    if (error || !usuario) {
        return res.status(401).json({ erro: "Email ou senha inválidos" });
    }

    // 2. Busca e calcula os stats do usuário logado
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

    // 3. Retorna os dados do usuário + stats
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
            // Certifique-se de que o campo 'createdat' ou 'createdAt' existe no seu BD e use-o
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

// ----------------------------------------------------------------------
// ROTA DE TESTE (Mantida)
// ----------------------------------------------------------------------
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