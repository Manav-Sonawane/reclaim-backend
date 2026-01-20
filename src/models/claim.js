import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  claimant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'], 
    default: 'pending' 
  },
  proof: { type: String }, // URL to image/doc proving ownership
  message: { type: String },
  response: { type: String }, // Admin/Finder response
  resolvedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Claim', claimSchema);
