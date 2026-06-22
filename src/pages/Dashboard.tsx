import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, FileText, Receipt, Users, Package, ChevronRight } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useProductStore } from '@/store/useProductStore'
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

export default function Dashboard() {
  const { invoices } = useInvoiceStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()
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

  const totalInvoices = invoices.length

  const stats = [
    { label: 'Total Sales', value: formatCompact(totalSales), change: pctChange(totalSalesThisMonth, totalSalesLastMonth), icon: Receipt },
    { label: 'Total Invoices', value: totalInvoices.toLocaleString('en-IN'), change: pctChange(thisMonthInvoices.length, lastMonthInvoices.length), icon: FileText },
    { label: 'Total Customers', value: customers.length.toLocaleString('en-IN'), icon: Users,
      change: pctChange(customers.filter(c => inMonth(c.createdAt, curY, curM)).length, customers.filter(c => inMonth(c.createdAt, prevY, prevM)).length) },
    { label: 'Total Products', value: products.length.toLocaleString('en-IN'), icon: Package,
      change: pctChange(products.filter(p => inMonth(p.createdAt, curY, curM)).length, products.filter(p => inMonth(p.createdAt, prevY, prevM)).length) },
    { label: 'Total Purchase Orders', value: purchaseOrders.length.toLocaleString('en-IN'), icon: Receipt,
      change: pctChange(purchaseOrders.filter(p => inMonth(p.createdAt, curY, curM)).length, purchaseOrders.filter(p => inMonth(p.createdAt, prevY, prevM)).length) },
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

  const recentInvoices = [...invoices].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)

  // Top customers by total invoiced amount
  const customerTotals = new Map<string, number>()
  invoices.forEach(i => customerTotals.set(i.customerId, (customerTotals.get(i.customerId) || 0) + i.grandTotal))
  const topCustomers = [...customerTotals.entries()]
    .map(([customerId, total]) => ({ customer: customers.find(c => c.id === customerId), total }))
    .filter(c => c.customer)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map(s => {
          const positive = s.change >= 0
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
                <s.icon className="w-4 h-4 text-brand-400" />
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
              {recentInvoices.map(inv => (
                <Link key={inv.id} to={`/invoices/${inv.id}`} className="flex items-center justify-between py-2 -mx-2 px-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-brand-700">{inv.number}</p>
                    <p className="text-xs text-gray-500">{inv.customerName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-gray-800">{formatCompact(inv.grandTotal)}</p>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
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


      <p className="text-xs text-gray-400 text-center">Last updated {formatDate(now.toISOString())}</p>
    </div>
  )
}
