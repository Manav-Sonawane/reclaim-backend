

export const uploadImage = async (req, res) => {
  try {
    console.log("Upload request received. File:", req.file); // DEBUG LOG

    if (!req.file) {
      console.error("No file in req.file");
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Cloudinary automatically uploads and puts info in req.file
    const imageUrl = req.file.path;
    console.log("Cloudinary Upload Success. URL:", imageUrl); // DEBUG LOG

    res.status(200).json({
      message: "Image uploaded successfully",
      url: imageUrl,
    });
  } catch (error) {
    console.error("Upload error in controller:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};
