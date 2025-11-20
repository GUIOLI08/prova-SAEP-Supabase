import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = 'https://[url-do-banco].supabase.co';
// ALTERAR A URL ACIMA PARA A DO SEU BANCO DE DADOS
const SUPABASE_KEY = 'chave-service-key-do-banco';
// ALTERAR A CHAVE ACIMA PARA A DO SEU BANCO DE DADOS 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;