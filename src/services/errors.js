const KNOWN_PATTERNS = [
  {
    test: /row-level security policy for table "estoque"/i,
    message: 'O Supabase bloqueou a criação do saldo inicial deste produto. Execute o arquivo supabase/20260718_corrigir_rls_estoque.sql no SQL Editor.',
  },
  {
    test: /row-level security policy/i,
    message: 'Permissão negada pelo Supabase para esta ação. Verifique as políticas de acesso (RLS) da tabela.',
  },
  {
    test: /duplicate key value violates unique constraint/i,
    message: 'Já existe um registro com esse mesmo valor cadastrado.',
  },
  {
    test: /violates foreign key constraint/i,
    message: 'Não foi possível concluir: este registro está vinculado a outro cadastro (produto, cliente ou venda).',
  },
  {
    test: /Failed to fetch|NetworkError|ERR_INTERNET|ERR_NAME_NOT_RESOLVED/i,
    message: 'Não foi possível conectar ao banco de dados. Verifique sua internet e tente novamente.',
  },
  {
    test: /JWT|invalid api key/i,
    message: 'Credenciais do Supabase inválidas. Verifique as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.',
  },
]

const mentionsProduct = message => /produto/i.test(message)

function withProductNames(message, products) {
  if (!products.length) return message
  const nameById = new Map(products.map(product => [String(product.id), product.nome]))
  return message.replace(/\b\d+\b/g, token => (nameById.has(token) ? `"${nameById.get(token)}" (produto #${token})` : token))
}

// Traduz erros crus do Supabase/Postgres para mensagens legiveis e troca
// referencias a produto_id pelo nome do produto quando possivel, ja que o
// banco so retorna o id numerico nas mensagens de erro.
export function humanizeError(error, products = []) {
  const raw = error?.message ?? String(error ?? 'Erro desconhecido.')
  const known = KNOWN_PATTERNS.find(pattern => pattern.test.test(raw))
  if (known) return known.message
  return mentionsProduct(raw) ? withProductNames(raw, products) : raw
}
