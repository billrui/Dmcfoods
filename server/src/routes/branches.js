import express from 'express';
import Branch from '../models/Branch.js';
import { branchStatus } from '../lib/hours.js';

const router = express.Router();

// Public: Get all branches
router.get('/', async (req, res, next) => {
  try {
    const branches = await Branch.find().sort('createdAt').lean();
    res.json(branches.map(b => { const st = branchStatus(b); return { ...b, status: st.open ? 'OPEN' : 'CLOSED', statusText: st.text }; }));
  } catch (e) { next(e); }
});

export default router;
