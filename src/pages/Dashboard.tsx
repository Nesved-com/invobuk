import { Link } from 'react-router-dom'
import { Users, Package, FileText, Receipt, ShoppingCart, ArrowUpRight, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { useInvoiceStore } from '@/store/useInvoiceStore'
import { useCustomerStore } from '@/store/useCustomerStore'
import { useProductStore } from '@/store/useProductStore'
import { useQuotationStore } from '@/store/useQuotationStore'
import { usePurchaseOrderStore } from '@/store/usePurchaseOrderStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/shared/StatusBadge'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function Dashboard() {
  const { invoices } = useInvoiceStore()
  const { customers } = useCustomerStore()
  const { products } = useProductStore()
  const { quotations } = useQuotationStore()
  const { purchaseOrders } = usePurchaseOrderStore()

  const totalRevenue = invoices.reduce((sum, i) => sum + i.grandTotal, 0)

  const revenueByMonth = months.map((month, idx) => ({
    month,
    revenue: invoices
      .filter(i => new Date(i.date).getMonth() === idx)
      .reduce((sum, i) => sum + i.grandTotal, 0),
    invoices: invoices.filter(i => new Date(i.date).getMonth() === idx).length,
  }))

  const stats = [
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', change: '+12%' },
    { label: 'Total Invoices', value: invoices.length.toString(), icon: Receipt, color: 'bg-brand-500', bg: 'bg-brand-50', text: 'text-brand-700', change: '' },
    { label: 'Customers', value: customers.length.toString(), icon: Users, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', change: '' },
  ]

  const recentInvoices = invoices.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{s.value}</p>
                {s.change && <span className="text-xs text-emerald-600 font-medium">{s.change} this month</span>}
              </div>
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon className={`w-5 h-5 ${s.text}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/invoices/new', label: 'New Invoice', icon: Receipt, color: 'bg-brand-600 hover:bg-brand-700' },
          { to: '/quotations/new', label: 'New Quotation', icon: FileText, color: 'bg-purple-600 hover:bg-purple-700' },
          { to: '/purchase-orders/new', label: 'New PO', icon: ShoppingCart, color: 'bg-amber-500 hover:bg-amber-600' },
        ].map(item => (
          <Link key={item.to} to={item.to} className={`${item.color} text-white rounded-2xl p-4 flex items-center gap-3 transition-colors shadow-lg`}>
            <item.icon className="w-5 h-5" />
            <span className="font-semibold text-sm">{item.label}</span>
            <ArrowUpRight className="w-4 h-4 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">Invoice Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="invoices" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Products', count: products.length, to: '/products', icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Quotations', count: quotations.length, to: '/quotations', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Purchase Orders', count: purchaseOrders.length, to: '/purchase-orders', icon: ShoppingCart, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(item => (
          <Link key={item.to} to={item.to} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${item.bg} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{item.count}</p>
              <p className="text-sm text-gray-500">{item.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">Recent Invoices</h3>
          <Link to="/invoices" className="text-sm text-brand-600 hover:text-brand-700 font-medium">View all</Link>
        </div>
        {recentInvoices.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No invoices yet. <Link to="/invoices/new" className="text-brand-600 hover:underline">Create your first invoice</Link></p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Invoice #</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Date</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-brand-700 text-sm">{inv.number}</td>
                  <td className="px-6 py-3 text-sm text-gray-700">{inv.customerName}</td>
                  <td className="px-6 py-3 text-sm text-gray-500">{formatDate(inv.date)}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-right">{formatCurrency(inv.grandTotal)}</td>
                  <td className="px-6 py-3 text-center"><StatusBadge status={inv.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
