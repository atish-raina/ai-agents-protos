import OpenAI from "openai";

import readline from "node:readline/promises";
import { readFile } from "node:fs/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new OpenAI();

const instructions = await readFile(
  new URL("./prompts/instructions.txt", import.meta.url),
  "utf8"
);

// Only the CRM lookup tool for now
const allTools = JSON.parse(
  await readFile(new URL("./tools.json", import.meta.url), "utf8")
);
const tools = allTools.filter((t) => t.name === "lookup_crm_account");

const accounts = JSON.parse(
  await readFile(
    new URL("./mock-database/crm_accounts.json", import.meta.url),
    "utf8"
  )
);

function lookupCrmAccount({ query, include_deals }) {
  const q = query.toLowerCase();
  const account = accounts.find(
    (a) =>
      a.company_name.toLowerCase().includes(q) ||
      a.domain.toLowerCase() === q ||
      a.account_id.toLowerCase() === q
  );
  if (!account) return { error: `No account found for "${query}"` };
  if (include_deals) return account;
  const { deals, ...rest } = account;
  return rest;
}

const rl = readline.createInterface({ input, output });

// Chain responses so the model remembers earlier turns in this session
let previousResponseId;

console.log('Chat started. Type "exit" to end the session.\n');

while (true) {
  const prompt = (await rl.question("You: ")).trim();

  if (prompt.toLowerCase() === "exit") break;
  if (!prompt) continue;

  try {
    let response = await client.responses.create({
      model: "gpt-6-astra",
      // Instructions aren't carried over by previous_response_id, so send them every turn
      instructions,
      input: prompt,
      tools,
      previous_response_id: previousResponseId,
    });

    // Keep running tool calls until the model gives a final answer
    let calls = response.output.filter((item) => item.type === "function_call");
    while (calls.length > 0) {
      const outputs = calls.map((call) => {
        console.log(`[tool] ${call.name}(${call.arguments})`);
        const result = lookupCrmAccount(JSON.parse(call.arguments));
        return {
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result),
        };
      });

      response = await client.responses.create({
        model: "gpt-6-astra",
        instructions,
        input: outputs,
        tools,
        previous_response_id: response.id,
      });
      calls = response.output.filter((item) => item.type === "function_call");
    }

    previousResponseId = response.id;
    console.log(`\nAssistant: ${response.output_text}\n`);
  } catch (err) {
    console.error(`\nError: ${err.message}\n`);
  }
}

rl.close();
console.log("Session ended.");
