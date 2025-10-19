import 'dotenv/config';
import * as z from 'zod';
import { createAgent, tool } from 'langchain';
import { ChatOpenAI } from '@langchain/openai';
import { tavily } from '@tavily/core';

const tavilyClient = tavily({ apiKey: String(process.env.TAVILY_API_KEY) });

const systemPrompt = `
	You are a helpful AI assistant. You have access to the following tools:
	
	1. smart_weather: Searches for the current weather of a given city

	Use these tools to answer user queries effectively.
`;

export const smartWeather = tool(
	async ({ city }) => {
		const query = `current weather in ${city}`;
		const results = await tavilyClient.search(query);

		if (!results.results?.length) return `No search results for ${city}.`;

		return results.results
			.slice(0, 3)
			.map((r: any, i: number) => `${i + 1}. ${r.title}\n${r.content}\nURL: ${r.url}`)
			.join("\n\n");
	},
	{
		name: "smart_weather",
		description: "Searches the web and returns recent weather-related results.",
		schema: z.object({
			city: z.string(),
		}),
	}
);

const responseFormat = z.object({
	city: z.string(),
	currentTemperatureInFahrenheit: z.string(),
});

const model = new ChatOpenAI({
	model: 'gpt-4o-mini',
	temperature: 0.7,
	apiKey: String(process.env.OPENAI_API_KEY),
});

const agent = createAgent({
	model,
	tools: [ smartWeather ],
	systemPrompt,
	responseFormat,
});

const response = await agent.invoke({
	messages: [ { role: "user", content: "What's the weather in New York?" } ],
})

console.log(response.structuredResponse);