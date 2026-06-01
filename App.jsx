import { useState, useMemo } from "react";
import { Plus, X, Check, ChevronDown, BarChart2, PieChart, Activity, Calendar, TrendingUp as TrendingUpIcon, Radar, Download } from "lucide-react";
import { 
  fmt, 
  Sparkline, 
  HorizontalBars, 
  DonutChart, 
  GroupedBars, 
  ForecastChart, 
  RadarChart, 
  KPICard, 
  TransactionRow,
  EmptyChart 
} from "./components";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = ["Food", "Salary", "Entertainment", "Rent", "Utilities", "Transport", "Health", "Other"];
const EXPENSE_CATEGORIES = ["Food", "Entertainment", "Rent", "Utilities", "Transport", "Health", "Other"];

let _nextId = 1;
const uid = () => _nextId++;

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", category: "Food", date: new Date().toISOString().slice(0, 10) });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // ── KPI derivations ────────────────────────────────────────────────
  const { totalIncome, totalExpenses } = useMemo(
    () =>
      transactions.reduce(
        (acc, tx) => {
          tx.type === "income" ? (acc.totalIncome += tx.amount) : (acc.totalExpenses += tx.amount);
          return acc;
        },
        { totalIncome: 0, totalExpenses: 0 }
      ),
    [transactions]
  );
  const balance = totalIncome - totalExpenses;

  // ── Sparkline: running balance over time ───────────────────────────────────
  const balanceOverTime = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    return sorted.map((tx) => {
      running += tx.type === "income" ? tx.amount : -tx.amount;
      return running;
    });
  }, [transactions]);

  // ── Monthly balance for forecast ───────────────────────────────────────────
  const monthlyBalances = useMemo(() => {
    const map = {};
    const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let running = 0;
    
    sorted.forEach((tx) => {
      const month = tx.date.slice(0, 7);
      running += tx.type === "income" ? tx.amount : -tx.amount;
      map[month] = running;
    });
    
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, value }));
  }, [transactions]);

  // ── Forecast calculation (linear regression) ───────────────────────────────
  const forecastData = useMemo(() => {
    if (monthlyBalances.length < 3) {
      return { historical: [], predicted: [] };
    }
    
    const months = monthlyBalances.map((_, i) => i);
    const values = monthlyBalances.map(m => m.value);
    const n = months.length;
    
    const sumX = months.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = months.reduce((a, b, i) => a + b * values[i], 0);
    const sumX2 = months.reduce((a, b) => a + b * b, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const residuals = values.map((y, i) => y - (slope * i + intercept));
    const stdDev = Math.sqrt(residuals.reduce((a, r) => a + r * r, 0) / n);
    
    const historical = monthlyBalances.map((m, i) => ({
      value: m.value,
      month: m.month,
    }));
    
    const predicted = [];
    for (let i = 1; i <= 3; i++) {
      const nextX = n - 1 + i;
      const predValue = slope * nextX + intercept;
      predicted.push({
        value: Math.max(0, predValue),
        upper: predValue + stdDev * 1.5,
        lower: Math.max(0, predValue - stdDev * 1.5),
      });
    }
    
    return { historical, predicted };
  }, [monthlyBalances]);

  // ── Radar chart data: expense categories only (exclude Salary) ─────────────
  const radarData = useMemo(() => {
    const categoryTotals = transactions
      .filter(tx => tx.type === "expense")
      .reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
        return acc;
      }, {});
    
    const categories = EXPENSE_CATEGORIES.slice(0, 6);
    const values = categories.map(cat => categoryTotals[cat] || 0);
    
    return { categories, values };
  }, [transactions]);

  // ── Donut: expenses by category ───────────────────────────────────────────
  const donutData = useMemo(() => {
    const totals = transactions
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => { acc[tx.category] = (acc[tx.category] || 0) + tx.amount; return acc; }, {});
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  const categoryBreakdown = useMemo(() => donutData.slice(0, 6), [donutData]);

  const monthlyData = useMemo(() => {
    const map = {};
    transactions.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expense: 0 };
      tx.type === "income" ? (map[key].income += tx.amount) : (map[key].expense += tx.amount);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, v]) => ({
        label: new Date(key + "-01").toLocaleString("en", { month: "short" }).toUpperCase(),
        ...v,
      }));
  }, [transactions]);

  const visible = useMemo(
    () =>
      transactions
        .filter((tx) => filterType === "All" || tx.type === filterType.toLowerCase())
        .filter((tx) => filterCategory === "All" || tx.category === filterCategory)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [transactions, filterType, filterCategory]
  );

  // ── CSV Export Function ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      setFormError("No transactions to export");
      setTimeout(() => setFormError(""), 2000);
      return;
    }

    // Prepare CSV data
    const csvRows = [];
    
    // Add headers
    csvRows.push(["Date", "Description", "Category", "Type", "Amount (USD)"].join(","));
    
    // Add transaction rows (sorted by date)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    sortedTransactions.forEach((tx) => {
      const row = [
        tx.date,
        `"${tx.description.replace(/"/g, '""')}"`, // Escape quotes
        tx.category,
        tx.type.toUpperCase(),
        tx.amount.toFixed(2)
      ];
      csvRows.push(row.join(","));
    });
    
    // Add summary section
    csvRows.push([]);
    csvRows.push(["SUMMARY STATISTICS"].join(","));
    csvRows.push(["Total Income", `"${fmt(totalIncome)}"`].join(","));
    csvRows.push(["Total Expenses", `"${fmt(totalExpenses)}"`].join(","));
    csvRows.push(["Net Balance", `"${fmt(balance)}"`].join(","));
    csvRows.push([]);
    
    // Add category breakdown
    csvRows.push(["CATEGORY BREAKDOWN (EXPENSES)"].join(","));
    csvRows.push(["Category", "Amount (USD)", "Percentage"].join(","));
    donutData.forEach((cat) => {
      const percentage = ((cat.value / totalExpenses) * 100).toFixed(1);
      csvRows.push([cat.category, cat.value.toFixed(2), `${percentage}%`].join(","));
    });
    
    csvRows.push([]);
    
    // Add monthly breakdown
    csvRows.push(["MONTHLY BREAKDOWN"].join(","));
    csvRows.push(["Month", "Income (USD)", "Expenses (USD)", "Net (USD)"].join(","));
    
    const monthlyMap = {};
    transactions.forEach((tx) => {
      const month = tx.date.slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expense: 0 };
      if (tx.type === "income") monthlyMap[month].income += tx.amount;
      else monthlyMap[month].expense += tx.amount;
    });
    
    Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, data]) => {
        const net = data.income - data.expense;
        csvRows.push([month, data.income.toFixed(2), data.expense.toFixed(2), net.toFixed(2)].join(","));
      });
    
    // Create and download CSV file
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `my_finances_export_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    const { description, amount, type, category, date } = form;
    if (!description.trim()) return setFormError("Description required");
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return setFormError("Enter a valid amount > 0");
    if (!date) return setFormError("Date required");

    setTransactions((prev) => [
      ...prev,
      { id: uid(), description: description.trim(), amount: parseFloat(parseFloat(amount).toFixed(2)), type, category, date },
    ]);
    setForm((f) => ({ ...f, description: "", amount: "" }));
    setFormError("");
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 1800);
  };

  const handleDelete = (id) => setTransactions((prev) => prev.filter((tx) => tx.id !== id));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace", letterSpacing: "-0.02em" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
        rel="stylesheet"
      />

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
        {/* Header - Centered with only MY FINANCES */}
        <div className="flex flex-col items-center justify-center border-b-2 border-zinc-900 pb-6">
          <div className="text-center">
            <h1 className="text-6xl font-bold tracking-tighter uppercase">MY FINANCES</h1>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <p className="text-xs text-zinc-600 tabular-nums font-bold">
              {transactions.length} TRANSACTION{transactions.length !== 1 ? "S" : ""}
            </p>
            {/* Export Button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-1.5 border-2 border-zinc-700 rounded-none hover:border-zinc-500 transition-all hover:bg-zinc-900 text-xs font-bold uppercase tracking-wide"
            >
              <Download className="w-3.5 h-3.5" />
              {exportSuccess ? "EXPORTED!" : "EXPORT CSV"}
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* LEFT COLUMN: Add Transaction Form */}
          <div className="w-80 flex-shrink-0">
            <div className="border-2 border-zinc-900 rounded-none sticky top-10">
              <div className="px-5 pt-5 pb-3 border-b-2 border-zinc-900 flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-zinc-500" />
                <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-bold">ADD TRANSACTION</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex rounded-none overflow-hidden border-2 border-zinc-800 w-full text-xs">
                  {["expense", "income"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 py-2 transition-colors capitalize tracking-wider font-bold ${
                        form.type === t ? "bg-white text-black" : "text-zinc-600 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <input
                  placeholder="DESCRIPTION"
                  value={form.description}
                  onChange={(e) => { setForm((f) => ({ ...f, description: e.target.value })); setFormError(""); }}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-none px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition uppercase tracking-wide"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="AMOUNT"
                  value={form.amount}
                  onChange={(e) => { setForm((f) => ({ ...f, amount: e.target.value })); setFormError(""); }}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-none px-3 py-2 text-sm text-white placeholder-zinc-700 focus:outline-none focus:border-zinc-600 transition uppercase tracking-wide"
                />
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-none px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition appearance-none cursor-pointer uppercase tracking-wide"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-600 pointer-events-none" />
                </div>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full bg-zinc-950 border-2 border-zinc-800 rounded-none px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-600 transition [color-scheme:dark] uppercase tracking-wide"
                />

                <button
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-bold tracking-wider px-5 py-2 rounded-none hover:bg-zinc-200 active:scale-[0.98] transition-all uppercase"
                >
                  {formSuccess ? <><Check className="w-3.5 h-3.5" /> SAVED</> : <><Plus className="w-3.5 h-3.5" /> ADD</>}
                </button>
                {formError && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1 uppercase tracking-wide">
                    <X className="w-3 h-3" /> {formError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: KPIs + Charts + Transactions */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-4">
              <KPICard label="BALANCE" value={fmt(balance)} sub={balance >= 0 ? "SURPLUS" : "DEFICIT"} positive={balance >= 0} spark={balanceOverTime} balance={balance} />
              <KPICard label="INCOME" value={fmt(totalIncome)} sub={`${transactions.filter((t) => t.type === "income").length} ENTRIES`} positive={true} spark={null} balance={balance} />
              <KPICard label="EXPENSES" value={fmt(totalExpenses)} sub={totalIncome > 0 ? `${Math.round((totalExpenses / totalIncome) * 100)}% OF INCOME` : "—"} positive={false} spark={null} balance={balance} />
            </div>

            {/* Original 4 Charts - 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-4">
              {/* Chart 1: By Category */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-3.5 h-3.5 text-fuchsia-500" />
                  <p className="text-[10px] text-fuchsia-400 uppercase tracking-[0.2em] font-bold">SPENDING BY CATEGORY</p>
                </div>
                <HorizontalBars data={categoryBreakdown} />
              </div>

              {/* Chart 2: Monthly */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                  <p className="text-[10px] text-emerald-400 uppercase tracking-[0.2em] font-bold">INCOME VS EXPENSES PER MONTH</p>
                </div>
                <div className="flex gap-3 mb-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                    <span className="w-2 h-2 bg-emerald-500 rounded-none" /> INCOME
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-wide">
                    <span className="w-2 h-2 bg-rose-500 rounded-none" /> EXPENSES
                  </span>
                </div>
                <GroupedBars data={monthlyData} height={110} />
              </div>

              {/* Chart 3: Distribution */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[10px] text-amber-400 uppercase tracking-[0.2em] font-bold">EXPENSE DISTRIBUTION</p>
                </div>
                <DonutChart segments={donutData} size={120} />
              </div>

              {/* Chart 4: Net Balance */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-3.5 h-3.5 text-cyan-500" />
                  <p className="text-[10px] text-cyan-400 uppercase tracking-[0.2em] font-bold">RUNNING NET BALANCE OVER TIME</p>
                </div>
                {balanceOverTime.length >= 2 ? (
                  <div className="relative w-full overflow-hidden">
                    <div className="w-full">
                      <Sparkline points={balanceOverTime} width={450} height={80} color={balance >= 0 ? "#10b981" : "#ef4444"} />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-700 mt-3 font-bold uppercase tracking-wide">
                      <span>EARLIEST</span>
                      <span>LATEST → {fmt(balance)}</span>
                    </div>
                  </div>
                ) : (
                  <EmptyChart label="NEED 2+ TRANSACTIONS TO DRAW A LINE" />
                )}
              </div>
            </div>

            {/* NEW CHARTS ROW - Forecast + Radar (side by side) */}
            <div className="grid grid-cols-2 gap-4">
              {/* Chart 5: Forecast Line */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUpIcon className="w-3.5 h-3.5 text-blue-500" />
                  <p className="text-[10px] text-blue-400 uppercase tracking-[0.2em] font-bold">BALANCE FORECAST (3 MONTHS)</p>
                </div>
                {forecastData.historical.length >= 3 ? (
                  <ForecastChart 
                    historical={forecastData.historical} 
                    predicted={forecastData.predicted}
                    width={450}
                    height={120}
                  />
                ) : (
                  <EmptyChart label="NEED 3+ MONTHS OF DATA FOR FORECAST" />
                )}
                {forecastData.predicted.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-zinc-800 text-[9px] text-zinc-500 uppercase tracking-wide">
                    PREDICTED BALANCE IN 3 MONTHS: {fmt(forecastData.predicted[2]?.value || 0)}
                  </div>
                )}
              </div>

              {/* Chart 6: Radar Chart - Expense Categories Only (Salary excluded) */}
              <div className="border-2 border-zinc-900 rounded-none p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Radar className="w-3.5 h-3.5 text-purple-500" />
                  <p className="text-[10px] text-purple-400 uppercase tracking-[0.2em] font-bold">CATEGORY SPENDING RADAR</p>
                </div>
                <RadarChart 
                  categories={radarData.categories} 
                  values={radarData.values}
                  size={200}
                />
              </div>
            </div>

            {/* Transactions List */}
            <div className="border-2 border-zinc-900 rounded-none">
              <div className="px-5 py-3 border-b-2 border-zinc-900 flex flex-wrap items-center gap-3">
                <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase mr-2 font-bold">TRANSACTIONS</p>

                <div className="flex rounded-none overflow-hidden border-2 border-zinc-800 text-[10px]">
                  {["All", "Income", "Expense"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`px-3 py-1.5 tracking-wider transition-colors border-r-2 border-zinc-800 last:border-0 font-bold uppercase ${
                        filterType === t ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-zinc-950 border-2 border-zinc-800 rounded-none px-3 py-1.5 text-[10px] tracking-wider text-zinc-400 focus:outline-none appearance-none pr-6 cursor-pointer font-bold uppercase"
                  >
                    <option value="All">ALL CATEGORIES</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-zinc-600 pointer-events-none" />
                </div>

                <span className="ml-auto text-[10px] text-zinc-700 tabular-nums font-bold">
                  {visible.length}/{transactions.length}
                </span>
              </div>

              {transactions.length === 0 && (
                <div className="py-16 text-center space-y-2">
                  <p className="text-zinc-600 text-sm uppercase tracking-wide font-bold">NO TRANSACTIONS YET.</p>
                  <p className="text-zinc-800 text-xs uppercase tracking-wide">USE THE FORM ON THE LEFT TO ADD YOUR FIRST ENTRY.</p>
                </div>
              )}

              {visible.length > 0 && (
                <ul>
                  {visible.map((tx, i) => (
                    <TransactionRow 
                      key={tx.id} 
                      transaction={tx} 
                      onDelete={handleDelete} 
                      isLast={i === visible.length - 1} 
                    />
                  ))}
                </ul>
              )}

              {visible.length === 0 && transactions.length > 0 && (
                <div className="py-10 text-center text-zinc-700 text-xs uppercase tracking-wide font-bold">NO TRANSACTIONS MATCH YOUR FILTERS.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}