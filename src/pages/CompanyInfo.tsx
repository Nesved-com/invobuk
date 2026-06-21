import { useState } from 'react'
import { Save, Building2, CreditCard, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useCompanyStore } from '@/store/useCompanyStore'
import type { Company } from '@/types'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'

const INDIAN_STATES = [
  { name: 'Andhra Pradesh', code: '37' }, { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Assam', code: '18' }, { name: 'Bihar', code: '10' },
  { name: 'Chhattisgarh', code: '22' }, { name: 'Delhi', code: '07' },
  { name: 'Goa', code: '30' }, { name: 'Gujarat', code: '24' },
  { name: 'Haryana', code: '06' }, { name: 'Himachal Pradesh', code: '02' },
  { name: 'Jammu and Kashmir', code: '01' }, { name: 'Jharkhand', code: '20' },
  { name: 'Karnataka', code: '29' }, { name: 'Kerala', code: '32' },
  { name: 'Ladakh', code: '38' }, { name: 'Madhya Pradesh', code: '23' },
  { name: 'Maharashtra', code: '27' }, { name: 'Manipur', code: '14' },
  { name: 'Meghalaya', code: '17' }, { name: 'Mizoram', code: '15' },
  { name: 'Nagaland', code: '13' }, { name: 'Odisha', code: '21' },
  { name: 'Punjab', code: '03' }, { name: 'Rajasthan', code: '08' },
  { name: 'Sikkim', code: '11' }, { name: 'Tamil Nadu', code: '33' },
  { name: 'Telangana', code: '36' }, { name: 'Tripura', code: '16' },
  { name: 'Uttar Pradesh', code: '09' }, { name: 'Uttarakhand', code: '05' },
  { name: 'West Bengal', code: '19' },
]

export default function CompanyInfo() {
  const { company, setCompany } = useCompanyStore()
  const [form, setForm] = useState<Company>({ ...company })

  const f = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setCompany(form)
    toast.success('Company information saved successfully!')
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Company Info</h1>
        <p className="text-sm text-gray-500 mt-0.5">Business details, tax IDs, bank details and declaration printed on documents</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="flex justify-end">
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />} size="lg">
            Save Company Info
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card title="Company Information" subtitle="Appears on all invoices and documents" accent="brand"
            headerRight={<div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center"><Building2 className="w-4 h-4 text-brand-700" /></div>}>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Company / Business Name *" value={form.name} onChange={f('name')} required placeholder="e.g. Renuka Electronics & Electricals" />
              </div>
              <div className="sm:col-span-2">
                <Input label="Full Address *" value={form.address} onChange={f('address')} required placeholder="Office no., Street, Area, Road" />
              </div>
              <Input label="City" value={form.city} onChange={f('city')} placeholder="Aurangabad" />
              <SelectField label="State">
                <Select value={form.state} onValueChange={v => { const s = INDIAN_STATES.find(x => x.name === v); setForm(p => ({ ...p, state: v, stateCode: s?.code || '' })) }}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input label="State Code" value={form.stateCode} onChange={f('stateCode')} placeholder="27" />
              <Input label="Pincode" value={form.pincode} onChange={f('pincode')} placeholder="431001" />
              <Input label="Phone *" value={form.phone} onChange={f('phone')} required placeholder="+91 98765 43210" />
              <Input label="Email" type="email" value={form.email} onChange={f('email')} placeholder="info@company.com" />
            </CardBody>
          </Card>

          <Card title="GST & Business IDs" subtitle="Appears on invoices and tax documents" accent="amber"
            headerRight={<div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center"><FileText className="w-4 h-4 text-amber-700" /></div>}>
            <CardBody className="grid grid-cols-1 gap-4">
              <Input label="GSTIN / UIN *" value={form.gstNumber} onChange={f('gstNumber')} placeholder="27AZHPK6296Q1ZC" className="font-mono uppercase" hint="15-digit GST number" />
              <Input label="PAN Number" value={form.panNumber} onChange={f('panNumber')} placeholder="AZHPK6296Q" className="font-mono uppercase" />
              <Input label="Vendor ID / Code" value={form.vendorId} onChange={f('vendorId')} placeholder="24013055" />
              <Input label="Default Payment Terms (Days)" type="number" min="0" value={form.defaultPaymentTerms} onChange={f('defaultPaymentTerms')} placeholder="e.g. 30" />
            </CardBody>
          </Card>
        </div>

        <Card title="Bank Details" subtitle="Printed at the bottom of invoices" accent="green"
          headerRight={<div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-700" /></div>}>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input label="Bank Name" value={form.bankName} onChange={f('bankName')} placeholder="State Bank of India" />
            </div>
            <Input label="Account Number" value={form.accountNumber} onChange={f('accountNumber')} className="font-mono" />
            <Input label="IFSC Code" value={form.ifscCode} onChange={f('ifscCode')} className="font-mono uppercase" />
          </CardBody>
        </Card>

        <Card title="Default Declaration" subtitle="Printed at the bottom of invoices">
          <CardBody>
            <Textarea value={form.declaration} onChange={f('declaration')} rows={3} />
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
