import { useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, X } from 'lucide-react'
import { toast } from 'sonner'
import { useShippingAddressStore, type ShippingAddress } from '@/store/useShippingAddressStore'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu and Kashmir','Ladakh']

const empty = (): Omit<ShippingAddress, 'id' | 'createdAt'> => ({
  name: '', address: '', city: '', state: 'Maharashtra', pincode: '', gstNumber: '', phone: '',
})

export default function ShippingAddresses() {
  const { addresses, addAddress, updateAddress, deleteAddress } = useShippingAddressStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(empty())

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }))

  const openAdd = () => { setForm(empty()); setEditId(null); setShowForm(true) }
  const openEdit = (a: ShippingAddress) => { setForm({ name: a.name, address: a.address, city: a.city, state: a.state, pincode: a.pincode, gstNumber: a.gstNumber, phone: a.phone }); setEditId(a.id); setShowForm(true) }

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (editId) {
      updateAddress(editId, form)
      toast.success('Address updated!')
    } else {
      addAddress(form)
      toast.success('Shipping address added!')
    }
    setShowForm(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Addresses</h1>
          <p className="text-sm text-gray-500 mt-0.5">{addresses.length} address(es) saved</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 shadow-lg shadow-brand-200 transition-colors">
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No shipping addresses yet. Add one to use in invoices.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Name / Label</th>
                  <th className="px-4 py-3 text-left">Address</th>
                  <th className="px-4 py-3 text-left">City</th>
                  <th className="px-4 py-3 text-left">State</th>
                  <th className="px-4 py-3 text-left">Pincode</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">GSTIN</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {addresses.map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-brand-600" />
                        </div>
                        <span className="font-semibold text-gray-900">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                      <p className="truncate">{a.address || '—'}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{a.city || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.state || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.pincode || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{a.phone || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.gstNumber || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-brand-50 rounded-lg transition-colors" title="Edit">
                          <Pencil className="w-4 h-4 text-brand-500" />
                        </button>
                        <button onClick={() => { deleteAddress(a.id); toast.success('Deleted') }} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-brand-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">{editId ? 'Edit' : 'Add'} Shipping Address</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Name / Label *" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Warehouse, Site Office, Plant" />
              </div>
              <div className="col-span-2">
                <Textarea label="Address" value={form.address} onChange={e => set('address', e.target.value)} rows={2} placeholder="Street, Area, Road" />
              </div>
              <Input label="City" value={form.city} onChange={e => set('city', e.target.value)} placeholder="City" />
              <Input label="Pincode" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="431001" />
              <SelectField label="State">
                <Select value={form.state} onValueChange={v => set('state', v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </SelectField>
              <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              <div className="col-span-2">
                <Input label="GSTIN (Optional)" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} placeholder="27XXXXX" className="font-mono uppercase" />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-5 justify-end">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleSave} leftIcon={<MapPin className="w-4 h-4" />}>Save Address</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
