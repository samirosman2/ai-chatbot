import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function getAIResponse(message: string): Promise<string> {
  try {
    console.log('Sending message to OpenAI:', message);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('OpenAI response:', completion.choices[0].message);
    return completion.choices[0].message.content || "I couldn't generate a response.";
    
  } catch (error) {
    console.error('Detailed AI error:', error);
    return "I'm sorry, I couldn't process your request at the moment.";
  }
}