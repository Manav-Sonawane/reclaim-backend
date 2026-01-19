import { uploadToR2 } from "../utils/r2.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Upload to R2
    const imageUrl = await uploadToR2(req.file);

    res.status(200).json({
      message: "Image uploaded successfully",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
