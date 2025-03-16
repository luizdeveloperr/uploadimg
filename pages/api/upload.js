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
    bodyParser: false, // Next.js precisa que o body parser esteja desativado para uploads de arquivos
  },
};

const MAX_SIZE_MB = 10;

const parseForm = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: false, keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const files = await parseForm(req);
    const file = files.file || files["file"] || Object.values(files)[0];

    if (!file) {
      console.error("Nenhum arquivo recebido.");
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const filePath = file.filepath || file.path || (Array.isArray(file) ? file[0].filepath : null);

    if (!filePath) {
      console.error("Caminho do arquivo indefinido.");
      return res.status(500).json({ error: "Erro ao obter o caminho do arquivo." });
    }

    console.log("Arquivo recebido:", file.originalFilename);
    console.log("Tamanho do arquivo:", file.size / (1024 * 1024), "MB");
    console.log("Tipo do arquivo:", file.mimetype);
    console.log("Caminho do arquivo:", filePath);

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      console.error(`Arquivo maior que ${MAX_SIZE_MB}MB.`);
      return res.status(400).json({ error: `O arquivo excede o limite de ${MAX_SIZE_MB}MB` });
    }

    const isVideo = file.mimetype.startsWith("video/");

    console.log("Lendo o arquivo...");
    const fileBuffer = await fs.readFile(filePath);

    console.log("Iniciando upload para o Cloudinary...");
    const uploadRes = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.v2.uploader.upload_stream(
        { folder: "uploads", resource_type: isVideo ? "video" : "image" },
        (error, result) => {
          if (error) {
            console.error("Erro no Cloudinary:", error);
            return reject(error);
          }
          resolve(result);
        }
      );
      uploadStream.end(fileBuffer);
    });

    console.log("Upload concluído com sucesso:", uploadRes.secure_url);
    return res.status(200).json({ url: uploadRes.secure_url });
  } catch (error) {
    console.error("Erro inesperado:", error);
    return res.status(500).json({ error: "Erro inesperado", details: error.message });
  }
}
