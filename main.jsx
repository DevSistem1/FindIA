import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Bot, CalendarDays, DollarSign, Moon, Package, Plus, ReceiptText, ShoppingCart, Sun, Trash2, Users } from 'lucide-react';
import './index.css';

const money = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const today = () => new Date().toISOString().slice(0, 10);
const monthKey = d => String(d || '').slice(0, 7);
const currentMonth = monthKey(today());

const seed = {
  clients: [
    { id: uid(), name: 'Maria Silva', phone: '(19) 99999-1111', email: 'maria@email.com' },
    { id: uid(), name: 'João Oliveira', phone: '(19) 98888-2222', email: 'joao@email.com' },
    { id: uid(), name: 'Tech Store ME', phone: '(19) 97777-3333', email: 'contato@techstore.com' },
  ],
  products: [
    { id: uid(), name: 'Mouse sem fio', price: 89.9, cost: 45, stock: 8, minStock: 5 },
    { id: uid(), name: 'Teclado mecânico', price: 249.9, cost: 150, stock: 3, minStock: 4 },
    { id: uid(), name: 'Monitor 24 polegadas', price: 849.9, cost: 620, stock: 2, minStock: 2 },
  ],
  sales: [],
  expenses: [
    { id: uid(), date: today(), description: 'Internet', category: 'Fixo', amount: 120 },
    { id: uid(), date: today(), description: 'Anúncios', category: 'Marketing', amount: 80 },
  ],
  appointments: [
    { id: uid(), date: today(), time: '14:00', client: 'Maria Silva', title: 'Apresentar sistema', status: 'marcado' },
  ],
};

function loadData() {
  const saved = localStorage.getItem('finadmin_data');
  if (saved) return JSON.parse(saved);
  const product = seed.products[0];
  const client = seed.clients[0];
  seed.sales = [{ id: uid(), date: today(), clientId: client.id, clientName: client.name, productId: product.id, productName: product.name, qty: 2, total: product.price * 2 }];
  return seed;
}

function App() {
  const [data, setData] = useState(loadData);
  const [page, setPage] = useState('dashboard');
  const [question, setQuestion] = useState('Quanto vendi este mês?');
  const [theme, setTheme] = useState(() => localStorage.getItem('finadmin_theme') || 'light');

  useEffect(() => localStorage.setItem('finadmin_data', JSON.stringify(data)), [data]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('finadmin_theme', theme);
  }, [theme]);
  const update = patch => setData(d => ({ ...d, ...patch }));

  const stats = useMemo(() => {
    const monthSales = data.sales.filter(s => monthKey(s.date) === currentMonth);
    const revenue = monthSales.reduce((sum, s) => sum + Number(s.total), 0);
    const expenses = data.expenses.filter(e => monthKey(e.date) === currentMonth).reduce((sum, e) => sum + Number(e.amount), 0);
    const bestClient = Object.values(monthSales.reduce((acc, s) => {
      acc[s.clientName] ||= { name: s.clientName, total: 0 };
      acc[s.clientName].total += Number(s.total);
      return acc;
    }, {})).sort((a, b) => b.total - a.total)[0];
    const lowStock = data.products.filter(p => Number(p.stock) <= Number(p.minStock));
    return { revenue, expenses, profit: revenue - expenses, salesCount: monthSales.length, bestClient, lowStock };
  }, [data]);

  const askAI = q => {
    const text = q.toLowerCase();
    if (text.includes('quanto') && (text.includes('vendi') || text.includes('vendeu'))) return `Você vendeu ${money(stats.revenue)} neste mês em ${stats.salesCount} venda(s).`;
    if (text.includes('acabando') || text.includes('estoque') || text.includes('baixo')) return stats.lowStock.length ? `Produtos acabando: ${stats.lowStock.map(p => `${p.name} (${p.stock} un.)`).join(', ')}.` : 'Nenhum produto está abaixo do estoque mínimo.';
    if (text.includes('cliente') && (text.includes('mais') || text.includes('comprou'))) return stats.bestClient ? `O cliente que mais comprou este mês foi ${stats.bestClient.name}, com ${money(stats.bestClient.total)}.` : 'Ainda não há vendas neste mês.';
    if (text.includes('lucro')) return `Seu lucro estimado neste mês é ${money(stats.profit)}.`;
    return 'Posso responder sobre vendas do mês, produtos acabando, melhor cliente e lucro.';
  };

  const nav = [
    ['dashboard', BarChart3, 'Dashboard'], ['financeiro', DollarSign, 'Financeiro'], ['estoque', Package, 'Estoque'],
    ['vendas', ShoppingCart, 'Vendas'], ['clientes', Users, 'Clientes'], ['agenda', CalendarDays, 'Agenda'], ['relatorios', ReceiptText, 'Relatórios'], ['assistente', Bot, 'Assistente IA']
  ];

  return <div className="app">
    <aside className="sidebar">
      <div className="brand">
        <h1>FinAdmin <span>IA</span></h1>
        <p>Sistema para pequenos negócios</p>
      </div>
      <div className="theme-box">
        <span>{theme === 'dark' ? 'Tema escuro' : 'Tema claro'}</span>
        <button type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Alternar tema claro ou escuro">
          {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
          {theme === 'dark' ? 'Claro' : 'Escuro'}
        </button>
      </div>
      <div className="menu-title">Menu principal</div>
      <nav className="side-menu">
        {nav.map(([id, Icon, label]) => (
          <button key={id} onClick={() => setPage(id)} className={page === id ? 'active' : ''}>
            <Icon size={19}/>
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
    <main>
      {page === 'dashboard' && <Dashboard stats={stats} data={data}/>} 
      {page === 'financeiro' && <Financeiro data={data} update={update}/>} 
      {page === 'estoque' && <Estoque data={data} update={update}/>} 
      {page === 'vendas' && <Vendas data={data} update={update}/>} 
      {page === 'clientes' && <Clientes data={data} update={update}/>} 
      {page === 'agenda' && <Agenda data={data} update={update}/>} 
      {page === 'relatorios' && <Relatorios stats={stats} data={data}/>} 
      {page === 'assistente' && <Assistente question={question} setQuestion={setQuestion} askAI={askAI}/>} 
    </main>
  </div>;
}

function Kpi({ title, value, icon }) { return <div className="kpi"><div>{icon}</div><span>{title}</span><strong>{value}</strong></div>; }
function Dashboard({ stats, data }) { return <><Header title="Dashboard" subtitle="Visão geral do pequeno negócio"/><div className="kpis"><Kpi title="Vendas do mês" value={money(stats.revenue)} icon={<DollarSign/>}/><Kpi title="Despesas" value={money(stats.expenses)} icon={<ReceiptText/>}/><Kpi title="Lucro estimado" value={money(stats.profit)} icon={<BarChart3/>}/><Kpi title="Produtos baixos" value={stats.lowStock.length} icon={<Package/>}/></div><section className="grid"><Card title="Últimas vendas"><Table rows={data.sales.slice(0,5)} cols={['date','clientName','productName','total']} moneyCols={['total']}/></Card><Card title="Produtos acabando"><Table rows={stats.lowStock} cols={['name','stock','minStock','price']} moneyCols={['price']}/></Card></section></>; }
function Header({ title, subtitle }) { return <div className="header"><h2>{title}</h2><p>{subtitle}</p></div>; }
function Card({ title, children }) { return <section className="card"><h3>{title}</h3>{children}</section>; }
function Table({ rows, cols, moneyCols=[] }) { return rows.length ? <div className="table"><table><tbody>{rows.map(r => <tr key={r.id}>{cols.map(c => <td key={c}>{moneyCols.includes(c) ? money(r[c]) : r[c]}</td>)}</tr>)}</tbody></table></div> : <p className="empty">Nada cadastrado ainda.</p>; }

function Financeiro({ data, update }) { const [f, setF] = useState({ date: today(), description: '', category: '', amount: '' }); const add = e => { e.preventDefault(); update({ expenses: [{ ...f, id: uid(), amount: Number(f.amount) }, ...data.expenses] }); setF({ date: today(), description: '', category: '', amount: '' }); }; return <><Header title="Financeiro" subtitle="Cadastre despesas e acompanhe o caixa"/><Card title="Nova despesa"><form onSubmit={add} className="form"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/><input placeholder="Descrição" value={f.description} onChange={e=>setF({...f,description:e.target.value})} required/><input placeholder="Categoria" value={f.category} onChange={e=>setF({...f,category:e.target.value})}/><input type="number" step="0.01" placeholder="Valor" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} required/><button><Plus size={18}/>Adicionar</button></form></Card><Card title="Despesas"><Table rows={data.expenses} cols={['date','description','category','amount']} moneyCols={['amount']}/></Card></>; }
function Estoque({ data, update }) { const [f, setF] = useState({ name: '', price: '', cost: '', stock: '', minStock: '3' }); const add = e => { e.preventDefault(); update({ products: [{ ...f, id: uid(), price: Number(f.price), cost: Number(f.cost), stock: Number(f.stock), minStock: Number(f.minStock) }, ...data.products] }); setF({ name: '', price: '', cost: '', stock: '', minStock: '3' }); }; const del = id => update({products:data.products.filter(p=>p.id!==id)}); return <><Header title="Estoque" subtitle="Controle produtos, preços e estoque mínimo"/><Card title="Novo produto"><form onSubmit={add} className="form"><input placeholder="Produto" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/><input type="number" step="0.01" placeholder="Preço venda" value={f.price} onChange={e=>setF({...f,price:e.target.value})} required/><input type="number" step="0.01" placeholder="Custo" value={f.cost} onChange={e=>setF({...f,cost:e.target.value})}/><input type="number" placeholder="Estoque" value={f.stock} onChange={e=>setF({...f,stock:e.target.value})} required/><input type="number" placeholder="Estoque mínimo" value={f.minStock} onChange={e=>setF({...f,minStock:e.target.value})}/><button><Plus size={18}/>Salvar</button></form></Card><Card title="Produtos"><div className="table"><table><tbody>{data.products.map(p=><tr key={p.id} className={p.stock<=p.minStock?'warn':''}><td>{p.name}</td><td>{money(p.price)}</td><td>{p.stock} un.</td><td>mín. {p.minStock}</td><td><button className="danger" onClick={()=>del(p.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></Card></>; }
function Vendas({ data, update }) { const [f, setF] = useState({ date: today(), clientId: data.clients[0]?.id || '', productId: data.products[0]?.id || '', qty: 1 }); const add = e => { e.preventDefault(); const c = data.clients.find(x=>x.id===f.clientId); const p = data.products.find(x=>x.id===f.productId); if(!c||!p) return; const qty = Number(f.qty); update({ sales: [{ id: uid(), date: f.date, clientId:c.id, clientName:c.name, productId:p.id, productName:p.name, qty, total: qty * p.price }, ...data.sales], products: data.products.map(x=>x.id===p.id?{...x,stock:Math.max(0,Number(x.stock)-qty)}:x) }); }; return <><Header title="Vendas" subtitle="Registre vendas e baixe estoque automaticamente"/><Card title="Nova venda"><form onSubmit={add} className="form"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/><select value={f.clientId} onChange={e=>setF({...f,clientId:e.target.value})}>{data.clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={f.productId} onChange={e=>setF({...f,productId:e.target.value})}>{data.products.map(p=><option key={p.id} value={p.id}>{p.name} - {money(p.price)}</option>)}</select><input type="number" min="1" value={f.qty} onChange={e=>setF({...f,qty:e.target.value})}/><button><ShoppingCart size={18}/>Vender</button></form></Card><Card title="Histórico de vendas"><Table rows={data.sales} cols={['date','clientName','productName','qty','total']} moneyCols={['total']}/></Card></>; }
function Clientes({ data, update }) { const [f, setF] = useState({ name: '', phone: '', email: '' }); const add = e => { e.preventDefault(); update({ clients: [{ ...f, id: uid() }, ...data.clients] }); setF({ name: '', phone: '', email: '' }); }; return <><Header title="Clientes" subtitle="Cadastre e acompanhe compradores"/><Card title="Novo cliente"><form onSubmit={add} className="form"><input placeholder="Nome" value={f.name} onChange={e=>setF({...f,name:e.target.value})} required/><input placeholder="Telefone" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/><input placeholder="E-mail" value={f.email} onChange={e=>setF({...f,email:e.target.value})}/><button><Plus size={18}/>Adicionar</button></form></Card><Card title="Lista de clientes"><Table rows={data.clients} cols={['name','phone','email']}/></Card></>; }
function Agenda({ data, update }) { const [f, setF] = useState({ date: today(), time: '', client: '', title: '', status: 'marcado' }); const add = e => { e.preventDefault(); update({ appointments: [{ ...f, id: uid() }, ...data.appointments] }); setF({ date: today(), time: '', client: '', title: '', status: 'marcado' }); }; return <><Header title="Agendamentos" subtitle="Controle reuniões, entregas e atendimentos"/><Card title="Novo agendamento"><form onSubmit={add} className="form"><input type="date" value={f.date} onChange={e=>setF({...f,date:e.target.value})}/><input type="time" value={f.time} onChange={e=>setF({...f,time:e.target.value})}/><input placeholder="Cliente" value={f.client} onChange={e=>setF({...f,client:e.target.value})}/><input placeholder="Descrição" value={f.title} onChange={e=>setF({...f,title:e.target.value})} required/><button><CalendarDays size={18}/>Agendar</button></form></Card><Card title="Agenda"><Table rows={data.appointments} cols={['date','time','client','title','status']}/></Card></>; }
function Relatorios({ stats, data }) { const topProducts = Object.values(data.sales.reduce((a,s)=>{a[s.productName] ||= {id:s.productName,name:s.productName,qty:0,total:0}; a[s.productName].qty+=Number(s.qty); a[s.productName].total+=Number(s.total); return a},{})).sort((a,b)=>b.total-a.total); return <><Header title="Relatórios" subtitle="Resumo para tomada de decisão"/><div className="kpis"><Kpi title="Receita" value={money(stats.revenue)} icon={<DollarSign/>}/><Kpi title="Lucro" value={money(stats.profit)} icon={<BarChart3/>}/><Kpi title="Melhor cliente" value={stats.bestClient?.name || '-'} icon={<Users/>}/></div><Card title="Produtos mais vendidos"><Table rows={topProducts} cols={['name','qty','total']} moneyCols={['total']}/></Card></>; }
function Assistente({ question, setQuestion, askAI }) { const examples = ['Quanto vendi este mês?', 'Quais produtos estão acabando?', 'Qual cliente mais comprou?', 'Qual meu lucro este mês?']; return <><Header title="Assistente IA" subtitle="Pergunte sobre os dados do negócio"/><Card title="Perguntar"><div className="assistant"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Digite sua pergunta..."/><div className="answer"><Bot/> {askAI(question)}</div><div className="chips">{examples.map(x=><button key={x} onClick={()=>setQuestion(x)}>{x}</button>)}</div></div></Card></>; }

createRoot(document.getElementById('root')).render(<App />);
