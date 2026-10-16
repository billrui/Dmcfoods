import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const BRANCHES = [
  { id: 'nyali',    name: 'Munch Nyali',    status: 'CLOSED', address: 'Mombasa - Nyali, Opposite Cinemax' },
  { id: 'bamburi',  name: 'Munch Bamburi',  status: 'CLOSED', address: 'Mombasa - Bamburi Masters' },
  { id: 'mtwapa',   name: 'Munch Mtwapa',   status: 'CLOSED', address: 'Mtwapa - Opposite Mtwapa Business Park' },
  { id: 'kilimani', name: 'Munch Kilimani', status: 'CLOSED', address: 'Nairobi - Kirichwa Road, Kilimani' },
];

export const useBranch = create(persist((set, get) => ({
  branchId: 'nyali',
  branch: BRANCHES[0],
  setBranch: (id) => {
    const b = BRANCHES.find(x => x.id === id) || BRANCHES[0];
    set({ branchId: b.id, branch: b });
  },
}), { name: 'munch-branch' }));
