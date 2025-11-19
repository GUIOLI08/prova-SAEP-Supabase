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
    console.log('➡️\tEntrando na rota principal');
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