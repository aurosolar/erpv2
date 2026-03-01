import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function extractDataFromImage(base64Image: string, ocrType: 'INVERSOR' | 'PLACAS' | 'BATERIA'): Promise<Record<string, string> | null> {
  try {
    let prompt = "";
    let responseSchema: any = {
      type: Type.OBJECT,
      properties: {
        serialNumber: { type: Type.STRING, description: "The serial number (S/N) found on the label." }
      },
      required: ["serialNumber"]
    };

    if (ocrType === 'PLACAS') {
      prompt = "Extract technical data from this solar panel label: Model, Power (Wp), VOC (Open Circuit Voltage), and ISC (Short Circuit Current).";
      responseSchema = {
        type: Type.OBJECT,
        properties: {
          model: { type: Type.STRING },
          powerWp: { type: Type.STRING },
          voc: { type: Type.STRING },
          isc: { type: Type.STRING }
        },
        required: ["model", "powerWp"]
      };
    } else {
      prompt = `Extract the serial number (S/N) from this ${ocrType.toLowerCase()} label.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });

    const text = response.text?.trim();
    if (!text) return null;
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error extracting data from image:", error);
    return null;
  }
}

// Deprecated in favor of extractDataFromImage but kept for compatibility if needed
export async function extractSerialNumber(base64Image: string): Promise<string | null> {
  const data = await extractDataFromImage(base64Image, 'INVERSOR');
  return data?.serialNumber || null;
}
