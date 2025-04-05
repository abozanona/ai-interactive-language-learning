package gemini

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

// Gemini struct for managing API key and context
type Gemini struct {
	apiKey string
	ctx    context.Context
}

// NewGemini initializes a new Gemini instance
func NewGemini(ctx context.Context) *Gemini {
	return &Gemini{
		apiKey: "EXAMPLE_KEY",
		ctx:    ctx,
	}
}

// GenerateResponse sends a message history to Gemini and receives a response
func (g *Gemini) GenerateResponse(messages []*genai.Content, userMessage string) (*genai.Content, error) {
	client, err := genai.NewClient(g.ctx, option.WithAPIKey(g.apiKey))
	if err != nil {
		log.Fatal(err)
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SetTemperature(0.7)

	chat := model.StartChat()
	chat.History = messages

	resp, err := chat.SendMessage(g.ctx, genai.Text(userMessage))
	if err != nil {
		log.Fatal(err)
	}

	var result strings.Builder
	for _, cand := range resp.Candidates {
		if cand.Content != nil {
			for _, part := range cand.Content.Parts {
				if text, ok := part.(genai.Text); ok {
					result.WriteString(string(text))
				}
			}
		}
	}
	output := result.String()
	if strings.HasPrefix(output, "```") {
		output = strings.ReplaceAll(output, "```", "")
		output = strings.ReplaceAll(output, "json", "")
		output = strings.TrimSpace(output)
	}
	println(output)

	return &genai.Content{
		Role:  "assistant",
		Parts: []genai.Part{genai.Text(output)},
	}, nil
}

// GenerateLanguageLearningResponse creates a structured prompt for language learning
func (g *Gemini) GenerateLanguageLearningResponse(userMessage, language string, settings map[string]interface{}, history []*genai.Content) (*genai.Content, error) {
	if g.apiKey == "" {
		return nil, fmt.Errorf("Gemini API key is not set")
	}

	if userMessage == "" {
		return nil, fmt.Errorf("user message cannot be empty")
	}

	if language == "" {
		return nil, fmt.Errorf("language cannot be empty")
	}

	maxHistoryLength := 10
	if len(history) > maxHistoryLength {
		history = history[len(history)-maxHistoryLength:]
	}

	conversationContext := ""
	if len(history) > 0 {
		conversationContext = fmt.Sprintf("Current Conversation State:\n- Messages exchanged: %d\n- Last user message: %s\n",
			len(history),
			history[len(history)-1].Parts[0].(genai.Text))
	}

	systemPrompt := fmt.Sprintf(`You are a helpful language tutor for %s language, acting as a conversation partner in an ongoing roleplay scenario.
You are at %s with the user, focusing on teaching the topic: %s.

ROLEPLAY AND CONVERSATION RULES:
1. Maintain consistent character and scenario throughout the entire conversation
2. Reference previous context and build upon it naturally
3. Keep track of what has been discussed and learned
4. Progress the conversation logically based on user responses
5. Stay in character and maintain the teaching scenario at all times

CRITICAL: YOUR REPLY MUST FOLLOW THIS JSON SCHEMA ALL THE TIME:

{
	"text": "<string>",
	"translation": "<string>",
	"pronunciation": <string>,
	"suggestions": <array: {text: <string>, "isCorrect": <string>}>,
	"feedback": <string>
}

where
<text> property is your next roleplay message in %s language (must continue the conversation naturally)
<translation> property is the English translation for <text>
<pronunciation> property is how <text> pronounced in english.
<suggestions> property is a JSON array of 3 possible responses that only one makes sense in the conversation, and the other two are not correct.
<feedback> property is Only for non-initial messages, and it's a constructive feedback on user's previous response telling if there's any language error in his message.

Examlpe object:

{
	"text": "Wie viele Finger hast du?",
	"translation": "How many fingers do you have?",
	"pronunciation": "Vee vee-leh Fing-ger hast doo?",
	"suggestions": [{"text": "Ich liebe meinen Job", isCorrect: false}. {"text": "Ich habe zehn Finger", isCorrect: true}, {"text": "Ich habe einen Finger", isCorrect: false}]
}


CONVERSATION CONTINUITY RULES:
- Each message must logically follow from the previous exchange
- Your message should acknowledge or react to the user's previous response
- Suggestions must be contextually appropriate for the current point in conversation
- Keep track of numbers or concepts already covered and build upon them
- Maintain the same level of formality throughout the conversation

IMPORTANT FORMATTING RULES:
- Each section MUST be present (except Feedback in initial messages)
- Never skip the Translation or Pronunciation sections or any other fields in the object.
- <suggestions> MUST always include exactly 3 options with only 1 correct answer
- <suggestions> MUST be in valid JSON format with "text" and "isCorrect" fields
- Do not format the response as Markdown or wrap it in code blocks. Only return plain JSON.
- Always wrap json properties with double quotation.
- Always have a question in your message to keep the conversation going.
- If the topic you are talking about is over, start a new conversation within the same topic the user has selected.

ADDITIONAL RULES:
1. Use primarily %s language
2. Focus strictly on the topic: %s
3. Match beginner level by default
4. Adjust complexity (current: %v/10). Response words count depends on complexity. For complexity 0, don't include more than 4 or 5 words in the message.
5. Keep responses practical and conversational%s`,
		language, settings["place"], settings["topic"], language, language, settings["topic"], settings["complexity"], conversationContext)

	messages := []*genai.Content{
		{
			Role: "user",
			Parts: []genai.Part{
				genai.Text(systemPrompt),
			},
		},
	}

	messages = append(messages, history...)

	return g.GenerateResponse(messages, userMessage)
}
