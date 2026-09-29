import OpenAI from "openai";
import "dotenv/config";
import fs from "node:fs";
import readLine from "readline";


const openAI = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY, 
});

const instructions = fs.readFileSync(
	"./prompts/instructions.txt",
	"utf-8"
);

const rl = readLine.createInterface({
	input: process.stdin,
	output: process.stdout,

});

let previousResponseId = null;

async function chat() {
	rl.question("AI:  ", async(query) => {
		try {
			const response = await openAI.responses.create({
				model: "gpt-5.6",
				input: query,
				instructions,
				...(previousResponseId && {
          			previous_response_id: previousResponseId,
        		}),
			});

			previousResponseId = response.id;
			console.log(response.output_text);

		} catch(error) {
			console.log('error::', error);
		}

		if(query === 'exit') {
			rl.close();
		} else {
			chat();
		}
	});	
}

chat();




