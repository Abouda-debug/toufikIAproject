import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with ample capacity for camera image payloads
app.use(express.json({ limit: "25mb" }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La clé d'API GEMINI_API_KEY n'est pas configurée dans l'environnement.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "nowaste",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Extraction de date de péremption et informations produit via Gemini Vision
app.post("/api/scan-product", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: "Aucune image fournie pour l'analyse.",
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, "");

    const ai = getGeminiClient();

    const systemPrompt = `Tu es un systeme d'extraction d'informations produit a partir d'une photo d'emballage alimentaire.
Analyse l'image fournie et extrais :
1. Le nom du produit (marque + type)
2. La date de peremption (DLC, DLUO ou DDM)
3. La categorie : "frais", "sec", "surgele", "boisson", ou "autre"
4. Un score de confiance entre 0 et 1
Regles :
- Formats de date possibles : JJ/MM/AAAA, JJ.MM.AAAA, JJ/MM/AA, MM/AAAA
- Si l'annee est sur 2 chiffres, considere une annee entre l'annee
actuelle et +10 ans
- Si aucune date lisible, retourne "date_peremption": null et confiance a 0
- Ne confonds jamais la date de peremption avec un numero de lot,
code-barres, ou date de fabrication
- Privilegie la date precedee de "DLC", "a consommer avant/jusqu'au",
"date de peremption", ou "best before"
- Si l'image est floue ou ne montre pas un emballage alimentaire,
indique-le dans "erreur"
Reponds UNIQUEMENT en JSON, format exact :
{
"nom_produit": "string ou null",
"date_peremption": "AAAA-MM-JJ ou null",
"categorie": "frais|sec|surgele|boisson|autre",
"confiance": 0.0,
"erreur": null
}`;

    const promptText = "Analyse cette photo d'emballage alimentaire selon le prompt système fourni.";

    // Modèle principal optimisé pour la rapidité et quota élevé : gemini-3.1-flash-lite
    // Modèles de secours si indisponibilité : gemini-3.8-flash, gemini-flash-latest
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: cleanBase64,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                nom_produit: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Nom du produit (marque + type) ou null",
                },
                date_peremption: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Date de péremption AAAA-MM-JJ ou null",
                },
                categorie: {
                  type: Type.STRING,
                  enum: ["frais", "sec", "surgele", "boisson", "autre"],
                  description: "Catégorie : frais, sec, surgele, boisson, ou autre",
                },
                confiance: {
                  type: Type.NUMBER,
                  description: "Score de confiance entre 0 et 1",
                },
                erreur: {
                  type: Type.STRING,
                  nullable: true,
                  description: "Message d'erreur si flou ou non alimentaire, sinon null",
                },
              },
              required: ["nom_produit", "date_peremption", "categorie", "confiance", "erreur"],
            },
          },
        });

        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || String(err);
        const isQuota = errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.includes("quota");
        console.warn(`Modèle ${modelName} ${isQuota ? "quota atteint (429)" : "indisponible (503)"}, bascule sur secours.`);
        if (!isQuota) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }
    }

    if (!response || !response.text) {
      console.warn("Tous les modèles Gemini sont occupés ou quota atteint. Repli assisté sans bloquer.");
      return res.json({
        success: true,
        data: {
          nom_produit: null,
          date_peremption: null,
          categorie: "autre",
          confiance: 0.0,
          erreur: "Quota temporairement limité. Confirmez la date à l'aide de votre photo ci-dessous.",
        },
      });
    }

    const outputText = response.text ? response.text.trim() : "{}";
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(outputText);
    } catch {
      parsedData = {
        nom_produit: null,
        date_peremption: null,
        categorie: "autre",
        confiance: 0.0,
        erreur: "Impossible d'analyser l'image fournie.",
      };
    }

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Erreur scan produit Gemini:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erreur de communication avec le service Gemini.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur nowaste actif sur http://0.0.0.0:${PORT}`);
  });
}

startServer();
