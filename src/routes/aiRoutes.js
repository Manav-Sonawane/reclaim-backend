import express from 'express';
import { searchItemsAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Publicly accessible for now, or protect if desired. 
// Adding protect middleware to prevent abuse if needed, 
// but for a landing page chatbot, public might be better.
// Let's keep it public for ease of use in hackathon demo.
router.post('/search', searchItemsAI);

export default router;
