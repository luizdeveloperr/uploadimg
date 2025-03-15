import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Selecione um arquivo!");

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setImageUrl(data.url);
    } catch (error) {
      alert("Erro ao enviar!");
    }

    setUploading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Enviar Imagem</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={uploading}>
        {uploading ? "Enviando..." : "Enviar"}
      </button>

      {imageUrl && (
        <p>
          URL da imagem: <a href={imageUrl}>{imageUrl}</a>
        </p>
      )}
    </div>
  );
}
