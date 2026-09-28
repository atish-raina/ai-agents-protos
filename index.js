import OpenAI from "openai";
import "dotenv/config";

const openAI = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, 
});

async function main() {
	const response = await openAI.responses.create({
		model: "gpt-5.6",
		input: "Explain the docker please",
	});

	console.log(response.output_text);
}

main()