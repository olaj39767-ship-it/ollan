'use client';

import { useState, useEffect } from 'react';

interface BackendUser {
  _id: string;
  name?: string;
  email: string;
}

interface MergedUser {
  _id: string;
  name?: string;
  email: string;
  storeCredit: number;
  existsInLocal: boolean;
}

export default function StoreCreditAdminPage() {
  const [backendUsers, setBackendUsers] = useState<BackendUser[]>([]);
  const [mergedUsers, setMergedUsers] = useState<MergedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('admin_gift');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // 1. Get users from Backend
      const backendRes = await fetch('https://ollanback.vercel.app/api/user/');
      const backendData = await backendRes.json();
      const backendList: BackendUser[] = Array.isArray(backendData) 
        ? backendData 
        : backendData.users || backendData.data || [];

      setBackendUsers(backendList);

      // 2. Get store credits from Next.js DB
      const localRes = await fetch('/api/store-credit');
      const localData = await localRes.json();
      const localList = Array.isArray(localData) ? localData : [];

      const creditMap = new Map(
        localList.map((u: any) => [u._id, u.storeCredit || 0])
      );

      // Merge
      const merged: MergedUser[] = backendList.map((user) => ({
        ...user,
        storeCredit: creditMap.get(user._id) || 0,
        existsInLocal: creditMap.has(user._id),
      }));

      setMergedUsers(merged);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const filteredUsers = mergedUsers.filter((user) =>
    (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Select user and enter amount > 0' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const selected = backendUsers.find(u => u._id === selectedUserId);

    try {
      const res = await fetch('/api/store-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserId,
          email: selected?.email || '',
          name: selected?.name || '',
          amount: Number(amount),
          reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed');

      setMessage({ type: 'success', text: `✅ Added ₦${Number(amount).toLocaleString()} successfully!` });

      setAmount('');
      await fetchAllData();   // Refresh table immediately
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Store Credit Management</h1>

      {/* Form */}
      <div className="bg-white p-6 rounded-2xl shadow mb-10">
        <h2 className="font-semibold mb-4">Assign Store Credit</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full border rounded-xl px-4 py-3" required>
              <option value="">Select User from Backend</option>
              {backendUsers.map(u => (
                <option key={u._id} value={u._id}>
                  {u.name ? `${u.name} — ${u.email}` : u.email}
                </option>
              ))}
            </select>
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount ₦"
            min="1"
            className="border rounded-xl px-4 py-3"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Credit'}
          </button>
        </form>

        {message && <div className={`mt-4 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>{message.text}</div>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <div className="p-6 border-b flex justify-between">
          <h2 className="text-xl font-semibold">All Users & Store Credit</h2>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-4 py-2 rounded-lg w-80"
          />
        </div>

        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left">Name</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-center">Store Credit</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user._id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-5">{user.name || '—'}</td>
                <td className="px-6 py-5 text-gray-600">{user.email}</td>
                <td className="px-6 py-5 text-center text-2xl font-bold text-green-600">
                  ₦{user.storeCredit.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-center">
                  {user.existsInLocal ? '✅ Synced' : '⚠️ New'}
                </td>
                <td className="px-6 py-5 text-center">
                  <button onClick={() => setSelectedUserId(user._id)} className="text-green-600 hover:underline">
                    Add Credit
                  </button>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-500">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}