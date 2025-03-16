import formidable from "formidable";
import fs from "fs";
import cloudinary from "cloudinary";

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = "/tmp"; // Diretório temporário para armazenar os arquivos
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Erro ao processar o arquivo" });

    try {
      const file = files.file;
      if (!file) return res.status(400).json({ error: "Nenhum arquivo enviado" });

      // Upload para o Cloudinary
      const uploadRes = await cloudinary.v2.uploader.upload(file.filepath, {
        folder: "uploads",
      });

      return res.status(200).json({ url: uploadRes.secure_url });
    } catch (error) {
      return res.status(500).json({ error: "Erro ao enviar para o Cloudinary", details: error.message });
    }
  });
}
