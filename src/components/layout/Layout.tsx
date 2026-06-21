import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/invoices': 'Invoices',
  '/invoices/new': 'Create Invoice',
  '/quotations': 'Quotations',
  '/quotations/new': 'Create Quotation',
  '/purchase-orders': 'Purchase Order',
  '/purchase-orders/new': 'Create Purchase Order',
  '/incoming-purchase-orders': 'Incoming Purchase Order',
  '/delivery-challans': 'Delivery Challans',
  '/delivery-challans/new': 'Create Delivery Challan',
  '/settings': 'Company Settings',
  '/about-license': 'About & License',
}

export default function Layout() {
  const location = useLocation()
  const title = pageTitles[location.pathname] || ''

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
