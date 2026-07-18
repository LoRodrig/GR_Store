import { useEffect, useState } from 'react'
import { listRecords } from '../services/database'
import { supabaseConfigured } from '../services/supabase'

const metrics = [['clientes', 'Clientes'], ['produtos', 'Produtos'], ['vendas', 'Vendas']]
export default function Dashboard() {
  const [counts, setCounts] = useState({})
  const [error, setError] = useState('')
  useEffect(() => { if (!supabaseConfigured) return; Promise.all(metrics.map(([table]) => listRecords(table))).then(rows => setCounts(Object.fromEntries(rows.map((data, i) => [metrics[i][0], data.length])))).catch(e => setError(e.message)) }, [])
  return <section><h1 className="text-2xl font-bold">Dashboard</h1><p className="mt-1 text-slate-600">Visão geral da sua loja.</p>
    {!supabaseConfigured && <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">Configure as variáveis públicas do Supabase no arquivo <code>.env</code> para carregar os dados.</p>}
    {error && <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">Erro ao buscar dados: {error}</p>}
    <div className="mt-6 grid gap-4 sm:grid-cols-3">{metrics.map(([key, label]) => <article key={key} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-3xl">{counts[key] ?? '—'}</strong></article>)}</div>
  </section>
}
