import OpenAI from "openai";
import "dotenv/config";
import fs from "node:fs";


const openAI = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, 
});

const instructions = fs.readFileSync(
	"./prompts/instructions.txt",
	"utf-8"
);

async function main() {
	const response = await openAI.responses.create({
		model: "gpt-5.6",
		input: "Explain kubernetes to me",
		instructions,
	});

	console.log(response.output_text);
}

main()