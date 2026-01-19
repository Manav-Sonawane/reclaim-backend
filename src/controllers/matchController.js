import Item from "../models/item.js";

export const getMatchesForItem = async (req, res) => {
  try {
    const baseItem = await Item.findById(req.params.id);

    if (!baseItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    const oppositeType = baseItem.type === "lost" ? "found" : "lost";

    const candidates = await Item.find({
      type: oppositeType,
      category: baseItem.category,
      "location.area": baseItem.location.area,
      status: "open",
    });

    const matches = candidates
      .map((item) => {
        let score = 0;

        if (item.category === baseItem.category) score += 2;
        if (item.location.area === baseItem.location.area) score += 2;
        if (
          baseItem.color &&
          item.color &&
          item.color.toLowerCase() === baseItem.color.toLowerCase()
        ) {
          score += 1;
        }

        return {
          item,
          matchScore: score,
        };
      })
      .filter((m) => m.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
