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
  ShieldCheck,
  UserCircle,
  Building2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
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
  { to: '/profile', label: 'Profile', icon: UserCircle },
  { to: '/company-info', label: 'Company Info', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { logout } = useAuthStore()

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

      {/* About & License / Lock+Logout */}
      <div className={cn('px-2.5 pb-3 pt-2 space-y-1 border-t border-brand-800', collapsed && 'px-2')}>
        <NavLink
          to="/about-license"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              collapsed ? 'justify-center px-2' : '',
              isActive ? 'bg-white text-brand-900 shadow-md' : 'text-brand-200 hover:bg-white/10 hover:text-white'
            )
          }
          title={collapsed ? 'About & License' : ''}
        >
          <ShieldCheck className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>About & License</span>}
        </NavLink>

        <button
          onClick={logout}
          title="Lock / Logout"
          className={cn(
            'flex items-center gap-3 w-full px-2.5 py-2.5 rounded-xl text-sm font-medium text-brand-200 hover:bg-white/10 hover:text-white transition-all duration-150',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Lock / Logout</span>}
        </button>
      </div>
    </aside>
  )
}
