
import React, { useState, useEffect } from 'react';
import { UserProfile, UserRole, Territory, ExpenseCategory, UserStatus } from '../types';
import { getAllUsers, saveUser, deleteUser } from '../services/mockDatabase';
import { getCurrentPosition, getDistanceFromLatLonInMeters } from '../utils';
import { Button } from './Button';
import { Plus, Trash, Edit, Save, X, MapPin, Loader2, Lock, LogIn } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface UserManagementProps {
  onLoginAs?: (user: UserProfile) => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({ onLoginAs }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [loadingGps, setLoadingGps] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(JSON.parse(JSON.stringify(user)));
    setIsNew(false);
  };

  const handleCreate = () => {
    const newUser: UserProfile = {
      uid: uuidv4(),
      email: '',
      displayName: '',
      role: UserRole.MR,
      status: UserStatus.CONFIRMED,
      hqLocation: '',
      territories: [],
      password: ''
    };
    setEditingUser(newUser);
    setIsNew(true);
  };

  const handleDelete = async (uid: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(uid);
      loadUsers();
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;

    if (!editingUser.displayName?.trim()) {
      alert("Full Name is required");
      return;
    }
    if (!editingUser.email?.trim()) {
      alert("Email is required");
      return;
    }
    if (isNew && !editingUser.password?.trim()) {
      alert("Password is required for new users.");
      return;
    }

    setSaving(true);
    try {
      // STRICT Payload Construction to avoid Undefined/Invalid Data errors
      const basePayload = {
        uid: editingUser.uid,
        email: editingUser.email.trim(),
        displayName: editingUser.displayName.trim(),
        role: editingUser.role,
        status: editingUser.status,
        password: editingUser.password || 'admin123' // Default if not changed on edit
      };

      let finalPayload: UserProfile;

      if (editingUser.role === UserRole.ADMIN) {
        // ADMIN SPECIFIC PAYLOAD (No territories, No manager)
        finalPayload = {
          ...basePayload,
          hqLocation: 'Head Office',
          territories: [],
          // Don't include reportingManagerId or hqLat/Lng
        } as UserProfile;
      } else {
        // FIELD STAFF PAYLOAD
        finalPayload = {
          ...basePayload,
          hqLocation: editingUser.hqLocation || '',
          state: editingUser.state || '',
          territories: editingUser.territories || [],
          reportingManagerId: editingUser.reportingManagerId || undefined,
          hqLat: editingUser.hqLat,
          hqLng: editingUser.hqLng
        } as UserProfile;
      }

      console.log("Saving User Payload:", finalPayload);

      await saveUser(finalPayload);

      await loadUsers();
      setEditingUser(null);
      alert("User saved successfully!");
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Failed to save user: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    const manager = users.find(u => u.uid === managerId);
    return manager ? manager.displayName : 'Unknown';
  };

  const captureUserHqLocation = async () => {
    setLoadingGps(true);
    try {
      const pos = await getCurrentPosition();
      if (!editingUser) return;
      setEditingUser({
        ...editingUser,
        hqLat: parseFloat(pos.coords.latitude.toFixed(6)),
        hqLng: parseFloat(pos.coords.longitude.toFixed(6))
      });
    } catch (e) {
      alert("GPS Error. Ensure location services are enabled.");
    } finally {
      setLoadingGps(false);
    }
  };

  const addTerritory = () => {
    if (!editingUser) return;
    const t: Territory = {
      id: uuidv4(),
      name: 'New Territory',
      category: ExpenseCategory.HQ,
      fixedKm: 0,
      geoRadius: 2000
    };
    setEditingUser({
      ...editingUser,
      territories: [...editingUser.territories, t]
    });
  };

  const updateTerritory = (id: string, field: keyof Territory, value: any) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      territories: editingUser.territories.map(t => t.id === id ? { ...t, [field]: value } : t)
    });
  };

  const removeTerritory = (id: string) => {
    if (!editingUser) return;
    setEditingUser({
      ...editingUser,
      territories: editingUser.territories.filter(t => t.id !== id)
    });
  };

  const captureTerritoryLocation = async (territoryId: string) => {
    setLoadingGps(true);
    try {
      const pos = await getCurrentPosition();
      setEditingUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          territories: prev.territories.map(t => {
            if (t.id === territoryId) return { ...t, geoLat: pos.coords.latitude, geoLng: pos.coords.longitude };
            return t;
          })
        };
      });
    } catch (error) { alert("GPS Error"); } finally { setLoadingGps(false); }
  };

  const isAdminRole = editingUser?.role === UserRole.ADMIN;

  if (editingUser) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{isNew ? 'Create User' : 'Edit User'}</h2>
          <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}><X size={20} /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name *</label>
            <input className="w-full border p-2 rounded" value={editingUser.displayName} onChange={e => setEditingUser({ ...editingUser, displayName: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email *</label>
            <input className="w-full border p-2 rounded" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password {isNew && '*'}</label>
            <div className="relative">
              <input
                type="text"
                className="w-full border p-2 rounded pl-8"
                value={editingUser.password || ''}
                onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                placeholder={isNew ? "Create password" : "Leave blank to keep current"}
              />
              <Lock size={14} className="absolute left-2.5 top-3 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Role</label>
            <select className="w-full border p-2 rounded" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}>
              <option value={UserRole.MR}>Medical Rep</option>
              <option value={UserRole.ASM}>ASM</option>
              <option value={UserRole.RM}>Regional Manager</option>
              <option value={UserRole.ZM}>Zonal Manager</option>
              <option value={UserRole.ADMIN}>Admin (Office)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
            <select className="w-full border p-2 rounded" value={editingUser.status} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as UserStatus })}>
              <option value={UserStatus.TRAINEE}>Trainee</option>
              <option value={UserStatus.CONFIRMED}>Confirmed</option>
            </select>
          </div>

          {!isAdminRole && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">HQ Location</label>
                <div className="flex gap-2">
                  <input className="w-full border p-2 rounded" value={editingUser.hqLocation} onChange={e => setEditingUser({ ...editingUser, hqLocation: e.target.value })} />
                  <Button size="sm" variant="outline" onClick={captureUserHqLocation} disabled={loadingGps}><MapPin size={16} /></Button>
                </div>
              </div>
              {(editingUser.role === UserRole.MR || editingUser.role === UserRole.ASM) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Reporting Manager</label>
                  <select className="w-full border p-2 rounded" value={editingUser.reportingManagerId || ''} onChange={e => setEditingUser({ ...editingUser, reportingManagerId: e.target.value })}>
                    <option value="">Select Manager</option>
                    {users.filter(u => (editingUser.role === UserRole.MR ? u.role === UserRole.ASM : u.role === UserRole.RM)).map(m => (
                      <option key={m.uid} value={m.uid}>{m.displayName}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {!isAdminRole && (
          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-700">Territories</h3>
              <Button size="sm" onClick={addTerritory}><Plus size={16} /> Add</Button>
            </div>
            <div className="space-y-2">
              {editingUser.territories.map((t) => (
                <div key={t.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded">
                  <input className="flex-1 border p-1 text-sm rounded" value={t.name} onChange={(e) => updateTerritory(t.id, 'name', e.target.value)} placeholder="Name" />
                  <select className="border p-1 text-sm rounded" value={t.category} onChange={(e) => updateTerritory(t.id, 'category', e.target.value)}>
                    <option value="HQ">HQ</option><option value="EX_HQ">Ex-HQ</option><option value="OUTSTATION">Outstation</option>
                  </select>
                  <input className="w-16 border p-1 text-sm rounded" type="number" value={t.fixedKm} onChange={(e) => updateTerritory(t.id, 'fixedKm', Number(e.target.value))} placeholder="KM" />
                  <Button size="sm" variant="outline" onClick={() => captureTerritoryLocation(t.id)} disabled={loadingGps}><MapPin size={14} /></Button>
                  <button onClick={() => removeTerritory(t.id)} className="text-red-500 p-1"><Trash size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setEditingUser(null)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || loadingGps}>
            {saving ? <><Loader2 size={16} className="animate-spin mr-2" /> Saving...</> : <><Save size={16} className="mr-2" /> Save User</>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">User Management</h2>
        <Button onClick={handleCreate}><Plus size={16} className="mr-2" /> Add User</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Location</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.uid} className="hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium text-slate-800">{user.displayName}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="p-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{user.role}</span></td>
                <td className="p-3">{user.role === UserRole.ADMIN ? 'Office' : user.hqLocation}</td>
                <td className="p-3 text-right space-x-2 flex justify-end">
                  {onLoginAs && (
                    <button onClick={() => onLoginAs(user)} className="text-slate-600 hover:text-blue-600 mr-2" title="Login as User">
                      <LogIn size={16} />
                    </button>
                  )}
                  <button onClick={() => handleEdit(user)} className="text-blue-600"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(user.uid)} className="text-red-600"><Trash size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
