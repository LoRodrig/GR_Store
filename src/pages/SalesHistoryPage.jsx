import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ClipboardList, Search } from 'lucide-react'
import { listRecords } from '../services/database'
import { humanizeError } from '../services/errors'

const currency = value => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const formatDate = value => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [items, setItems] = useState([])
  const [clientes, setClientes] = useState([])
  const [vendedores, setVendedores] = useState([])
  const [produtos, setProdutos] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      listRecords('vendas', { orderBy: 'id', ascending: false }),
      listRecords('venda_itens'),
      listRecords('clientes'),
      listRecords('vendedores'),
      listRecords('produtos'),
    ]).then(([salesRows, itemRows, clienteRows, vendedorRows, productRows]) => {
      setSales(salesRows); setItems(itemRows); setClientes(clienteRows); setVendedores(vendedorRows); setProdutos(productRows)
    }).catch(err => setError(humanizeError(err))).finally(() => setLoading(false))
  }, [])

  const clienteNome = useMemo(() => Object.fromEntries(clientes.map(c => [c.id, c.nome])), [clientes])
  const vendedorNome = useMemo(() => Object.fromEntries(vendedores.map(v => [v.id, v.nome])), [vendedores])
  const produtoNome = useMemo(() => Object.fromEntries(produtos.map(p => [p.id, p.nome])), [produtos])
  const itemsBySale = useMemo(() => items.reduce((acc, item) => {
    (acc[item.venda_id] ??= []).push(item)
    return acc
  }, {}), [items])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return sales
    return sales.filter(sale => {
      const cliente = (clienteNome[sale.cliente_id] ?? 'cliente avulso').toLowerCase()
      const vendedor = (vendedorNome[sale.vendedor_id] ?? '').toLowerCase()
      return cliente.includes(term) || vendedor.includes(term)
    })
  }, [sales, search, clienteNome, vendedorNome])

  const totalPeriodo = useMemo(() => filtered.reduce((sum, sale) => sum + Number(sale.valor_total ?? 0), 0), [filtered])

  return (
    <section>
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500/15 text-brand-600"><ClipboardList size={22} /></span>
        <div>
          <h1 className="text-2xl font-bold text-[#1b1b1d]">Histórico de vendas</h1>
          <p className="mt-0.5 text-slate-600">Consulte pedidos anteriores e os itens de cada venda.</p>
        </div>
      </div>

      {error && <p className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="relative flex-1 min-w-[14rem]">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente ou vendedor" className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3" />
        </label>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">{filtered.length} venda(s)</p>
          <p className="text-lg font-bold text-[#1b1b1d]">{currency(totalPeriodo)}</p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        {loading ? (
          <p className="p-6 text-center text-slate-500">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-center text-slate-500">Nenhuma venda encontrada.</p>
        ) : (
          filtered.map(sale => {
            const saleItems = itemsBySale[sale.id] ?? []
            const open = openId === sale.id
            return (
              <div key={sale.id} className="border-t border-slate-100 first:border-t-0">
                <button onClick={() => setOpenId(open ? null : sale.id)} className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-slate-50">
                  <ChevronDown size={18} className={`shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} />
                  <span className="w-36 shrink-0 text-sm text-slate-500">{formatDate(sale.data_venda ?? sale.criado_em)}</span>
                  <span className="flex-1 font-medium text-[#1b1b1d]">{clienteNome[sale.cliente_id] ?? 'Cliente avulso'}</span>
                  <span className="hidden w-40 shrink-0 text-sm text-slate-500 sm:block">{vendedorNome[sale.vendedor_id] ?? 'Sem vendedor'}</span>
                  <span className="w-28 shrink-0 text-right font-semibold text-[#1b1b1d]">{currency(sale.valor_total)}</span>
                </button>
                {open && (
                  <div className="bg-slate-50 px-5 pb-4 pl-16">
                    {saleItems.length === 0 ? (
                      <p className="py-2 text-sm text-slate-500">Nenhum item registrado para esta venda.</p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="text-slate-500"><tr><th className="py-2 font-medium">Produto</th><th className="py-2 font-medium">Qtd.</th><th className="py-2 font-medium">Valor unit.</th><th className="py-2 text-right font-medium">Subtotal</th></tr></thead>
                        <tbody>
                          {saleItems.map(item => (
                            <tr key={item.id} className="border-t border-slate-200">
                              <td className="py-2">{produtoNome[item.produto_id] ?? `Produto removido (#${item.produto_id})`}</td>
                              <td className="py-2">{item.quantidade}</td>
                              <td className="py-2">{currency(item.valor_unitario)}</td>
                              <td className="py-2 text-right">{currency(item.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}
