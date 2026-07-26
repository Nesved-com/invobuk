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
  Truck,
  ShieldCheck,
  UserCircle,
  Building2,
  FolderOutput,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import invobukLogoShort from '@/assets/invobuk-logo-short.png'

const operationsItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/quotations', label: 'Quotations', icon: FileCheck },
  { to: '/purchase-orders', label: 'Purchase Order', icon: ShoppingCart },
  { to: '/incoming-purchase-orders', label: 'Incoming Purchase Order', icon: Package },
  { to: '/monthly-export', label: 'Monthly Export for CA', icon: FolderOutput },
  { to: '/delivery-challans', label: 'Delivery Challans', icon: Truck },
  { to: '/shipping-addresses', label: 'Ship Addresses', icon: MapPin },
]

const settingsItems = [
  { to: '/profile', label: 'Profile', icon: UserCircle },
  { to: '/company-info', label: 'Company Info', icon: Building2 },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/about-license', label: 'About & License', icon: ShieldCheck },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex items-center gap-[11px] px-3 py-[9px] rounded-[10px] text-[13.5px] font-semibold transition-colors duration-150',
      collapsed && 'justify-center px-2',
      isActive ? 'text-[#4FD6A0]' : 'text-[#8FA79D] hover:text-[#E4EFE9] hover:bg-white/[0.06]'
    )

  const linkStyle = (isActive: boolean): React.CSSProperties =>
    isActive
      ? { background: '#16A57018', boxShadow: 'inset 0 0 0 1px #19A26A33' }
      : {}

  const sectionLabelCls = 'px-3 pt-4 pb-1.5 text-[10.5px] font-bold tracking-[0.12em] text-[#5F7A70] uppercase'

  const renderItem = ({ to, label, icon: Icon }: typeof operationsItems[number]) => (
    <NavLink key={to} to={to} end={to === '/'} className={linkCls} style={({ isActive }) => linkStyle(isActive)} title={collapsed ? label : ''}>
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="w-[3px] h-4 rounded-[2px] bg-[#28C384] -ml-1 flex-shrink-0" />
          )}
          <Icon className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </>
      )}
    </NavLink>
  )

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-brand-900 text-white transition-all duration-300 relative',
        collapsed ? 'w-16' : 'w-[236px]'
      )}
      style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.04)' }}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-3 pt-5 pb-[22px]', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src={invobukLogoShort} alt="Invobuk" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <span className="text-[17px] font-extrabold tracking-[-0.4px] text-[#F4FAF7]">Invobuk</span>
        )}
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 px-[10px] overflow-y-auto', collapsed && 'px-2')}>
        {!collapsed && <div className={sectionLabelCls}>Operations</div>}
        <div className="flex flex-col gap-0.5">
          {operationsItems.map(renderItem)}
        </div>

        <div className="h-px my-3 mx-3" style={{ background: '#FFFFFF14' }} />

        {!collapsed && <div className={sectionLabelCls}>Settings</div>}
        <div className="flex flex-col gap-0.5 pb-3">
          {settingsItems.map(renderItem)}
        </div>
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-900 z-10 hover:bg-brand-500 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-white" /> : <ChevronLeft className="w-3 h-3 text-white" />}
      </button>
    </aside>
  )
}
