import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyB-xLeGJ6bj9kmbRCQypnTothhdMjqNlN4";
const genAI = new GoogleGenerativeAI(apiKey);

async function list() {
  try {
    // There is no direct listModels in the new SDK as a simple method on genAI
    // but we can try to fetch it manually or use the admin client.
    // However, usually 404 on gemini-pro means the API is NOT enabled for this project.
    console.log("Checking API key access...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("test");
    console.log(result.response.text());
  } catch (err) {
    console.error("Error details:", JSON.stringify(err, null, 2));
  }
}

list();
