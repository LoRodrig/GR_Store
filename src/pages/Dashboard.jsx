import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AlertTriangle, Package, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listRecords } from '../services/database'
import { supabaseConfigured } from '../services/supabase'
import { humanizeError } from '../services/errors'

const TABLES = ['clientes', 'vendedores', 'produtos', 'categorias', 'vendas', 'venda_itens', 'estoque']
const PALETTE = ['#c9a27a', '#6f4e37', '#8a7551', '#d8b78f', '#4b3a2a', '#e4c9a4']
const currency = value => Number(value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function lastNDays(n) {
  const today = new Date()
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(today)
    date.setDate(date.getDate() - (n - 1 - i))
    return date
  })
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabaseConfigured) return
    Promise.all(TABLES.map(table => listRecords(table)))
      .then(rows => setData(Object.fromEntries(TABLES.map((table, index) => [table, rows[index]]))))
      .catch(e => setError(humanizeError(e)))
  }, [])

  const stats = useMemo(() => {
    if (!data) return null
    const { clientes, produtos, vendas, venda_itens: vendaItens, categorias, estoque } = data

    const productName = Object.fromEntries(produtos.map(p => [p.id, p.nome]))
    const categoryName = Object.fromEntries(categorias.map(c => [c.id, c.nome]))
    const categoryByProduct = Object.fromEntries(produtos.map(p => [p.id, p.categoria_id]))
    const stockByProduct = Object.fromEntries(estoque.map(row => [row.produto_id, row.quantidade]))

    const faturamentoTotal = vendas.reduce((sum, sale) => sum + Number(sale.valor_total ?? 0), 0)
    const ticketMedio = vendas.length ? faturamentoTotal / vendas.length : 0
    const outOfStock = produtos.filter(product => (stockByProduct[product.id] ?? 0) <= 0)

    const dayKey = value => new Date(value).toISOString().slice(0, 10)
    const revenueByDayMap = vendas.reduce((acc, sale) => {
      const key = dayKey(sale.data_venda ?? sale.criado_em ?? new Date())
      acc[key] = (acc[key] ?? 0) + Number(sale.valor_total ?? 0)
      return acc
    }, {})
    const salesByDay = lastNDays(14).map(date => ({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: revenueByDayMap[date.toISOString().slice(0, 10)] ?? 0,
    }))

    const revenueByProductMap = vendaItens.reduce((acc, item) => {
      acc[item.produto_id] = (acc[item.produto_id] ?? 0) + Number(item.subtotal ?? item.quantidade * item.valor_unitario ?? 0)
      return acc
    }, {})
    const topProducts = Object.entries(revenueByProductMap)
      .map(([id, total]) => ({ nome: productName[id] ?? `Produto #${id}`, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)

    const revenueByCategoryMap = vendaItens.reduce((acc, item) => {
      const key = categoryByProduct[item.produto_id] ?? 'sem-categoria'
      acc[key] = (acc[key] ?? 0) + Number(item.subtotal ?? 0)
      return acc
    }, {})
    const revenueByCategory = Object.entries(revenueByCategoryMap)
      .map(([key, total]) => ({ name: key === 'sem-categoria' ? 'Sem categoria' : (categoryName[key] ?? 'Sem categoria'), total }))
      .sort((a, b) => b.total - a.total)

    return {
      clientes: clientes.length,
      produtos: produtos.length,
      vendas: vendas.length,
      faturamentoTotal,
      ticketMedio,
      outOfStock,
      salesByDay,
      topProducts,
      revenueByCategory,
      hasSales: vendas.length > 0,
    }
  }, [data])

  return (
    <section>
      <h1 className="text-2xl font-bold text-[#1b1b1d]">Dashboard</h1>
      <p className="mt-1 text-slate-600">Visão geral da sua loja.</p>

      {!supabaseConfigured && <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">Configure as variáveis públicas do Supabase no arquivo <code>.env</code> para carregar os dados.</p>}
      {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">Erro ao buscar dados: {error}</p>}

      {supabaseConfigured && !error && !stats && <p className="mt-6 text-slate-500">Carregando...</p>}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={Users} label="Clientes" value={stats.clientes} />
            <StatCard icon={Package} label="Produtos" value={stats.produtos} />
            <StatCard icon={ShoppingBag} label="Vendas" value={stats.vendas} />
            <StatCard icon={Wallet} label="Faturamento total" value={currency(stats.faturamentoTotal)} />
            <StatCard icon={TrendingUp} label="Ticket médio" value={currency(stats.ticketMedio)} />
            <StatCard icon={AlertTriangle} label="Sem estoque" value={stats.outOfStock.length} tone={stats.outOfStock.length ? 'warning' : 'default'} />
          </div>

          {stats.outOfStock.length > 0 && (
            <NavLink to="/estoque" className="mt-6 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 hover:bg-amber-100">
              <AlertTriangle size={16} className="shrink-0" />
              <span className="font-medium">Sem estoque:</span>
              <span>{stats.outOfStock.slice(0, 6).map(product => product.nome).join(', ')}{stats.outOfStock.length > 6 ? ` e mais ${stats.outOfStock.length - 6}` : ''}</span>
              <span className="ml-auto shrink-0 underline">Ver estoque</span>
            </NavLink>
          )}

          {!stats.hasSales ? (
            <p className="mt-6 rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">Nenhuma venda registrada ainda. Os gráficos aparecem assim que a primeira venda for feita.</p>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
                <h2 className="font-semibold text-[#1b1b1d]">Vendas nos últimos 14 dias</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.salesByDay}>
                      <defs>
                        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#c9a27a" stopOpacity={0.45} />
                          <stop offset="95%" stopColor="#c9a27a" stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e1da" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={{ stroke: '#e5e1da' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} width={40} tickFormatter={value => `R$${value}`} />
                      <Tooltip formatter={value => currency(value)} contentStyle={{ borderRadius: 10, border: '1px solid #e5e1da' }} />
                      <Area type="monotone" dataKey="total" stroke="#b88a5e" strokeWidth={2} fill="url(#salesFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="font-semibold text-[#1b1b1d]">Faturamento por categoria</h2>
                {stats.revenueByCategory.length === 0 ? (
                  <p className="mt-8 text-center text-sm text-slate-500">Sem dados suficientes.</p>
                ) : (
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats.revenueByCategory} dataKey="total" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                          {stats.revenueByCategory.map((entry, index) => <Cell key={entry.name} fill={PALETTE[index % PALETTE.length]} />)}
                        </Pie>
                        <Tooltip formatter={value => currency(value)} contentStyle={{ borderRadius: 10, border: '1px solid #e5e1da' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <ul className="mt-2 grid gap-1.5 text-sm">
                  {stats.revenueByCategory.slice(0, 5).map((entry, index) => (
                    <li key={entry.name} className="flex items-center justify-between gap-2 text-slate-600">
                      <span className="flex items-center gap-2 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[index % PALETTE.length] }} />{entry.name}</span>
                      <span className="shrink-0 font-medium text-[#1b1b1d]">{currency(entry.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
                <h2 className="font-semibold text-[#1b1b1d]">Produtos mais vendidos</h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.topProducts} layout="vertical" margin={{ left: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e1da" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#78716c' }} tickFormatter={value => `R$${value}`} />
                      <YAxis type="category" dataKey="nome" width={140} tick={{ fontSize: 12, fill: '#44403c' }} tickLine={false} axisLine={false} />
                      <Tooltip formatter={value => currency(value)} contentStyle={{ borderRadius: 10, border: '1px solid #e5e1da' }} />
                      <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                        {stats.topProducts.map((entry, index) => <Cell key={entry.nome} fill={PALETTE[index % PALETTE.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  const toneClass = tone === 'warning' ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-brand-500/15 text-brand-600 ring-transparent'
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ${toneClass}`}><Icon size={18} /></span>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
      <strong className="mt-3 block text-2xl text-[#1b1b1d]">{value ?? '—'}</strong>
    </article>
  )
}
