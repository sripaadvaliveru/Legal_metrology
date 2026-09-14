import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistApi, instrumentTypeApi } from '@/services/api';
import type { ChecklistTemplate } from '@/types';
import { ListChecks, Plus, Pencil, Trash2, Loader2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChecklistItem {
  parameter: string;
  tolerance: string;
  mandatory: boolean;
}

export default function RulesChecklists() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ templateName: '', description: '', instrumentTypeId: '', checklistItems: '' });
  const [items, setItems] = useState<ChecklistItem[]>([{ parameter: '', tolerance: '', mandatory: true }]);

  const { data: instrumentTypes } = useQuery({
    queryKey: ['instrument-types'],
    queryFn: () => instrumentTypeApi.list().then(res => res.data),
  });

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklist-templates', selectedType],
    queryFn: () => checklistApi.list(selectedType || undefined).then(res => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => checklistApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Checklist created');
      resetForm();
    },
    onError: () => toast.error('Failed to create checklist'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => checklistApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Checklist updated');
      resetForm();
    },
    onError: () => toast.error('Failed to update checklist'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => checklistApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-templates'] });
      toast.success('Checklist deleted');
    },
    onError: () => toast.error('Failed to delete checklist'),
  });

  const resetForm = () => {
    setForm({ templateName: '', description: '', instrumentTypeId: '', checklistItems: '' });
    setItems([{ parameter: '', tolerance: '', mandatory: true }]);
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (template: ChecklistTemplate) => {
    let parsed: ChecklistItem[] = [{ parameter: '', tolerance: '', mandatory: true }];
    try {
      parsed = JSON.parse(template.checklistItems);
    } catch {}
    setForm({
      templateName: template.templateName,
      description: template.description || '',
      instrumentTypeId: template.instrumentType?.id || '',
      checklistItems: template.checklistItems,
    });
    setItems(parsed);
    setEditingId(template.id);
    setShowForm(true);
  };

  const addItem = () => setItems([...items, { parameter: '', tolerance: '', mandatory: true }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof ChecklistItem, value: any) => {
    const updated = [...items];
    (updated[i] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = () => {
    const json = JSON.stringify(items.filter(it => it.parameter));
    if (!form.templateName || !form.instrumentTypeId) {
      toast.error('Name and instrument type are required');
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: { templateName: form.templateName, description: form.description, checklistItems: json } });
    } else {
      createMutation.mutate({ ...form, checklistItems: json });
    }
  };

  const getTypeName = (id: string) => instrumentTypes?.find(t => t.id === id)?.name || 'Unknown';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rules & Checklists</h1>
          <p className="text-gray-500">Manage verification checklists per instrument type</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Checklist
        </button>
      </div>

      <div className="mb-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Instrument Types</option>
          {instrumentTypes?.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Checklist' : 'New Checklist'}</h2>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
              <input value={form.templateName} onChange={e => setForm({ ...form, templateName: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g. Weighing Scale Checklist" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrument Type *</label>
              <select value={form.instrumentTypeId} onChange={e => setForm({ ...form, instrumentTypeId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!!editingId}>
                <option value="">Select type</option>
                {instrumentTypes?.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Optional description" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Checklist Items</label>
              <button onClick={addItem} className="text-blue-600 text-sm hover:underline">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={item.parameter} onChange={e => updateItem(i, 'parameter', e.target.value)}
                    className="flex-1 border rounded px-3 py-2 text-sm" placeholder="Parameter" />
                  <input value={item.tolerance} onChange={e => updateItem(i, 'tolerance', e.target.value)}
                    className="w-40 border rounded px-3 py-2 text-sm" placeholder="Tolerance" />
                  <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                    <input type="checkbox" checked={item.mandatory} onChange={e => updateItem(i, 'mandatory', e.target.checked)} />
                    Required
                  </label>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Create'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : checklists && checklists.length > 0 ? (
        <div className="space-y-4">
          {checklists.map(template => {
            let parsed: ChecklistItem[] = [];
            try { parsed = JSON.parse(template.checklistItems); } catch {}
            return (
              <div key={template.id} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <ListChecks className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{template.templateName}</h3>
                      <p className="text-sm text-gray-500">{template.instrumentType?.name || getTypeName(template.instrumentType?.id || '')} · v{template.version}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(template)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (confirm('Delete this checklist?')) deleteMutation.mutate(template.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {template.description && <p className="text-sm text-gray-600 mb-3">{template.description}</p>}
                <div className="bg-gray-50 rounded-lg p-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pb-2 font-medium">Parameter</th>
                        <th className="pb-2 font-medium">Tolerance</th>
                        <th className="pb-2 font-medium">Required</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.map((item, i) => (
                        <tr key={i} className="border-t border-gray-200">
                          <td className="py-2 text-gray-900">{item.parameter}</td>
                          <td className="py-2 text-gray-600">{item.tolerance}</td>
                          <td className="py-2">
                            {item.mandatory ? (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">Required</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Optional</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12 text-center">
          <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No checklists found. Create one to get started.</p>
        </div>
      )}
    </div>
  );
}
