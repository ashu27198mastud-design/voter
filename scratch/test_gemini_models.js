const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in environment");
    return;
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      console.log(`Success with model: ${modelName}`);
      return;
    } catch (e) {
      console.log(`Failed with model: ${modelName} - ${e.message}`);
    }
  }
}

listModels();
