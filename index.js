import OpenAI from "openai";

import readline from "node:readline/promises";
import { readFile } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new OpenAI();

const instructions = await readFile(
  new URL("./prompts/instructions.txt", import.meta.url),
  "utf8"
);

const rl = readline.createInterface({ input, output });

// Chain responses so the model remembers earlier turns in this session
let previousResponseId;

console.log('Chat started. Type "exit" to end the session.\n');

while (true) {
  const prompt = (await rl.question("You: ")).trim();

  if (prompt.toLowerCase() === "exit") break;
  if (!prompt) continue;

  try {
    const response = await client.responses.create({
      model: "gpt-6-astra",
      // Instructions aren't carried over by previous_response_id, so send them every turn
      instructions,
      input: prompt,
      previous_response_id: previousResponseId,
    });

    previousResponseId = response.id;
    console.log(`\nAssistant: ${response.output_text}\n`);
  } catch (err) {
    console.error(`\nError: ${err.message}\n`);
  }
}

rl.close();
console.log("Session ended.");
