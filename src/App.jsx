import { useEffect, useMemo, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import {
  ChartNoAxesCombined,
  ClipboardList,
  LogOut,
  Package,
  PackageCheck,
  Save,
  Settings,
  ShoppingBag,
  Store,
  Tags,
  UserRoundCog,
  Users,
  X,
} from 'lucide-react'
import Dashboard from './pages/Dashboard'
import CrudPage from './pages/CrudPage'
import SalesPage from './pages/SalesPage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import InventoryPage from './pages/InventoryPage'

const authKey = 'gr-store-authenticated'
const settingsKey = 'gr-store-settings'

const loginEmail = import.meta.env.VITE_APP_LOGIN_EMAIL ?? 'GRstore.com'
const loginPassword = import.meta.env.VITE_APP_LOGIN_PASSWORD ?? 'Senhapadrao123'

const logoOptions = [
  { id: 'branco', label: 'Fundo branco', src: `${import.meta.env.BASE_URL}logo-fundo-branco.jpg` },
  { id: 'premium', label: 'Premium escuro', src: `${import.meta.env.BASE_URL}logo-fundo.jpg` },
  { id: 'chapado', label: 'Chapado', src: `${import.meta.env.BASE_URL}logo-fundo-chapado.jpg` },
]

const defaultSettings = {
  name: 'GR Store',
  subtitle: 'Gestao da loja',
  phone: '',
  instagram: '',
  address: '',
  logoId: 'branco',
}

const links = [
  ['/', 'Dashboard', ChartNoAxesCombined],
  ['/clientes', 'Clientes', Users],
  ['/vendedores', 'Vendedores', UserRoundCog],
  ['/categorias', 'Categorias', Tags],
  ['/produtos', 'Produtos', Package],
  ['/estoque', 'Estoque', PackageCheck],
  ['/vendas/nova', 'Nova venda', ShoppingBag],
  ['/vendas', 'Historico', ClipboardList],
]

function loadSettings() {
  try {
    return { ...defaultSettings, ...JSON.parse(localStorage.getItem(settingsKey) ?? '{}') }
  } catch {
    return defaultSettings
  }
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = event => {
    event.preventDefault()
    if (email.trim() === loginEmail && password === loginPassword) {
      localStorage.setItem(authKey, 'true')
      onLogin()
      return
    }
    setError('E-mail ou senha incorretos.')
  }

  return (
    <main className="login-page grid min-h-screen place-items-center px-5 py-10">
      <section className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <img src={`${import.meta.env.BASE_URL}logo-fundo-branco.jpg`} alt="GR Store" className="login-logo" />
        </div>
        <form onSubmit={submit} className="login-card grid gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#1b1b1d]">Entrar</h1>
            <p className="mt-1 text-sm text-stone-600">Acesse o painel da GR Store.</p>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <label className="grid gap-1 text-sm font-medium text-[#1b1b1d]">
            E-mail
            <input
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="rounded-lg border border-[#d8d4ce] px-3 py-3"
              autoComplete="username"
              autoFocus
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-[#1b1b1d]">
            Senha
            <input
              type="password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              className="rounded-lg border border-[#d8d4ce] px-3 py-3"
              autoComplete="current-password"
            />
          </label>
          <button className="rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-600">
            Entrar
          </button>
        </form>
      </section>
    </main>
  )
}

function StoreSettings({ open, settings, onClose, onSave }) {
  const [draft, setDraft] = useState(settings)

  useEffect(() => {
    if (open) setDraft(settings)
  }, [open, settings])

  if (!open) return null

  const submit = event => {
    event.preventDefault()
    onSave(draft)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-0 md:p-5" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="settings-panel ml-auto flex h-full w-full flex-col bg-[#f7f4ef] shadow-2xl md:max-w-md md:rounded-xl">
        <header className="flex items-center justify-between border-b border-[#d8d4ce] px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1b1b1d]">Informacoes da loja</h2>
            <p className="text-sm text-stone-600">Logo, nome e contatos do sistema.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-stone-600 hover:bg-white" aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <div className="grid flex-1 content-start gap-4 overflow-y-auto px-5 py-5">
          <label className="grid gap-1 text-sm font-medium">
            Nome da loja
            <input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} className="rounded-lg border border-[#d8d4ce] px-3 py-2.5" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Subtitulo
            <input value={draft.subtitle} onChange={event => setDraft({ ...draft, subtitle: event.target.value })} className="rounded-lg border border-[#d8d4ce] px-3 py-2.5" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Telefone
            <input value={draft.phone} onChange={event => setDraft({ ...draft, phone: event.target.value })} className="rounded-lg border border-[#d8d4ce] px-3 py-2.5" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Instagram
            <input value={draft.instagram} onChange={event => setDraft({ ...draft, instagram: event.target.value })} className="rounded-lg border border-[#d8d4ce] px-3 py-2.5" />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Endereco
            <textarea value={draft.address} onChange={event => setDraft({ ...draft, address: event.target.value })} className="min-h-20 rounded-lg border border-[#d8d4ce] px-3 py-2.5" />
          </label>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-semibold text-[#1b1b1d]">Logo do sistema</legend>
            <div className="grid gap-3">
              {logoOptions.map(option => (
                <label key={option.id} className={`logo-choice ${draft.logoId === option.id ? 'logo-choice-active' : ''}`}>
                  <input
                    type="radio"
                    name="logo"
                    value={option.id}
                    checked={draft.logoId === option.id}
                    onChange={() => setDraft({ ...draft, logoId: option.id })}
                    className="sr-only"
                  />
                  <img src={option.src} alt={option.label} className="h-16 w-28 rounded-lg bg-white object-contain p-2" />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <footer className="grid grid-cols-2 gap-3 border-t border-[#d8d4ce] p-5">
          <button type="button" onClick={onClose} className="rounded-lg bg-[#1b1b1d] px-4 py-3 font-semibold text-white hover:bg-[#303030]">
            Cancelar
          </button>
          <button className="flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-3 font-semibold text-white hover:bg-brand-600">
            <Save size={18} /> Salvar
          </button>
        </footer>
      </form>
    </div>
  )
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem(authKey) === 'true')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState(loadSettings)
  const activeLogo = useMemo(() => logoOptions.find(option => option.id === settings.logoId) ?? logoOptions[0], [settings.logoId])

  const saveSettings = nextSettings => {
    const cleanSettings = { ...defaultSettings, ...nextSettings, logoId: nextSettings.logoId || defaultSettings.logoId }
    localStorage.setItem(settingsKey, JSON.stringify(cleanSettings))
    setSettings(cleanSettings)
    setSettingsOpen(false)
  }

  const logout = () => {
    localStorage.removeItem(authKey)
    setAuthenticated(false)
  }

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />

  return (
    <div className="app-shell min-h-screen md:grid md:grid-cols-[17.5rem_1fr]">
      <aside className="app-sidebar fixed inset-x-0 bottom-0 z-30 px-2 py-2 text-slate-100 md:static md:px-4 md:py-6">
        <div className="mb-8 hidden px-3 md:block">
          <button type="button" onClick={() => setSettingsOpen(true)} className="group grid w-full gap-3 text-left" title="Editar informacoes da loja">
            <img src={activeLogo.src} alt={settings.name} className="brand-logo" />
            <span className="flex items-center justify-between text-sm text-stone-300">
              <span>{settings.subtitle}</span>
              <Settings size={16} className="text-[#c9a27a] transition group-hover:rotate-45" />
            </span>
          </button>
        </div>
        <nav className="grid grid-cols-4 gap-1 md:flex md:flex-col">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} end={to === '/'} to={to} className={({ isActive }) => `nav-item flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-tight md:min-h-0 md:flex-row md:justify-start md:gap-3 md:px-3 md:py-3 md:text-sm ${isActive ? 'nav-item-active text-white' : 'text-stone-300'}`}>
              <Icon size={18} />
              <span className="text-center md:text-left">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-10 hidden rounded-2xl border border-stone-700 bg-stone-900/70 p-4 text-xs leading-relaxed text-stone-400 md:block">
          <span className="mb-1 flex items-center gap-2 font-semibold text-stone-200"><Store size={15} /> {settings.name}</span>
          Cadastros, estoque e vendas em um so lugar.
          <button type="button" onClick={logout} className="mt-4 flex items-center gap-2 text-stone-300 hover:text-white">
            <LogOut size={15} /> Sair
          </button>
        </div>
      </aside>

      <main className="app-main p-5 pb-40 md:p-9">
        <header className="mb-7 flex items-center justify-between md:hidden">
          <button type="button" onClick={() => setSettingsOpen(true)} className="flex items-center gap-3 text-left">
            <img src={activeLogo.src} alt={settings.name} className="mobile-logo" />
          </button>
          <button type="button" onClick={logout} className="status-chip flex items-center gap-2">
            <LogOut size={14} /> Sair
          </button>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<CrudPage title="Clientes" table="clientes" icon={Users} subtitle="Cadastro de clientes da loja." fields={[['nome', 'Nome'], ['telefone', 'Telefone'], ['instagram', 'Instagram'], ['observacao', 'Observacao']]} />} />
          <Route path="/vendedores" element={<CrudPage title="Vendedores" table="vendedores" icon={UserRoundCog} subtitle="Equipe de vendas cadastrada." fields={[['nome', 'Nome'], ['telefone', 'Telefone']]} />} />
          <Route path="/categorias" element={<CrudPage title="Categorias" table="categorias" icon={Tags} subtitle="Categorias usadas nos produtos." fields={[['nome', 'Nome']]} />} />
          <Route path="/produtos" element={<CrudPage title="Produtos" table="produtos" icon={Package} subtitle="Catálogo de produtos da loja." fields={[['nome', 'Nome'], ['categoria_id', 'Categoria', 'select', 'categorias'], ['marca', 'Marca'], ['cor', 'Cor'], ['tamanho', 'Tamanho'], ['preco', 'Preco', 'number']]} />} />
          <Route path="/estoque" element={<InventoryPage />} />
          <Route path="/vendas/nova" element={<SalesPage />} />
          <Route path="/vendas" element={<SalesHistoryPage />} />
        </Routes>
      </main>

      <StoreSettings open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />
    </div>
  )
}
