import Item from "../models/item.js";
import { sendEmail } from "../utils/email.js";

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

      // Server-side Geocoding to persist City Name
      try {
        // Using global fetch (Node 18+)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`, {
            headers: { 'User-Agent': 'ReclaimApp/1.0' } // Good practice for OSM
        });
        const geoData = await geoRes.json();
        const addr = geoData.address;
        if (addr) {
            locObj.city = addr.city || 
                          addr.town || 
                          addr.village || 
                          addr.municipality || 
                          addr.city_district || 
                          addr.suburb || 
                          addr.neighbourhood || 
                          addr.county;
        }
      } catch (geoErr) {
        console.error("Server-side geocoding failed:", geoErr);
      }
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

    // --- SMART MATCHING & NOTIFICATION ---
    // If user posted "Found", find "Lost" items nearby.
    // If user posted "Lost", find "Found" items nearby.
    // We do this asynchronously so we don't block the response.
    (async () => {
        try {
            const matchType = type === "lost" ? "found" : "lost";
            const potentialMatches = await Item.find({
                type: matchType,
                category: category,
                status: "open",
                _id: { $ne: item._id },
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: item.location.coordinates
                        },
                        $maxDistance: 5000 // 5km radius for notifications
                    }
                }
            }).populate('user', 'name email profilePicture');

            for (const match of potentialMatches) {
                if (match.user && match.user.email) {
                    await sendEmail({
                        to: match.user.email,
                        subject: `New Potential Match for your ${matchType} item: ${match.title}`,
                        text: `Hello ${match.user.name},\n\nA new item has been reported that matches the category and location of your ${matchType} item "${match.title}".\n\nTitle: ${item.title}\nDescription: ${item.description}\n\nCheck it out on Reclaim!\n\nBest,\nReclaim Team`,
                        html: `<p>Hello <strong>${match.user.name}</strong>,</p><p>A new item has been reported that matches the category and location of your ${matchType} item <strong>"${match.title}"</strong>.</p><p><strong>New Item:</strong> ${item.title}<br><strong>Description:</strong> ${item.description}</p><p><a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/items/${item._id}">View Item</a></p><p>Best,<br>Reclaim Team</p>`
                    });
                }
            }
        } catch (err) {
            console.error("Error in matching notification:", err);
        }
    })();

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
      .populate("user", "name profilePicture")
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
      "name email profilePicture"
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

// VOTE ITEM
export const voteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Initialize arrays if they don't exist (safety)
    if (!item.upvotes) item.upvotes = [];
    if (!item.downvotes) item.downvotes = [];

    const isUpvoted = item.upvotes.includes(userId);
    const isDownvoted = item.downvotes.includes(userId);

    if (voteType === "up") {
      if (isUpvoted) {
        // Toggle off
        item.upvotes.pull(userId);
      } else {
        // Remove downvote if exists
        if (isDownvoted) item.downvotes.pull(userId);
        // Add upvote
        item.upvotes.push(userId);
      }
    } else if (voteType === "down") {
      if (isDownvoted) {
        // Toggle off
        item.downvotes.pull(userId);
      } else {
        // Remove upvote if exists
        if (isUpvoted) item.upvotes.pull(userId);
        // Add downvote
        item.downvotes.push(userId);
      }
    } else {
      return res.status(400).json({ message: "Invalid vote type" });
    }

    await item.save();

    // Return the updated arrays so frontend can calculate count
    res.json({
      upvotes: item.upvotes,
      downvotes: item.downvotes
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
