import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Users, X, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useCustomerStore } from '@/store/useCustomerStore'
import type { Customer } from '@/types'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/confirm-dialog'

const empty = (): Omit<Customer, 'id' | 'createdAt'> => ({
  name: '', address: '', gstNumber: '', vendorCode: '', state: '', stateCode: '', phone: '',
})

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

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState(empty())
  const confirm = useConfirm()

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.gstNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(empty()); setEditing(null); setShowForm(true) }
  const openEdit = (c: Customer) => {
    setForm({ name: c.name, address: c.address, gstNumber: c.gstNumber, vendorCode: c.vendorCode, state: c.state, stateCode: c.stateCode, phone: c.phone })
    setEditing(c); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Name is required'); return }
    if (editing) { updateCustomer(editing.id, form); toast.success('Customer updated!') }
    else { addCustomer(form); toast.success('Customer added!') }
    setShowForm(false)
  }

  const handleDelete = async (c: Customer) => {
    if (await confirm(`This will permanently delete "${c.name}".`, { title: 'Delete this customer?' })) {
      deleteCustomer(c.id); toast.success('Customer deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">{customers.length} customer{customers.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, GSTIN…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-60" />
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>Add Customer</Button>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>#</Th>
              <Th>Name</Th>
              <Th>Address</Th>
              <Th align="center">GSTIN</Th>
              <Th align="center">Vendor Code</Th>
              <Th align="center">State</Th>
              <Th align="center">Phone</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={8} icon={<Users className="w-10 h-10" />} message="No customers found" />
            ) : filtered.map((c, i) => (
              <Tr key={c.id}>
                <Td muted>{i + 1}</Td>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-brand-600" />
                    </div>
                    <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                  </div>
                </Td>
                <Td className="max-w-[260px]">
                  <p className="text-gray-500 text-xs truncate">{c.address || '—'}</p>
                </Td>
                <Td align="center">
                  {c.gstNumber
                    ? <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{c.gstNumber}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="center">
                  {c.vendorCode
                    ? <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{c.vendorCode}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="center">
                  {c.state
                    ? <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{c.state}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="center" muted>{c.phone || '—'}</Td>
                <Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 text-brand-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Customer' : 'Add Customer'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Input label="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Customer / Company name" />
              <Textarea label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2} placeholder="Full address including city, pincode" />
              <Input label="GSTIN" value={form.gstNumber} onChange={e => setForm(f => ({ ...f, gstNumber: e.target.value.toUpperCase() }))} placeholder="e.g. 27AAECS8719B1ZC" className="font-mono" />
              <Input label="Vendor Code" value={form.vendorCode} onChange={e => setForm(f => ({ ...f, vendorCode: e.target.value }))} placeholder="e.g. VND-001" />
              <SelectField label="State">
                <Select value={form.state} onValueChange={v => { const s = INDIAN_STATES.find(x => x.name === v); setForm(f => ({ ...f, state: v, stateCode: s?.code || '' })) }}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map(s => <SelectItem key={s.code} value={s.name}>{s.name} ({s.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input label="Phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              <div className="flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">{editing ? 'Update' : 'Add Customer'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
