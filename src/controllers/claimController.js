import Claim from "../models/claim.js";
import Item from "../models/item.js";
import { sendEmail } from "../utils/email.js";

// @desc    Create a claim
// @route   POST /api/claims
// @access  Private
export const createClaim = async (req, res) => {
  try {
    const { itemId, answers } = req.body;

    // Check if item exists
    const item = await Item.findById(itemId).populate('user'); // Populate owner
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if already claimed by user
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimant: req.user._id,
    });
    if (existingClaim) {
      return res
        .status(400)
        .json({ message: "You have already claimed this item" });
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user._id,
      message: Array.isArray(answers) ? answers.join('\n') : answers,
      status: "pending",
    });

    // Notify the item owner (the 'Finder') that someone is claiming it
    if (item.user && item.user.email) {
        await sendEmail({
            to: item.user.email,
            subject: `New Claim on your item: ${item.title}`,
            text: `Hello ${item.user.name},\n\nSomeone has raised a claim on the item you found: "${item.title}".\n\nLogin to Reclaim to review their proof and approve/reject the claim.\n\nBest,\nReclaim Team`,
            html: `<p>Hello <strong>${item.user.name}</strong>,</p><p>Someone has raised a claim on the item you found: <strong>"${item.title}"</strong>.</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard">Login to Reclaim</a> to review their proof and approve/reject the claim.</p><p>Best,<br>Reclaim Team</p>`
        });
    }

    res.status(201).json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all claims (Admin or User's own?)
// Code implied Admin, but let's check auth.
// @route   GET /api/claims
// @access  Private
export const getClaims = async (req, res) => {
  try {
    // If admin, show all? If user, show only theirs?
    // For now, let's just return all for simplicity or filter by admin logic if needed.
    // Assuming admin for this route as per original file comments.
    const claims = await Claim.find({})
      .populate("item", "title")
      .populate("claimant", "name email")
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's claims
// @route   GET /api/claims/user/me
// @access  Private
export const getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user._id })
      .populate("item", "title images type status") // Populate needed item fields
      .sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update claim status
// @route   PUT /api/claims/:id
// @access  Private/Admin
export const updateClaimStatus = async (req, res) => {
  try {
    const { status } = req.body; // approved, rejected
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    claim.status = status;
    await claim.save();

    // If approved, mark item as claimed/resolved
    if (status === "approved") {
      const item = await Item.findById(claim.item);
      if (item) {
        item.status = "claimed";
        await item.save();
      }
    }

    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Update claim message (proof)
// @route   PUT /api/claims/:id/message
// @access  Private
export const updateClaimMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Ensure only the claimant can edit
    if (claim.claimant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this claim" });
    }

    // Ensure only pending claims can be edited
    if (claim.status !== "pending") {
      return res.status(400).json({ message: "Cannot edit claim after it has been processed" });
    }

    claim.message = message;
    await claim.save();

    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// @desc    Delete claim (only if pending)
// @route   DELETE /api/claims/:id
// @access  Private
export const deleteClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }

    // Ensure only the claimant can delete
    if (claim.claimant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this claim" });
    }

    // Ensure only pending claims can be deleted
    if (claim.status !== "pending") {
      return res.status(400).json({ message: "Cannot delete claim after it has been processed" });
    }

    await claim.deleteOne();

    res.json({ message: "Claim deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
