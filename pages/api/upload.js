export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  // Simulação de um link temporário (depois vamos armazenar de verdade)
  const fakeUrl = `https://enviarimg.com/${Math.random().toString(36).slice(2)}`;
  res.status(200).json({ url: fakeUrl });
}
