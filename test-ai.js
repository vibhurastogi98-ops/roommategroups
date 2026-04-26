import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyB-xLeGJ6bj9kmbRCQypnTothhdMjqNlN4";
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Hello");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Failed:", err);
  }
}

test();
