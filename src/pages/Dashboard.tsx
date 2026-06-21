import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, FileText, Receipt, Users, Package, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useProductStore } from '@/store/useProductStore'
import { useQuotationStore } from '@/store/useQuotationStore'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'
import { formatDate } from '@/lib/utils'

function formatCompact(amount: number): string {
  return '₹' + Math.round(amount).toLocaleString('en-IN')
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return Math.round(((curr - prev) / prev) * 1000) / 10
}

function inMonth(dateStr: string, year: number, month: number): boolean {
  const d = new Date(dateStr)
  return d.getFullYear() === year && d.getMonth() === month
}

const STATUS_PILL: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}

export default function Dashboard() {
  const { invoices } = useInvoiceStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()
  const { quotations } = useQuotationStore()
  const { purchaseOrders } = usePurchaseOrderStore()

  const now = new Date()
  const curY = now.getFullYear(), curM = now.getMonth()
  const prevDate = new Date(curY, curM - 1, 1)
  const prevY = prevDate.getFullYear(), prevM = prevDate.getMonth()

  const thisMonthInvoices = invoices.filter(i => inMonth(i.date, curY, curM))
  const lastMonthInvoices = invoices.filter(i => inMonth(i.date, prevY, prevM))

  const totalSales = invoices.reduce((s, i) => s + i.grandTotal, 0)
  const totalSalesThisMonth = thisMonthInvoices.reduce((s, i) => s + i.grandTotal, 0)
  const totalSalesLastMonth = lastMonthInvoices.reduce((s, i) => s + i.grandTotal, 0)

  const paidAmount = invoices.reduce((s, i) => s + i.paidAmount, 0)
  const paidThisMonth = thisMonthInvoices.reduce((s, i) => s + i.paidAmount, 0)
  const paidLastMonth = lastMonthInvoices.reduce((s, i) => s + i.paidAmount, 0)

  const dueAmount = totalSales - paidAmount
  const dueThisMonth = thisMonthInvoices.reduce((s, i) => s + (i.grandTotal - i.paidAmount), 0)
  const dueLastMonth = lastMonthInvoices.reduce((s, i) => s + (i.grandTotal - i.paidAmount), 0)

  const totalInvoices = invoices.length

  const stats = [
    { label: 'Total Sales', value: formatCompact(totalSales), change: pctChange(totalSalesThisMonth, totalSalesLastMonth) },
    { label: 'Paid Amount', value: formatCompact(paidAmount), change: pctChange(paidThisMonth, paidLastMonth) },
    { label: 'Due Amount', value: formatCompact(dueAmount), change: pctChange(dueThisMonth, dueLastMonth), inverse: true },
    { label: 'Total Invoices', value: totalInvoices.toLocaleString('en-IN'), change: pctChange(thisMonthInvoices.length, lastMonthInvoices.length), icon: true },
  ]

  // 5 weekly buckets for "Sales Overview" — current month vs previous month, aligned by week index.
  const weekBuckets = [1, 8, 15, 22, 29]
  const salesOverview = weekBuckets.map(startDay => {
    const inBucket = (d: Date, y: number, m: number) =>
      d.getFullYear() === y && d.getMonth() === m && d.getDate() >= startDay && d.getDate() < startDay + 7
    const sales = invoices.filter(i => inBucket(new Date(i.date), curY, curM)).reduce((s, i) => s + i.grandTotal, 0)
    const prevSales = invoices.filter(i => inBucket(new Date(i.date), prevY, prevM)).reduce((s, i) => s + i.grandTotal, 0)
    return { label: `${String(startDay).padStart(2, '0')} ${now.toLocaleString('en-US', { month: 'short' })}`, sales, prevSales }
  })

  // Invoices by status
  const paidCount = invoices.filter(i => i.status === 'paid').length
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const pendingCount = Math.max(totalInvoices - paidCount - overdueCount, 0)
  const statusData = [
    { name: 'Paid', value: paidCount, color: '#22c55e' },
    { name: 'Pending', value: pendingCount, color: '#f59e0b' },
    { name: 'Overdue', value: overdueCount, color: '#ef4444' },
  ]

  const recentInvoices = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  // Top customers by total invoiced amount
  const customerTotals = new Map<string, number>()
  invoices.forEach(i => customerTotals.set(i.customerId, (customerTotals.get(i.customerId) || 0) + i.grandTotal))
  const topCustomers = [...customerTotals.entries()]
    .map(([customerId, total]) => ({ customer: customers.find(c => c.id === customerId), total }))
    .filter(c => c.customer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  // Cash flow — weekly buckets this month: cash in (collected) vs cash out (purchase orders)
  const cashFlow = weekBuckets.map(startDay => {
    const inBucket = (d: Date) => d.getFullYear() === curY && d.getMonth() === curM && d.getDate() >= startDay && d.getDate() < startDay + 7
    const cashIn = invoices.filter(i => inBucket(new Date(i.date))).reduce((s, i) => s + i.paidAmount, 0)
    const cashOut = purchaseOrders.filter(p => inBucket(new Date(p.date))).reduce((s, p) => s + p.grandTotal, 0)
    return { label: String(startDay).padStart(2, '0'), cashIn, cashOut }
  })
  const cashInTotal = cashFlow.reduce((s, c) => s + c.cashIn, 0)
  const cashOutTotal = cashFlow.reduce((s, c) => s + c.cashOut, 0)

  const snapshot = [
    { label: 'Total Customers', count: customers.length, icon: Users,
      change: pctChange(customers.filter(c => inMonth(c.createdAt, curY, curM)).length, customers.filter(c => inMonth(c.createdAt, prevY, prevM)).length) },
    { label: 'Total Products', count: products.length, icon: Package,
      change: pctChange(products.filter(p => inMonth(p.createdAt, curY, curM)).length, products.filter(p => inMonth(p.createdAt, prevY, prevM)).length) },
    { label: 'Total Quotations', count: quotations.length, icon: FileText,
      change: pctChange(quotations.filter(q => inMonth(q.createdAt, curY, curM)).length, quotations.filter(q => inMonth(q.createdAt, prevY, prevM)).length) },
    { label: 'Total Purchase Orders', count: purchaseOrders.length, icon: Receipt,
      change: pctChange(purchaseOrders.filter(p => inMonth(p.createdAt, curY, curM)).length, purchaseOrders.filter(p => inMonth(p.createdAt, prevY, prevM)).length) },
  ]

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => {
          const positive = s.inverse ? s.change <= 0 : s.change >= 0
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                {s.icon && <FileText className="w-4 h-4 text-brand-400" />}
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p>
              <div className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${positive ? 'text-green-600' : 'text-red-500'}`}>
                {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {Math.abs(s.change)}% <span className="text-gray-400 font-normal">from last month</span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sales Overview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">Sales Overview</h3>
            <span className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1">This Month</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={salesOverview}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v / 100000}L`} />
              <Tooltip formatter={(v: number) => formatCompact(v)} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" name="Sales" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} />
              <Line type="monotone" dataKey="prevSales" name="Previous Month" stroke="#cbd5e1" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All</Link>
          </div>
          {recentInvoices.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No invoices yet.</p>
          ) : (
            <div className="space-y-1">
              {recentInvoices.map(inv => {
                const pillKey = inv.status === 'paid' ? 'paid' : inv.status === 'overdue' ? 'overdue' : 'pending'
                return (
                  <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between py-2 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-semibold text-brand-700">{inv.number}</p>
                      <p className="text-xs text-gray-500">{inv.customerName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-800">{formatCompact(inv.grandTotal)}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold capitalize ${STATUS_PILL[pillKey]}`}>{pillKey}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Invoices by Status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-3">Invoices by Status</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" innerRadius={38} outerRadius={58} paddingAngle={2}>
                    {statusData.map(d => <Cell key={d.name} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-lg font-bold text-gray-900">{totalInvoices.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {statusData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600">{d.name}</span>
                  <span className="text-gray-400 text-xs">{d.value} ({totalInvoices ? Math.round((d.value / totalInvoices) * 1000) / 10 : 0}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800">Top Customers</h3>
            <Link to="/customers" className="text-xs font-semibold text-brand-600 hover:text-brand-700">View All</Link>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No customer activity yet.</p>
          ) : (
            <div className="space-y-1">
              {topCustomers.map(({ customer, total }) => {
                const initials = (customer!.name || '').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
                return (
                  <Link key={customer!.id} to="/customers" className="flex items-center gap-3 py-2 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{initials}</div>
                    <span className="text-sm text-gray-700 flex-1 truncate">{customer!.name}</span>
                    <span className="text-sm font-bold text-gray-800">{formatCompact(total)}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Cash Flow */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-800">Cash Flow</h3>
            <span className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1">This Month</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-3 text-center">
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Cash In</p>
              <p className="text-sm font-bold text-green-600">{formatCompact(cashInTotal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Cash Out</p>
              <p className="text-sm font-bold text-red-500">{formatCompact(cashOutTotal)}</p>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase">Net Flow</p>
              <p className="text-sm font-bold text-gray-800">{formatCompact(cashInTotal - cashOutTotal)}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCompact(v)} />
              <Bar dataKey="cashIn" name="Cash In" fill="#86efac" radius={[3, 3, 0, 0]} />
              <Bar dataKey="cashOut" name="Cash Out" fill="#fca5a5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Business Snapshot */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Business Snapshot</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {snapshot.map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-lg font-bold text-gray-900">{s.count.toLocaleString('en-IN')}</p>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${s.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {s.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(s.change)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">Last updated {formatDate(now.toISOString())}</p>
    </div>
  )
}
