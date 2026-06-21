import { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Package, X, Tag } from 'lucide-react'
import { toast } from 'sonner'
import { useProductStore } from '@/store/useProductStore'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'
import { Table, Thead, THeadRow, Th, Tbody, Tr, Td, TEmpty, TableCard } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectField } from '@/components/ui/select'
import { useConfirm } from '@/components/ui/confirm-dialog'

const emptyProduct = (): Omit<Product, 'id' | 'createdAt'> => ({
  name: '', description: '', hsnCode: '', unit: 'Nos', rate: 0, gstRate: 18, category: '',
})

const GST_RATES = [0, 5, 12, 18, 28]
const UNITS = ['Nos', 'Mtr', 'Kg', 'Ltr', 'Box', 'Set', 'Job', 'Lot', 'Sqm', 'Hours', 'Days', 'Months', 'Pcs', 'Roll', 'Pair']

const CATEGORY_COLORS: Record<string, string> = {
  'Fire Alarm': 'bg-red-50 text-red-700',
  'PA System': 'bg-blue-50 text-blue-700',
  'Cable Work': 'bg-orange-50 text-orange-700',
  'Installation': 'bg-green-50 text-green-700',
  'Networking': 'bg-purple-50 text-purple-700',
  'AMC / Service': 'bg-teal-50 text-teal-700',
  'Material': 'bg-gray-100 text-gray-600',
}

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = useProductStore()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyProduct())
  const confirm = useConfirm()

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase()) ||
    p.hsnCode.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setForm(emptyProduct()); setEditing(null); setShowForm(true) }
  const openEdit = (p: Product) => {
    setForm({ name: p.name, description: p.description || '', hsnCode: p.hsnCode, unit: p.unit, rate: p.rate, gstRate: p.gstRate, category: p.category })
    setEditing(p); setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Product name is required'); return }
    if (editing) { updateProduct(editing.id, form); toast.success('Product updated!') }
    else { addProduct(form); toast.success('Product added!') }
    setShowForm(false)
  }

  const handleDelete = async (p: Product) => {
    if (await confirm(`This will permanently delete "${p.name}".`, { title: 'Delete this product?' })) {
      deleteProduct(p.id); toast.success('Product deleted')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
          <p className="text-sm text-gray-500 mt-0.5">{products.length} item{products.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 w-56" />
          </div>
          <Button onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>Add Product</Button>
        </div>
      </div>

      <TableCard>
        <Table>
          <Thead>
            <THeadRow>
              <Th>#</Th>
              <Th>Product / Service</Th>
              <Th align="center">Category</Th>
              <Th align="center">HSN Code</Th>
              <Th align="center">Unit</Th>
              <Th align="right">Rate</Th>
              <Th align="center">GST</Th>
              <Th align="center">Actions</Th>
            </THeadRow>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <TEmpty colSpan={8} icon={<Package className="w-10 h-10" />} message="No products found" />
            ) : filtered.map((p, i) => (
              <Tr key={p.id}>
                <Td muted>{i + 1}</Td>
                <Td className="max-w-[280px]">
                  <p className="font-semibold text-gray-800 text-sm leading-snug">{p.name}</p>
                  {p.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description}</p>}
                </Td>
                <Td align="center">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>
                    {p.category || '—'}
                  </span>
                </Td>
                <Td align="center">
                  {p.hsnCode
                    ? <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{p.hsnCode}</span>
                    : <span className="text-gray-300">—</span>}
                </Td>
                <Td align="center" muted>{p.unit}</Td>
                <Td align="right"><span className="font-bold text-gray-900">{formatCurrency(p.rate)}</span></Td>
                <Td align="center">
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">{p.gstRate}%</span>
                </Td>
                <Td align="center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableCard>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
                  <Tag className="w-4 h-4 text-brand-600" />
                </div>
                <h2 className="text-base font-bold text-gray-800">{editing ? 'Edit Product' : 'Add Product'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Name of Product / Service *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Appears on invoice exactly as typed" />
              </div>
              <Input label="HSN / SAC Code" value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))} placeholder="e.g. 8531, 9987" />
              <Input label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electrical, Cable" />
              <Input label="Rate (₹) *" type="number" min="0" value={form.rate} onChange={e => setForm(f => ({ ...f, rate: parseFloat(e.target.value) || 0 }))} required />
              <SelectField label="Unit (UOM)">
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </SelectField>
              <SelectField label="GST Rate" className="col-span-2">
                <Select value={String(form.gstRate)} onValueChange={v => setForm(f => ({ ...f, gstRate: parseFloat(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                </Select>
              </SelectField>
              <div className="col-span-2 flex gap-3 pt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" className="flex-1">{editing ? 'Update' : 'Add Product'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
