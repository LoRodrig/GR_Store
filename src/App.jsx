import { NavLink, Route, Routes } from 'react-router-dom'
import { ChartNoAxesCombined, ClipboardList, Package, PackageCheck, ShoppingBag, Tags, Users, UserRoundCog } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CrudPage from './pages/CrudPage'
import SalesPage from './pages/SalesPage'
import InventoryPage from './pages/InventoryPage'

const links = [
  ['/', 'Dashboard', ChartNoAxesCombined], ['/clientes', 'Clientes', Users], ['/vendedores', 'Vendedores', UserRoundCog],
  ['/categorias', 'Categorias', Tags], ['/produtos', 'Produtos', Package], ['/estoque', 'Estoque', PackageCheck], ['/vendas/nova', 'Nova venda', ShoppingBag], ['/vendas', 'Histórico', ClipboardList],
]

export default function App() {
  return <div className="app-shell min-h-screen md:grid md:grid-cols-[17.5rem_1fr]">
    <aside className="app-sidebar fixed inset-x-0 bottom-0 z-30 px-2 py-2 text-slate-100 md:static md:px-4 md:py-6"><div className="mb-9 hidden items-center gap-3 px-3 md:flex"><div className="brand-mark"><ShoppingBag size={20}/></div><div><p className="text-lg font-bold tracking-tight">GR Store</p><p className="text-sm text-slate-400">Gestão da loja</p></div></div><nav className="grid grid-cols-4 gap-1 md:flex md:flex-col">{links.map(([to, label, Icon]) => <NavLink key={to} end={to === '/'} to={to} className={({ isActive }) => `nav-item flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-tight md:min-h-0 md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${isActive ? 'nav-item-active text-white' : 'text-slate-300'}`}><Icon size={18}/><span className="text-center md:text-left">{label}</span></NavLink>)}</nav><div className="mt-10 hidden rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-xs leading-relaxed text-slate-400 md:block"><span className="mb-1 block font-semibold text-slate-200">Tudo sob controle</span>Cadastros, estoque e vendas em um só lugar.</div></aside>
    <main className="app-main p-5 pb-40 md:p-9"><header className="mb-7 flex items-center justify-between md:hidden"><div className="flex items-center gap-3"><div className="brand-mark"><ShoppingBag size={18}/></div><div><p className="font-bold tracking-tight">GR Store</p><p className="text-xs text-slate-500">Gestão da loja</p></div></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-brand-500">Online</span></header><Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/clientes" element={<CrudPage title="Clientes" table="clientes" fields={[["nome", "Nome"], ["telefone", "Telefone"], ["instagram", "Instagram"], ["observacao", "Observação"]]} />} />
      <Route path="/vendedores" element={<CrudPage title="Vendedores" table="vendedores" fields={[["nome", "Nome"], ["telefone", "Telefone"]]} />} />
      <Route path="/categorias" element={<CrudPage title="Categorias" table="categorias" fields={[["nome", "Nome"]]} />} />
      <Route path="/produtos" element={<CrudPage title="Produtos" table="produtos" fields={[["nome", "Nome"], ["categoria_id", "Categoria", "select", "categorias"], ["marca", "Marca"], ["cor", "Cor"], ["tamanho", "Tamanho"], ["preco", "Preço", "number"]]} />} />
      <Route path="/estoque" element={<InventoryPage />} />
      <Route path="/vendas/nova" element={<SalesPage />} />
      <Route path="/vendas" element={<CrudPage title="Histórico de vendas" table="vendas" fields={[["valor_total", "Total", "number"], ["data_venda", "Data da venda"]]} readOnly />} />
    </Routes></main>
  </div>
}
