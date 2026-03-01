import { GoogleGenAI, Type } from "@google/genai";
import { CategoriaGasto, TipoDocumentoGasto } from "../types/obra";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface OcrResult {
  proveedor: string;
  numeroDocumento: string;
  tipoDocumento: TipoDocumentoGasto;
  importe: number;
  concepto: string;
  categoria: CategoriaGasto;
}

export const ocrService = {
  async processReceipt(base64Image: string): Promise<OcrResult> {
    const prompt = `Analiza esta imagen de un ticket, factura o albarán de gasto. 
    Extrae los siguientes datos en formato JSON:
    - proveedor: Nombre del comercio o empresa.
    - numeroDocumento: Número de factura, ticket o albarán. Si no lo encuentras, pon "Desconocido".
    - tipoDocumento: Clasifica el documento en una de estas opciones: FACTURA, FACTURA_SIMPLIFICADA, ALBARAN, OTRO.
    - importe: Importe total (solo el número).
    - concepto: Breve descripción de lo comprado.
    - categoria: Clasifica el gasto en una de estas categorías: COMBUSTIBLE, MATERIAL, DIETAS, PEAJE, OTROS.
    
    Responde ÚNICAMENTE con el objeto JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            proveedor: { type: Type.STRING },
            numeroDocumento: { type: Type.STRING },
            tipoDocumento: { 
              type: Type.STRING,
              description: "Una de: FACTURA, FACTURA_SIMPLIFICADA, ALBARAN, OTRO"
            },
            importe: { type: Type.NUMBER },
            concepto: { type: Type.STRING },
            categoria: { 
              type: Type.STRING,
              description: "Una de: COMBUSTIBLE, MATERIAL, DIETAS, PEAJE, OTROS"
            },
          },
          required: ["proveedor", "numeroDocumento", "tipoDocumento", "importe", "concepto", "categoria"],
        },
      },
    });

    try {
      return JSON.parse(response.text || "{}") as OcrResult;
    } catch (e) {
      console.error("Error parsing OCR response", e);
      throw new Error("No se pudo procesar el ticket correctamente.");
    }
  },
};
