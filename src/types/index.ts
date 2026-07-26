export interface Company {
  name: string
  address: string
  city: string
  state: string
  stateCode: string
  pincode: string
  phone: string
  email: string
  gstNumber: string
  panNumber: string
  vendorId: string
  bankName: string
  accountNumber: string
  ifscCode: string
  declaration: string
  defaultPaymentTerms: string
  logo?: string
  invoiceNumberFormat?: string
  quotationNumberFormat?: string
  purchaseOrderNumberFormat?: string
  deliveryChallanNumberFormat?: string
}

export interface Product {
  id: string
  name: string
  description: string
  hsnCode: string
  unit: string
  rate: number
  gstRate: number
  category: string
  createdAt: string
}

export interface Customer {
  id: string
  name: string
  address: string
  gstNumber: string
  vendorCode: string
  state: string
  stateCode: string
  phone: string
  createdAt: string
}

export interface LineItem {
  id: string
  productId?: string
  description: string
  hsnCode: string
  quantity: number
  unit: string
  rate: number
  discount: number
  gstRate: number
  amount: number
  cgst: number
  sgst: number
  igst: number
  total: number
}

export type DocumentStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'cancelled' | 'overdue'
export type GstType = 'intra' | 'inter'

export interface ShipToAddress {
  name: string
  company: string
  address: string
  city: string
  state: string
  stateCode: string
  pincode: string
  gstNumber: string
  phone: string
}

export interface BaseDocument {
  id: string
  number: string
  customerId: string
  customerName: string
  date: string
  dueDate?: string
  poNumber: string
  poDate: string
  vendorCode: string
  dispatchThrough?: string
  destination?: string
  copyType?: string
  sourcePOId?: string
  reverseCharge: boolean
  shipToSame: boolean
  shipTo?: ShipToAddress
  items: LineItem[]
  subtotal: number
  totalDiscount: number
  totalGst: number
  totalCgst: number
  totalSgst: number
  totalIgst: number
  grandTotal: number
  roundOff: number
  gstType: GstType
  notes: string
  terms: string
  paymentTerms: string
  showPaymentTerms?: boolean
  showDueDate?: boolean
  showDiscount?: boolean
  declaration: string
  status: DocumentStatus
  createdAt: string
}

export interface Invoice extends BaseDocument {
  type: 'invoice'
  paidAmount: number
  paidDate?: string
  // Extra invoice fields
  suppliersRef: string
  showSuppliersRef?: boolean
  tcsPercent?: number
  remarks: string
  schemeDiscount?: number
  cashDiscountPercent: number
}

export interface Quotation extends BaseDocument {
  type: 'quotation'
  validUntil: string
  kindAttention: string
  enquirySource: string
  enquiryDate: string
  paidAmount?: number
}

export interface PurchaseOrder extends BaseDocument {
  type: 'purchase-order'
  supplierId?: string
  expectedDelivery?: string
}

export interface DeliveryChallanItem {
  id: string
  description: string
  quantity: number
  unit: string
}

export interface DeliveryChallan {
  id: string
  number: string
  date: string
  customerId: string
  customerName: string
  poNumber: string
  poDate: string
  vendorCode: string
  referenceNote: string
  items: DeliveryChallanItem[]
  preparedBy: string
  createdAt: string
}
