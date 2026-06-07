'use client'

import React, { useState, useTransition } from 'react'
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MapPin, 
  Loader2, 
  AlertCircle 
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createUnit, updateUnit, deleteUnit } from '@/app/admin/actions'
import { toast } from 'sonner'

interface Unit {
  id: string
  name: string
  province: string | null
  created_at: string
}

interface UnitsManagerProps {
  initialUnits: Unit[]
  isAdmin: boolean
}

export default function UnitsManager({ initialUnits, isAdmin }: UnitsManagerProps) {
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()
  
  // Modals / Panels states
  const [isAdding, setIsAdding] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  
  // Form fields
  const [unitName, setUnitName] = useState('')
  const [unitProvince, setUnitProvince] = useState('Punjab') // Punjab as default

  const handleAdd = () => {
    setUnitName('')
    setUnitProvince('Punjab')
    setEditingUnit(null)
    setIsAdding(true)
  }

  const handleEdit = (unit: Unit) => {
    setUnitName(unit.name)
    setUnitProvince(unit.province || 'Punjab')
    setIsAdding(false)
    setEditingUnit(unit)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingUnit(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!unitName.trim()) {
      toast.error('Unit name is required.')
      return
    }

    startTransition(async () => {
      if (editingUnit) {
        // Edit unit
        const res = await updateUnit(editingUnit.id, unitName.trim(), unitProvince.trim() || null)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success(`Unit "${unitName}" updated successfully!`)
          setUnits(prev => 
            prev.map(u => u.id === editingUnit.id ? { ...u, name: unitName.trim(), province: unitProvince.trim() || null } : u)
          )
          handleCancel()
        }
      } else {
        // Add new unit
        const res = await createUnit(unitName.trim(), unitProvince.trim() || null)
        if (res?.error) {
          toast.error(res.error)
        } else {
          toast.success(`Unit "${unitName}" created successfully!`)
          // Fetch all units again or just update state (standard Next.js actions refresh the cache and page anyway)
          // Since it calls revalidatePath, reloading/redirecting/refreshing is automatic but we can push a temporary placeholder in state to be snappy
          window.location.reload()
        }
      }
    })
  }

  const handleDelete = async (unit: Unit) => {
    if (!window.confirm(`Are you sure you want to delete the unit "${unit.name}"? All users and events associated with this unit may lose their association.`)) {
      return
    }

    startTransition(async () => {
      const res = await deleteUnit(unit.id)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(`Unit "${unit.name}" deleted successfully.`)
        setUnits(prev => prev.filter(u => u.id !== unit.id))
      }
    })
  }

  const filteredUnits = units.filter(unit => 
    unit.name.toLowerCase().includes(search.toLowerCase()) || 
    (unit.province && unit.province.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      {/* Search and Add Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/80 p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-800 transition duration-200"
            placeholder="Search units by name or province..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {isAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-zinc-900 hover:bg-black text-white font-bold text-xs"
            leftIcon={<Plus size={16} />}
          >
            Add City Unit
          </Button>
        )}
      </div>

      {/* Main Grid: Form panel + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Form Panel (Only shows when adding or editing) */}
        {(isAdding || editingUnit) && (
          <Card className="lg:col-span-1 border border-zinc-200 shadow-sm h-fit">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-extrabold text-zinc-900 text-base flex items-center gap-2">
                <MapPin size={18} className="text-[#DD0408]" />
                {editingUnit ? 'Edit City Unit' : 'Create City Unit'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Unit (City) Name"
                  placeholder="e.g. Multan, Bahawalpur"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  required
                  disabled={isPending}
                />
                
                <Input
                  label="Province"
                  placeholder="e.g. Punjab, Sindh"
                  value={unitProvince}
                  onChange={(e) => setUnitProvince(e.target.value)}
                  disabled={isPending}
                />

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={handleCancel}
                    variant="outline"
                    className="w-full font-bold text-xs"
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="w-full bg-[#DD0408] hover:bg-red-700 text-white font-bold text-xs"
                    disabled={isPending}
                    isLoading={isPending}
                  >
                    {editingUnit ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Units Table list */}
        <div className={`col-span-1 ${(isAdding || editingUnit) ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <Card className="border border-zinc-200 shadow-sm overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    <th className="p-4">City Unit Name</th>
                    <th className="p-4">Province</th>
                    <th className="p-4">Created Date</th>
                    {isAdmin && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-zinc-400 text-xs font-semibold">
                        No units found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((unit) => (
                      <tr key={unit.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900 flex items-center gap-2">
                          <MapPin size={14} className="text-zinc-400" />
                          {unit.name}
                        </td>
                        <td className="p-4 text-zinc-500 font-medium">
                          {unit.province || 'Punjab'}
                        </td>
                        <td className="p-4 text-zinc-400 font-semibold font-mono text-xs">
                          {new Date(unit.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </td>
                        {isAdmin && (
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleEdit(unit)}
                                className="w-8 h-8 rounded-lg border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 transition cursor-pointer"
                                title="Edit Unit"
                                disabled={isPending}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(unit)}
                                className="w-8 h-8 rounded-lg border border-red-100 flex items-center justify-center text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete Unit"
                                disabled={isPending}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
