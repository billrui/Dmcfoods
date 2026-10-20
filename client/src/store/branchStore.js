import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

// Helper to check if a branch is currently open based on time and manual override
export function getBranchStatus(branch) {
  if (!branch) return 'CLOSED';
  
  // 1. Check manual override first
  if (branch.isOpen === true) {
    return 'OPEN';
  }
  if (branch.isOpen === false) {
    return 'CLOSED';
  }

  // 2. Fallback to time logic (if isOpen is undefined/null)
  const now = new Date();
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
  
  const open = branch.openTime || '00:00';
  const close = branch.closeTime || '23:59';

  if (open <= close) {
    return (currentTime >= open && currentTime < close) ? 'OPEN' : 'CLOSED';
  }
  
  return (currentTime >= open || currentTime < close) ? 'OPEN' : 'CLOSED';
}

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
