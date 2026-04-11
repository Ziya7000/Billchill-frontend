import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [dueDate, setDueDate] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(0.92);

  useEffect(() => {
    const saved = localStorage.getItem('billchill_data');
    if (saved) setSubscriptions(JSON.parse(saved));
    fetchRate('EUR');
  }, []);

  const fetchRate = (symbol) => {
    fetch(`https://open.er-api.com/v6/latest/USD`)
      .then(res => res.json())
      .then(data => {
        setExchangeRate(data.rates[symbol]);
        setCurrency(symbol);
      });
  };
  const addSub = async (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    const newSubData = {
      name: name,
      cost: parseFloat(amount),
      next_billing_date: dueDate
    };

    try {
      const response = await fetch('/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubData),
      });

      if (response.ok) {
        const savedSub = await response.json();
        setSubscriptions([...subscriptions, { ...savedSub, amount: savedSub.cost, id: Date.now() }]);
        setName(''); setAmount(''); setDueDate('');
      } else {
        // If server gives an error, we still want to see it on our screen!
        throw new Error("Server error");
      }
    } catch (error) {
      console.log("Using fallback logic to update UI.");
      
      const localFallback = { 
        id: Date.now(), 
        name, 
        amount: parseFloat(amount), 
        category, 
        dueDate 
      };
      
      // THIS IS THE KEY LINE: This tells the screen to refresh
      setSubscriptions([...subscriptions, localFallback]);
      
      // Clear the input boxes
      setName(''); 
      setAmount(''); 
      setDueDate('');
    }
  };
 
  

  const deleteSub = (id) => setSubscriptions(subscriptions.filter(s => s.id !== id));
  const totalMonthly = subscriptions.reduce((acc, curr) => acc + curr.amount, 0);

  // Data for the Analytics Dashboard 
  const chartData = [
    { name: 'Entertainment', value: subscriptions.filter(s => s.category === 'Entertainment').reduce((a, b) => a + b.amount, 0) },
    { name: 'Utilities', value: subscriptions.filter(s => s.category === 'Utilities').reduce((a, b) => a + b.amount, 0) },
    { name: 'Software', value: subscriptions.filter(s => s.category === 'Software').reduce((a, b) => a + b.amount, 0) },
    { name: 'Health', value: subscriptions.filter(s => s.category === 'Health').reduce((a, b) => a + b.amount, 0) },
  ].filter(item => item.value > 0);

  const COLORS = ['#2563eb', '#7c3aed', '#db2777', '#059669'];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 text-slate-900 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-black text-blue-600 italic tracking-tighter">BILLCHILL</h1>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-2">Currency</span>
            <select className="bg-slate-50 border-none rounded-lg px-3 py-1 font-bold text-xs outline-blue-500" onChange={(e) => fetchRate(e.target.value)}>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Dashboard Stats [cite: 15] */}
          <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-white">
            <h2 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">Total Monthly Spend</h2>
            <div className="flex items-baseline gap-4 mb-8">
              <p className="text-7xl font-black text-slate-900 leading-none">${totalMonthly.toFixed(2)}</p>
              <p className="text-blue-500 font-bold text-xl tracking-tight">≈ {(totalMonthly * exchangeRate).toFixed(2)} {currency}</p>
            </div>
            
            <div className="h-64 border-t border-slate-50 pt-8">
              {subscriptions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300 italic">Add your first bill to see analytics</div>
              )}
            </div>
          </div>

          {/* Input Form [cite: 12] */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 h-fit">
            <h3 className="text-xl font-bold mb-6 italic tracking-tight text-blue-600">Add New Subscription</h3>
            <form onSubmit={addSub} className="space-y-4">
              <input type="text" placeholder="Service Name (e.g. Netflix)" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500 transition-all" value={name} onChange={e => setName(e.target.value)} required />
              <input type="number" placeholder="Cost per month" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500 transition-all" value={amount} onChange={e => setAmount(e.target.value)} required />
              <select className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500 transition-all" value={category} onChange={e => setCategory(e.target.value)}>
                <option>Entertainment</option><option>Utilities</option><option>Software</option><option>Health</option>
              </select>
              <input type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none outline-blue-500 transition-all text-slate-400" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              <button className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest text-sm">Add to Dashboard</button>
            </form>
          </div>
        </div>

        {/* Subscription List [cite: 12] */}
        <div className="mt-12 grid gap-4">
          <h3 className="font-bold text-slate-500 uppercase text-xs tracking-widest ml-4 mb-2">Tracked Subscriptions</h3>
          {subscriptions.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 p-12 rounded-[2rem] text-center text-slate-400">Empty Dashboard</div>
          ) : (
            subscriptions.map(sub => (
              <div key={sub.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-50 flex justify-between items-center group hover:border-blue-200 transition-all">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 text-xl">{sub.name.charAt(0)}</div>
                  <div>
                    <p className="font-black text-slate-800 text-lg uppercase tracking-tight">{sub.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{sub.category} • Due: {sub.dueDate || sub.next_billing_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <p className="text-3xl font-black text-slate-900">${sub.amount.toFixed(2)}</p>
                  <button onClick={() => deleteSub(sub.id)} className="text-slate-200 hover:text-red-500 transition-colors text-2xl font-light px-2">×</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;