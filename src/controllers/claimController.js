import Claim from "../models/claim.js";
import Item from "../models/item.js";

// @desc    Create a claim
// @route   POST /api/claims
// @access  Private
export const createClaim = async (req, res) => {
  try {
    const { itemId, answers } = req.body;

    // Check if item exists
    const item = await Item.findById(itemId);
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
      message: answers, // Mapping 'answers' to 'message' based on schema or keeping generic
      status: "pending",
    });

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
