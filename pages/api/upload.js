import { IncomingForm } from "formidable";
import cloudinary from "cloudinary";
import fs from "fs/promises";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_SIZE_MB = 10;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const form = new IncomingForm({ multiples: false, keepExtensions: true });

    const files = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });

    const file = files.file || files["file"] || Object.values(files)[0]; // Garante que pegamos o arquivo certo

    if (!file || !file.filepath) {
      return res.status(400).json({ error: "Nenhuma imagem enviada." });
    }

    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
      return res.status(400).json({ error: "Somente imagens são permitidas." });
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return res.status(400).json({ error: `A imagem excede o limite de ${MAX_SIZE_MB}MB` });
    }

    const fileBuffer = await fs.readFile(file.filepath);

    const uploadRes = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: "uploads", resource_type: "image" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    return res.status(200).json({ url: uploadRes.secure_url });
  } catch (error) {
    return res.status(500).json({ error: "Erro inesperado", details: error.message });
  }
}
