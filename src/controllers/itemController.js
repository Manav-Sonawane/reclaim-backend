import Item from "../models/item.js";

// CREATE ITEM
export const createItem = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      category,
      date,
      images,
      location,
      contact_info,
    } = req.body;

    // Construct GeoJSON location if lat/lng provided in different format, 
    // but here we expect the frontend to send the structure we need or we adapt it.
    // Based on the updated model, we need { type: 'Point', coordinates: [lng, lat], address }
    
    // Check if location comes as flat lat/lng or object
    let locObj = location;
    if (location && location.lat && location.lng) {
        locObj = {
            type: "Point",
            coordinates: [location.lng, location.lat],
            address: location.address || location.area
        };
    }

    const item = await Item.create({
      type,
      title,
      description,
      category,
      date,
      images,
      location: locObj,
      contact_info,
      user: req.user._id,
    });

    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL ITEMS
export const getItems = async (req, res) => {
  try {
    const { type, category, lat, lng, radius, search, location, box } = req.query;
    let query = { status: "open" };

    if (type && type !== "all") {
      query.type = { $in: type.split(",") };
    }

    if (category && category !== "All") {
      query.category = { $in: category.split(",") };
    }

    // Partial match for location address if provided (and no box/coords)
    if (location && !box) {
        query["location.address"] = { $regex: location, $options: "i" };
    }

    // Geospatial Bounding Box Search (Subset Check)
    // Expects box=south,west,north,east
    if (box) {
        const [south, west, north, east] = box.split(',').map(Number);
        query.location = {
            ...query.location,
            $geoWithin: {
                $box: [
                    [west, south], // Bottom-Left (MinLng, MinLat)
                    [east, north]  // Top-Right (MaxLng, MaxLat)
                ]
            }
        };
    } else if (lat && lng) {
      // Legacy or "Near Me" radius support
      const distanceInMeters = (radius || 5) * 1000;
      query.location = {
        ...query.location,
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: distanceInMeters,
        },
      };
    }

    // Global Text search (Title/Description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const items = await Item.find(query)
      .populate("user", "name")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ITEM BY ID
export const getItemById = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate(
      "user",
      "name email"
    );

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ITEM MATCHES
export const getItemMatches = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const matchType = item.type === "lost" ? "found" : "lost";

    // Find items of opposite type, same category, within 10km
    const matches = await Item.find({
      type: matchType,
      category: item.category,
      _id: { $ne: item._id }, // Exclude self
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: item.location.coordinates,
          },
          $maxDistance: 10000, // 10km
        },
      },
    }).limit(5);

    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MY ITEMS
export const getMyItems = async (req, res) => {
    try {
      const items = await Item.find({ user: req.user._id }).sort({ createdAt: -1 });
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

// DELETE ITEM
export const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check user ownership
    if (item.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "User not authorized" });
    }

    await item.deleteOne();
    res.json({ message: "Item removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
