
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIAction } from "../types";

export const processAudioWithGemini = async (
  base64Audio: string,
  mimeType: string,
  action: AIAction,
  existingText?: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const audioPart = {
    inlineData: {
      data: base64Audio,
      mimeType: mimeType,
    },
  };

  let prompt = "";

  switch (action) {
    case 'TRANSCRIBE':
      prompt = "Hãy chuyển đổi âm thanh này thành văn bản một cách chính xác nhất. Giữ nguyên ngôn ngữ gốc (ưu tiên tiếng Việt nếu có). Không thêm bớt ý kiến cá nhân.";
      break;
    case 'FORMAT':
      prompt = `Hãy định dạng lại đoạn văn bản sau đây cho chuyên nghiệp, thêm dấu câu, chia đoạn hợp lý và sửa lỗi chính tả: \n\n${existingText}`;
      break;
    case 'REPORT':
      prompt = `Dựa trên nội dung âm thanh và văn bản này, hãy viết một báo cáo tóm lược chuyên nghiệp với các tiêu đề mục rõ ràng: \n\n${existingText}`;
      break;
    case 'SUMMARY':
      prompt = `Hãy tóm tắt các ý chính quan trọng nhất từ nội dung sau đây một cách ngắn gọn: \n\n${existingText}`;
      break;
    case 'SUPPLEMENT':
      prompt = `Dựa trên ngữ cảnh của âm thanh và văn bản, hãy bổ sung các câu bị thiếu, làm rõ các ý còn dang dở hoặc suy luận một cách logic để hoàn thiện nội dung sao cho mạch lạc nhất: \n\n${existingText}`;
      break;
    default:
      prompt = "Xử lý văn bản.";
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [audioPart, { text: prompt }] },
  });

  return response.text || "Không thể xử lý nội dung này.";
};

export const refineTextWithGemini = async (
  text: string,
  action: AIAction
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = "";
  switch (action) {
    case 'FORMAT':
      prompt = "Hãy định dạng lại đoạn văn bản sau đây cho chuyên nghiệp, thêm dấu câu, chia đoạn hợp lý và sửa lỗi chính tả:";
      break;
    case 'REPORT':
      prompt = "Hãy viết một báo cáo chi tiết dựa trên nội dung văn bản dưới đây:";
      break;
    case 'SUMMARY':
      prompt = "Hãy tóm tắt các ý chính của văn bản sau:";
      break;
    case 'SUPPLEMENT':
      prompt = "Dựa trên văn bản dưới đây, hãy tìm những ý bị thiếu hoặc câu chưa hoàn chỉnh và bổ sung thêm cho đầy đủ, logic:";
      break;
    default:
      prompt = "Hãy tinh chỉnh văn bản này:";
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `${prompt}\n\n${text}`,
  });

  return response.text || "Không thể xử lý.";
};
