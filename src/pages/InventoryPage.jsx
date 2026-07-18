import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { listRecords, saveRecord } from '../services/database'

const types = [
  ['entrada', 'Entrada'],
  ['saida', 'Saída'],
  ['ajuste_entrada', 'Ajuste de entrada'],
  ['ajuste_saida', 'Ajuste de saída'],
]

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [stock, setStock] = useState([])
  const [moves, setMoves] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: '', referencia: '' })

  const names = useMemo(() => Object.fromEntries(products.map(product => [product.id, product.nome])), [products])
  const load = () => {
    setLoading(true)
    setError('')
    Promise.all([
      listRecords('produtos', { orderBy: 'nome' }),
      listRecords('estoque'),
      listRecords('estoque_movimentacoes', { orderBy: 'criado_em', ascending: false }),
    ]).then(([productRows, stockRows, moveRows]) => {
      setProducts(productRows); setStock(stockRows); setMoves(moveRows)
    }).catch(err => setError(err.message)).finally(() => setLoading(false))
  }

  useEffect(load, [])

  const submit = async event => {
    event.preventDefault()
    setError('')
    try {
      await saveRecord('estoque_movimentacoes', {
        produto_id: Number(form.produto_id),
        tipo: form.tipo,
        quantidade: Number(form.quantidade),
        referencia: form.referencia || null,
      })
      setForm({ produto_id: '', tipo: 'entrada', quantidade: '', referencia: '' })
      load()
    } catch (err) { setError(err.message) }
  }

  return <section>
    <h1 className="text-2xl font-bold">Controle de estoque</h1>
    <p className="mt-1 text-slate-600">Registre entradas, saídas e ajustes. Vendas reduzem o saldo automaticamente.</p>
    {error && <p className="mt-5 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}

    <form onSubmit={submit} className="mt-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
      <label className="grid gap-1 text-sm font-medium md:col-span-2">Produto
        <select required value={form.produto_id} onChange={e => setForm({ ...form, produto_id: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
          <option value="">Selecione</option>{products.map(product => <option key={product.id} value={product.id}>{product.nome}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Movimentação
        <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2">
          {types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-medium">Quantidade
        <input required min="1" type="number" value={form.quantidade} onChange={e => setForm({ ...form, quantidade: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-1 text-sm font-medium md:col-span-3">Referência / observação
        <input value={form.referencia} onChange={e => setForm({ ...form, referencia: e.target.value })} placeholder="Ex.: compra do fornecedor" className="rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <div className="flex items-end"><button className="flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white"><Plus size={18}/>Registrar</button></div>
    </form>

    <h2 className="mt-8 text-lg font-bold">Saldo atual</h2>
    <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Produto</th><th className="p-4">Quantidade disponível</th></tr></thead><tbody>{loading ? <tr><td className="p-4" colSpan="2">Carregando...</td></tr> : stock.map(row => <tr key={row.produto_id} className="border-t border-slate-100"><td className="p-4">{names[row.produto_id] ?? `Produto #${row.produto_id}`}</td><td className="p-4 font-medium">{row.quantidade}</td></tr>)}</tbody></table></div>

    <h2 className="mt-8 text-lg font-bold">Últimas movimentações</h2>
    <div className="mt-3 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="p-4">Produto</th><th className="p-4">Tipo</th><th className="p-4">Quantidade</th><th className="p-4">Referência</th></tr></thead><tbody>{moves.length ? moves.slice(0, 20).map(move => <tr key={move.id} className="border-t border-slate-100"><td className="p-4">{names[move.produto_id] ?? `Produto #${move.produto_id}`}</td><td className="p-4 capitalize">{move.tipo.replace('_', ' ')}</td><td className="p-4">{move.quantidade}</td><td className="p-4">{move.referencia ?? '—'}</td></tr>) : <tr><td className="p-4 text-slate-500" colSpan="4">Nenhuma movimentação registrada.</td></tr>}</tbody></table></div>
  </section>
}
