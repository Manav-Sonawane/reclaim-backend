// import { uploadToR2 } from "../utils/r2.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // --- R2 Implementation (Commented Out) ---
    // const imageUrl = await uploadToR2(req.file);
    // -----------------------------------------

    // --- Local Implementation ---
    // Construct the URL. In production, this might need a flexible base URL.
    // Assuming file is served from /uploads route.
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    // ----------------------------

    res.status(200).json({
      message: "Image uploaded successfully",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
