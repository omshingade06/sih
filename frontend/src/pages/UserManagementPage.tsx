import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { User } from '../types';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Lock,
  Mail,
  UserCheck,
  X,
  AlertCircle
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Create / Edit modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'DRILLING_ENGINEER',
    password: '',
    is_active: true
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      full_name: '',
      role: 'DRILLING_ENGINEER',
      password: '',
      is_active: true
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setFormData({
      username: u.username,
      email: u.email,
      full_name: u.full_name || '',
      role: u.role,
      password: '',
      is_active: u.is_active
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active,
          ...(formData.password ? { password: formData.password } : {})
        });
      } else {
        if (!formData.password) {
          throw new Error('Password is required when creating a new user.');
        }
        await api.createUser(formData);
      }
      await fetchUsers();
      setShowModal(false);
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    return (
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      u.role.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-5 max-w-7xl mx-auto space-y-5">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-[#1A1D20] border border-[#2E343A] shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#ED1C24]/20 border border-[#ED1C24]/30 text-[#ED1C24]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white uppercase tracking-wider">
              User Access &amp; Role Management
            </h1>
            <p className="text-xs text-[#A0AAB2] mt-0.5">
              Manage authorized drilling engineers, geologists, administrators, and view-only accounts.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-white text-xs font-bold shadow-lg shadow-[#ED1C24]/20 flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Account</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-[#1A1D20] border border-[#2E343A] flex items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A0AAB2]" />
          <input
            type="text"
            placeholder="Search accounts by name, username, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#121416] border border-[#2E343A] focus:border-[#ED1C24] rounded-xl pl-9 pr-3 py-2 text-white outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl shadow-xl overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#15181B] border-b border-[#2E343A] text-[#A0AAB2] text-[10px] font-bold uppercase tracking-wider">
              <th className="p-3.5 pl-5">User Name &amp; Full Name</th>
              <th className="p-3.5">Email Address</th>
              <th className="p-3.5">System Role</th>
              <th className="p-3.5">Account Status</th>
              <th className="p-3.5 text-right pr-5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E343A]/60">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-[#231F20] transition-colors">
                <td className="p-3.5 pl-5 font-semibold text-white">
                  <div>{u.full_name || u.username}</div>
                  <div className="text-[10px] text-[#A0AAB2] font-mono font-normal">@{u.username}</div>
                </td>
                <td className="p-3.5 text-[#A0AAB2]">{u.email}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : u.role === 'GEOLOGIST'
                        ? 'bg-blue-500/20 text-[#2D9CDB] border border-blue-500/40'
                        : u.role === 'DRILLING_ENGINEER'
                        ? 'bg-[#ED1C24]/20 text-[#ED1C24] border border-[#ED1C24]/40'
                        : 'bg-[#231F20] text-[#A0AAB2] border border-[#2E343A]'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.is_active
                        ? 'bg-emerald-500/20 text-[#27AE60] border border-emerald-500/40'
                        : 'bg-red-500/20 text-[#ED1C24] border border-red-500/40'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="p-3.5 text-right pr-5">
                  <button
                    onClick={() => handleOpenEdit(u)}
                    className="px-3 py-1.5 rounded-lg bg-[#231F20] hover:bg-[#2E343A] text-white font-semibold transition-colors flex items-center space-x-1 ml-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#ED1C24]" />
                    <span>Edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#1A1D20] border border-[#2E343A] rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2E343A] pb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-[#ED1C24]" />
                <h3 className="text-sm font-bold text-white uppercase">
                  {editingUser ? `Edit Account: @${editingUser.username}` : 'Create New User Account'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#A0AAB2] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ED1C24]" />
                  <span>{formError}</span>
                </div>
              )}

              {!editingUser && (
                <div className="space-y-1">
                  <label className="font-semibold text-white">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none focus:border-[#ED1C24]"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-semibold text-white">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">Role Designation *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none font-semibold"
                >
                  <option value="DRILLING_ENGINEER">Drilling Engineer (RTDC Ops)</option>
                  <option value="GEOLOGIST">Data Reviewer / Geologist (Verification)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                  <option value="VIEWER">Read-Only Viewer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-white">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Account Password *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#121416] border border-[#2E343A] rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              {editingUser && (
                <div className="pt-1">
                  <label className="flex items-center space-x-2 text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#2E343A] text-[#ED1C24] bg-[#121416]"
                    />
                    <span>Account Active</span>
                  </label>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#2E343A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-[#231F20] text-xs text-[#A0AAB2] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#ED1C24] hover:bg-[#D01820] text-xs font-bold text-white shadow disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingUser ? 'Update Account' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
