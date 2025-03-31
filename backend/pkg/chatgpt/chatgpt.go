package chatgpt

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

type ChatGPT struct {
	apiKey     string
	apiURL     string
	httpClient *http.Client
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Choices []Choice `json:"choices"`
}

type Choice struct {
	Index        int     `json:"index"`
	Message      Message `json:"message"`
	FinishReason string  `json:"finish_reason"`
}

func NewChatGPT(apiKey string) *ChatGPT {
	return &ChatGPT{
		apiKey:     apiKey,
		apiURL:     "https://api.openai.com/v1/chat/completions",
		httpClient: &http.Client{},
	}
}

func (c *ChatGPT) GenerateResponse(messages []Message) (*Message, error) {
	chatRequest := ChatRequest{
		Model:    "gpt-3.5-turbo",
		Messages: messages,
	}

	requestBody, err := json.Marshal(chatRequest)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	req, err := http.NewRequest("POST", c.apiURL, bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errorResponse struct {
			Error struct {
				Message string `json:"message"`
				Type    string `json:"type"`
				Code    string `json:"code"`
			} `json:"error"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&errorResponse); err != nil {
			return nil, fmt.Errorf("API request failed with status code %d and could not decode error response: %v", resp.StatusCode, err)
		}

		if errorResponse.Error.Message != "" {
			return nil, fmt.Errorf("OpenAI API error: %s (type: %s, code: %s)",
				errorResponse.Error.Message,
				errorResponse.Error.Type,
				errorResponse.Error.Code)
		}

		return nil, fmt.Errorf("API request failed with status code: %d", resp.StatusCode)
	}

	var chatResponse ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&chatResponse); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	if len(chatResponse.Choices) == 0 {
		return nil, fmt.Errorf("no response choices available")
	}

	return &chatResponse.Choices[0].Message, nil
}

func (c *ChatGPT) GenerateLanguageLearningResponse(userMessage, language string, settings map[string]interface{}, history []Message) (*Message, error) {
	if c.apiKey == "" {
		return nil, fmt.Errorf("OpenAI API key is not set")
	}

	if userMessage == "" {
		return nil, fmt.Errorf("user message cannot be empty")
	}

	if language == "" {
		return nil, fmt.Errorf("language cannot be empty")
	}

	// Keep only the last 10 messages to maintain relevant context without overloading
	maxHistoryLength := 10
	if len(history) > maxHistoryLength {
		history = history[len(history)-maxHistoryLength:]
	}

	// Add a summary of the conversation state if we have history
	conversationContext := ""
	if len(history) > 0 {
		conversationContext = fmt.Sprintf("Current Conversation State:\n- Messages exchanged: %d\n- Last user message: %s\n",
			len(history),
			history[len(history)-1].Content)
	}

	systemPrompt := fmt.Sprintf(`You are a helpful language tutor for %s language, acting as a conversation partner in an ongoing roleplay scenario.
You are at %s with the user, focusing on teaching the topic: %s.

ROLEPLAY AND CONVERSATION RULES:
1. Maintain consistent character and scenario throughout the entire conversation
2. Reference previous context and build upon it naturally
3. Keep track of what has been discussed and learned
4. Progress the conversation logically based on user responses
5. Stay in character and maintain the teaching scenario at all times

CRITICAL: YOU MUST INCLUDE ALL OF THE FOLLOWING SECTIONS IN EVERY RESPONSE, IN THIS EXACT ORDER:

1. First Line: Your next roleplay message in %s language (must continue the conversation naturally)
2. Second Line: "Translation:" followed by the English translation
3. Third Line: "Pronunciation:" followed by the pronunciation guide
4. Fourth Line (Only for non-initial messages): "Feedback:" followed by constructive feedback on user's previous response
5. Final Line: "Suggestions:" followed by a JSON array of 3 possible responses that make sense in the conversation

EXAMPLE MESSAGE:
Sehr gut! Möchten Sie noch etwas?
Translation: Very good! Would you like anything else?
Pronunciation: ZEHR goot! MOCH-ten zee NOCH et-vas?
Feedback: Excellent use of "Ja, bitte" - very natural and polite!
Suggestions: [{"text":"Nein, danke.", "isCorrect":true}, {"text":"Ich bin.", "isCorrect":false}, {"text":"Hallo gut.", "isCorrect":false}]

CONVERSATION CONTINUITY RULES:
- Each message must logically follow from the previous exchange
- Your message should acknowledge or react to the user's previous response
- Suggestions must be contextually appropriate for the current point in conversation
- Keep track of numbers or concepts already covered and build upon them
- Maintain the same level of formality throughout the conversation

IMPORTANT FORMATTING RULES:
- Each section MUST be on its own line
- Each section MUST be present (except Feedback in initial messages)
- Never skip the Translation or Pronunciation sections
- Suggestions MUST always include exactly 3 options with only 1 correct answer
- Suggestions MUST be in valid JSON format with "text" and "isCorrect" fields

ADDITIONAL RULES:
1. Use primarily %s language
2. Focus strictly on the topic: %s
3. Match beginner level by default
4. Adjust complexity (current: %v/10). Response words count depends on complexity. For complexity 0, don't include more than 4 or 5 words in the message.
5. Keep responses practical and conversational%s
`,
		language, settings["place"], settings["topic"], language, language, settings["topic"], settings["complexity"], conversationContext)

	messages := []Message{
		{Role: "system", Content: systemPrompt},
	}

	if len(history) > 0 {
		messages = append(messages, history...)
	}

	messages = append(messages, Message{Role: "user", Content: userMessage})

	return c.GenerateResponse(messages)
}
