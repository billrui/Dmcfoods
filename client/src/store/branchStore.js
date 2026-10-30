import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

import { branchStatus } from '../lib/hours';

// Open/closed right now, in Kenya time (same rules the server uses)
export function getBranchStatus(branch) { return branchStatus(branch).open ? 'OPEN' : 'CLOSED'; }
export function getBranchStatusText(branch) { return branchStatus(branch).text; }

export const useBranch = create(persist((set, get) => ({
  branches: [],
  branchId: null,
  branch: null,
  loading: false,

  fetchBranches: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/branches');
      
      const updatedBranches = data.map(b => ({
        ...b,
        status: getBranchStatus(b)
      }));

      set({ branches: updatedBranches, loading: false });
      
      if (!get().branchId && updatedBranches.length > 0) {
        set({ branchId: updatedBranches[0]._id, branch: updatedBranches[0] });
      } else if (get().branchId) {
        const current = updatedBranches.find(b => b._id === get().branchId);
        if (current) set({ branch: current });
      }
    } catch (err) {
      console.error('Failed to fetch branches', err);
      set({ loading: false });
    }
  },

  setBranch: (id) => {
    const b = get().branches.find(x => x._id === id);
    if (b) set({ branchId: b._id, branch: b });
  },
}), { name: 'dmc-branch' }));
