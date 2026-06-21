import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  FileCheck,
  ShoppingCart,
  Settings,
  ChevronLeft,
  ChevronRight,
  Receipt,
  MapPin,
  LogOut,
  Truck,
  Crown,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useLicenseStore } from '@/store/useLicenseStore'
import { daysUntil } from '@/lib/license'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/quotations', label: 'Quotations', icon: FileCheck },
  { to: '/purchase-orders', label: 'Purchase Order', icon: ShoppingCart },
  { to: '/incoming-purchase-orders', label: 'Incoming Purchase Order', icon: Package },
  { to: '/delivery-challans', label: 'Delivery Challans', icon: Truck },
  { to: '/shipping-addresses', label: 'Ship Addresses', icon: MapPin },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuthStore()
  const license = useLicenseStore()
  const daysLeft = license.expiresAt ? daysUntil(license.expiresAt) : null

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-brand-900 text-white transition-all duration-300 relative shadow-2xl',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5', collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={invobukLogoShort} alt="Invobuk" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <span className="font-extrabold text-xl tracking-tight text-white">Invo<span className="text-amber-400">buk</span></span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center px-2' : '',
                isActive
                  ? 'bg-white text-brand-900 shadow-md'
                  : 'text-brand-200 hover:bg-white/10 hover:text-white'
              )
            }
            title={collapsed ? label : ''}
          >
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-900 hover:bg-brand-500 transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>

      {/* License / Lock+Logout / Help */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-3">
          {license.isActivated && (
            <div className="bg-brand-800/70 border border-brand-700/60 rounded-2xl p-4">
              <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center mb-2.5">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm font-semibold text-white">{license.customerName}</p>
              <p className="text-xs text-brand-300 mt-0.5">
                {daysLeft !== null && daysLeft >= 0 ? `License active · ${daysLeft}d left` : 'License active'}
              </p>
            </div>
          )}

          <div className="bg-brand-800/70 border border-brand-700/60 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <HelpCircle className="w-4 h-4 text-brand-300" />
              <p className="text-sm font-semibold text-white">Need Help?</p>
            </div>
            <a href="mailto:contact@nesved.com" className="text-xs text-brand-300 hover:text-white transition-colors">Contact NesVed support</a>
          </div>

          <button
            onClick={logout}
            title="Lock / Logout"
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white transition-all duration-150"
          >
            <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
            <span>Lock / Logout</span>
          </button>
        </div>
      )}
      {collapsed && (
        <div className="px-2 pb-3 flex justify-center">
          <button onClick={logout} title="Lock / Logout" className="p-2.5 rounded-xl text-brand-200 hover:bg-white/10 hover:text-white transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}
    </aside>
  )
}
