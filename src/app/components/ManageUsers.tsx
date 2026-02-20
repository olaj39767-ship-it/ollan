"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { User } from "../../types";
import api from "@/src/lib/api";

const ManageUsers: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/signin");
      return;
    }

    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://ollanbackend.vercel.app/api/users", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch users");
        }
        setUsers(data);
      } catch (error: any) {
        setError(error.message || "Failed to fetch users");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [user, router]);

  const handleRoleChange = async (userId: string, role: "customer" | "admin") => {
    setIsLoading(true);
    try {
      const res = await fetch("https://ollanbackend.vercel.app/api/user/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to update role");
      }
      setUsers(users.map((u) => (u.id === userId ? { ...u, role } : u)));
      alert(`User role updated to ${role}`);
    } catch (error: any) {
      setError(error.message || "Failed to update role");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Manage Users</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isLoading && <p className="text-gray-500">Loading...</p>}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as "customer" | "admin")}
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-black"
                    disabled={isLoading || u.id === user.id}
                  >
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;