import { useState, useEffect } from 'react';
import { useBranch, getBranchStatus } from '../store/branchStore';

export default function BranchModal({ open, onClose }) {
  const { branches, branchId, setBranch, fetchBranches } = useBranch();
  const [selected, setSelected] = useState(branchId);

  useEffect(() => {
    if (open) fetchBranches();
  }, [open]);

  if (!open) return null;

  const confirm = (id) => {
    setBranch(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:pt-24" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D21] rounded-3xl shadow-2xl w-full max-w-3xl p-6 md:p-8 border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
        
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold dark:text-white mb-1">Select branch</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose your nearest Dmcfoods branch to continue ordering.</p>
          </div>
          <button onClick={onClose} className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-[#23272B]">Close</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {branches.map(b => {
            const isSelected = b._id === selected;
            const isClosed = b.status === 'CLOSED'; // Calculated status
            return (
              <button
                key={b._id}
                onClick={() => !isClosed && setSelected(b._id)}
                disabled={isClosed}
                className={`text-left p-4 rounded-2xl border-2 transition ${
                  isClosed ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-800'
                  : isSelected ? 'border-brand bg-red-50/40 dark:bg-red-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-semibold dark:text-white">{b.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isClosed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{b.address}</p>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end mt-8 gap-3">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium dark:text-white hover:bg-gray-50 dark:hover:bg-[#23272B]">Cancel</button>
          <button 
            onClick={() => confirm(selected)} 
            disabled={!selected || branches.find(b => b._id === selected)?.status === 'CLOSED'}
            className="px-6 py-2 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-hover disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
