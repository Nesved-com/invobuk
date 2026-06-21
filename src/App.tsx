import { useEffect } from 'react'
import { HashRouter as BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './store/useAuthStore'
import { useLicenseStore } from './store/useLicenseStore'
import { useInvoiceStore } from './store/useInvoiceStore'
import { useQuotationStore } from './store/useQuotationStore'
import { usePurchaseOrderStore } from './store/usePurchaseOrderStore'
import { useSupplierPOStore } from './store/useSupplierPOStore'
import { useDeliveryChallanStore } from './store/useDeliveryChallanStore'
import { activateLicense, daysUntil } from './lib/license'
import { ConfirmDialogProvider } from './components/ui/confirm-dialog'
import LicenseActivation from './pages/LicenseActivation'
import Login from './pages/Login'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Invoices from './pages/Invoices'
import InvoiceCreate from './pages/InvoiceCreate'
import InvoiceView from './pages/InvoiceView'
import InvoiceEdit from './pages/InvoiceEdit'
import InvoiceFromPO from './pages/InvoiceFromPO'
import Quotations from './pages/Quotations'
import QuotationCreate from './pages/QuotationCreate'
import QuotationView from './pages/QuotationView'
import QuotationEdit from './pages/QuotationEdit'
import PurchaseOrders from './pages/PurchaseOrders'
import PurchaseOrderCreate from './pages/PurchaseOrderCreate'
import PurchaseOrderView from './pages/PurchaseOrderView'
import PurchaseOrderEdit from './pages/PurchaseOrderEdit'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import CompanyInfo from './pages/CompanyInfo'
import AboutLicense from './pages/AboutLicense'
import ShippingAddresses from './pages/ShippingAddresses'
import SupplierPurchaseOrders from './pages/SupplierPurchaseOrders'
import DeliveryChallans from './pages/DeliveryChallans'
import DeliveryChallanForm from './pages/DeliveryChallanForm'

export default function App() {
  const { isLoggedIn } = useAuthStore()
  const license = useLicenseStore()
  const invoicesLoaded = useInvoiceStore((s) => s.loaded)
  const quotationsLoaded = useQuotationStore((s) => s.loaded)
  const purchaseOrdersLoaded = usePurchaseOrderStore((s) => s.loaded)
  const supplierPOsLoaded = useSupplierPOStore((s) => s.loaded)
  const challansLoaded = useDeliveryChallanStore((s) => s.loaded)
  const allDataLoaded = invoicesLoaded && quotationsLoaded && purchaseOrdersLoaded && supplierPOsLoaded && challansLoaded

  useEffect(() => {
    if (!isLoggedIn) return
    useInvoiceStore.getState().init()
    useQuotationStore.getState().init()
    usePurchaseOrderStore.getState().init()
    useSupplierPOStore.getState().init()
    useDeliveryChallanStore.getState().init()
  }, [isLoggedIn])

  // Hard local check: a previously-valid key may have simply lapsed since activation.
  useEffect(() => {
    if (license.isActivated && license.expiresAt && daysUntil(license.expiresAt) < 0) {
      license.deactivate()
    }
  }, [license.isActivated, license.expiresAt])

  // Re-verify with the license server once a day (when online) — picks up revocations
  // or expiry changes without requiring re-activation. Silently skipped if offline,
  // so the app still works without an internet connection between checks.
  useEffect(() => {
    if (!license.isActivated || !license.licenseKey) return
    const lastVerified = license.lastVerifiedAt ? new Date(license.lastVerifiedAt).getTime() : 0
    if (Date.now() - lastVerified < 24 * 60 * 60 * 1000) return

    activateLicense(license.licenseKey).then(result => {
      if (result.valid && result.expiresAt) {
        license.touchVerified(result.expiresAt)
      } else if (result.reason && !result.reason.includes('reach the license server')) {
        // Server explicitly rejected it (revoked / not found / expired elsewhere) — lock the app.
        license.deactivate()
      }
    })
  }, [license.isActivated, license.licenseKey, license.lastVerifiedAt])

  if (!license.isActivated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LicenseActivation />
      </>
    )
  }

  if (!isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <Login />
      </>
    )
  }

  if (!allDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Toaster position="top-right" richColors />
      </div>
    )
  }

  return (
    <ConfirmDialogProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<InvoiceCreate />} />
            <Route path="/invoices/new/from-po" element={<InvoiceFromPO />} />
            <Route path="/invoices/:id" element={<InvoiceView />} />
            <Route path="/invoices/:id/edit" element={<InvoiceEdit />} />
            <Route path="/quotations" element={<Quotations />} />
            <Route path="/quotations/new" element={<QuotationCreate />} />
            <Route path="/quotations/:id" element={<QuotationView />} />
            <Route path="/quotations/:id/edit" element={<QuotationEdit />} />
            <Route path="/purchase-orders" element={<PurchaseOrders />} />
            <Route path="/purchase-orders/new" element={<PurchaseOrderCreate />} />
            <Route path="/purchase-orders/:id" element={<PurchaseOrderView />} />
            <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderEdit />} />
            <Route path="/incoming-purchase-orders" element={<SupplierPurchaseOrders />} />
            <Route path="/delivery-challans" element={<DeliveryChallans />} />
            <Route path="/delivery-challans/new" element={<DeliveryChallanForm />} />
            <Route path="/delivery-challans/:id/edit" element={<DeliveryChallanForm />} />
            <Route path="/shipping-addresses" element={<ShippingAddresses />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/company-info" element={<CompanyInfo />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/about-license" element={<AboutLicense />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfirmDialogProvider>
  )
}
