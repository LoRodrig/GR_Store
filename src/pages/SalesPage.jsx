import { useEffect, useMemo, useState } from 'react'
import { Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { listRecords } from '../services/database'
import { requireSupabase } from '../services/supabase'
import { humanizeError } from '../services/errors'

const currency = value => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function SalesPage() {
  const [data, setData] = useState({ clientes: [], vendedores: [], produtos: [], estoque: [] })
  const [client, setClient] = useState('')
  const [seller, setSeller] = useState('')
  const [items, setItems] = useState([])
  const [product, setProduct] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all(['clientes', 'vendedores', 'produtos', 'estoque'].map(table => listRecords(table)))
      .then(([clientes, vendedores, produtos, estoque]) => setData({ clientes, vendedores, produtos, estoque }))
      .catch(e => setError(humanizeError(e)))
  }, [])

  const stockByProduct = useMemo(() => Object.fromEntries(data.estoque.map(row => [row.produto_id, row.quantidade])), [data.estoque])
  const availableFor = id => stockByProduct[id] ?? 0
  const reservedElsewhere = (id, index) => items.reduce((sum, item, i) => (i !== index && item.id === id ? sum + item.quantidade : sum), 0)
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantidade * Number(item.preco), 0), [items])

  const addItem = () => {
    const selected = data.produtos.find(p => String(p.id) === product)
    if (!selected) return
    const available = availableFor(selected.id) - reservedElsewhere(selected.id, -1)
    if (available < 1) {
      setError(`Estoque insuficiente para "${selected.nome}": ${Math.max(available, 0)} unidade(s) disponível(is).`)
      return
    }
    setError('')
    setItems([...items, { ...selected, quantidade: 1 }])
    setProduct('')
  }

  const updateQuantity = (index, requested) => {
    const item = items[index]
    const available = availableFor(item.id) - reservedElsewhere(item.id, index)
    if (requested > available) {
      setError(`Estoque insuficiente para "${item.nome}": apenas ${Math.max(available, 0)} unidade(s) disponível(is).`)
      requested = Math.max(1, available)
    } else {
      setError('')
    }
    setItems(items.map((x, i) => (i === index ? { ...x, quantidade: requested } : x)))
  }

  const removeItem = index => setItems(items.filter((_, i) => i !== index))

  const save = async () => {
    setError('')
    setDone('')
    const shortages = items
      .map(item => ({ item, requested: items.filter(i => i.id === item.id).reduce((sum, i) => sum + i.quantidade, 0), available: availableFor(item.id) }))
      .filter(entry => entry.requested > entry.available)
    if (shortages.length) {
      const [{ item, requested, available }] = shortages
      setError(`Estoque insuficiente para "${item.nome}": disponível ${available}, solicitado ${requested}.`)
      return
    }
    setSaving(true)
    try {
      const api = requireSupabase()
      const { data: sale, error: saleError } = await api.from('vendas').insert({ cliente_id: client || null, vendedor_id: seller || null, valor_total: total }).select().single()
      if (saleError) throw saleError
      const { error: itemError } = await api.from('venda_itens').insert(items.map(i => ({ venda_id: sale.id, produto_id: i.id, quantidade: i.quantidade, valor_unitario: i.preco, subtotal: i.quantidade * i.preco })))
      if (itemError) throw itemError
      setItems([])
      setClient('')
      setSeller('')
      setDone('Venda registrada com sucesso.')
    } catch (e) {
      setError(humanizeError(e, data.produtos))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-600"><ShoppingBag size={22} /></span>
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b1d]">Nova venda</h1>
          <p className="mt-0.5 text-slate-600">Adicione os itens e confirme o pedido.</p>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}
      {done && <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-700">{done}</p>}

      <div className="mt-6 grid gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
        <Select label="Cliente" value={client} onChange={setClient} options={data.clientes} placeholder="Cliente avulso" />
        <Select label="Vendedor" value={seller} onChange={setSeller} options={data.vendedores} placeholder="Sem vendedor" />
        <div className="md:col-span-2">
          <label className="grid gap-1 text-sm font-medium">
            Produto
            <select value={product} onChange={e => setProduct(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
              <option value="">Selecione</option>
              {data.produtos.map(item => {
                const stock = availableFor(item.id)
                return (
                  <option key={item.id} value={item.id} disabled={stock < 1}>
                    {item.nome} — {stock > 0 ? `${stock} em estoque` : 'sem estoque'}
                  </option>
                )
              })}
            </select>
          </label>
          <button onClick={addItem} disabled={!product} className="mt-2 flex items-center gap-2 rounded-lg border border-brand-500 px-3 py-2 text-brand-500 disabled:cursor-not-allowed disabled:opacity-40">
            <Plus size={16} /> Adicionar item
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        {items.length === 0 && <p className="py-6 text-center text-slate-500">Nenhum item adicionado ainda.</p>}
        {items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
            <span className="flex-1 font-medium text-[#1b1b1d]">{item.nome}</span>
            <input
              type="number"
              min="1"
              max={availableFor(item.id)}
              value={item.quantidade}
              onChange={e => updateQuantity(index, Number(e.target.value))}
              className="w-16 rounded border border-slate-300 p-1 text-center"
            />
            <span className="w-28 text-right text-slate-700">{currency(item.quantidade * item.preco)}</span>
            <button onClick={() => removeItem(index)} className="text-slate-400 hover:text-red-600" aria-label={`Remover ${item.nome}`}>
              <Trash2 size={17} />
            </button>
          </div>
        ))}
        <div className="mt-4 flex items-center justify-between text-lg font-bold text-[#1b1b1d]">
          <span>Total</span>
          <span>{currency(total)}</span>
        </div>
        <button disabled={!items.length || saving} onClick={save} className="mt-5 rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white hover:bg-brand-600 disabled:opacity-50">
          {saving ? 'Salvando...' : 'Finalizar venda'}
        </button>
      </div>
    </section>
  )
}

function Select({ label, value, onChange, options, placeholder = 'Selecione' }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select value={value} onChange={e => onChange(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>{option.nome}</option>
        ))}
      </select>
    </label>
  )
}
