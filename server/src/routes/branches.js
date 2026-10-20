import express from 'express';
import Branch from '../models/Branch.js';

const router = express.Router();

// Public: Get all branches
router.get('/', async (req, res, next) => {
  try {
    const branches = await Branch.find().sort('createdAt');
    res.json(branches);
  } catch (e) { next(e); }
});

export default router;
