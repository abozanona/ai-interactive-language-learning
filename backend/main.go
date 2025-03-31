package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"language-project/backend/pkg/chatgpt"
)

type TranslateRequest struct {
	Text       string `json:"text" binding:"required"`
	SourceLang string `json:"sourceLang" binding:"required"`
	TargetLang string `json:"targetLang" binding:"required"`
}

type TranslateResponse struct {
	TranslatedText string `json:"translated_text"`
}

type ChatRequest struct {
	Message  string                 `json:"message" binding:"required"`
	Language string                 `json:"language" binding:"required"`
	Settings map[string]interface{} `json:"settings"`
	History  []chatgpt.Message      `json:"history"`
}

type Suggestion struct {
	Text      string `json:"text"`
	IsCorrect bool   `json:"isCorrect"`
}

type ChatResponse struct {
	Text          string       `json:"text"`
	Translation   string       `json:"translation,omitempty"`
	Pronunciation string       `json:"pronunciation,omitempty"`
	Suggestions   []Suggestion `json:"suggestions,omitempty"`
	Feedback      string       `json:"feedback,omitempty"`
	CorrectAnswer string       `json:"correctAnswer,omitempty"`
}

func main() {
	// Get OpenAI API key from environment variable
	apiKey := "sk-proj-YOUR_KEY_HERE"

	// Initialize ChatGPT client
	chatGPT := chatgpt.NewChatGPT(apiKey)

	router := gin.Default()

	// Configure CORS
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000"}
	config.AllowMethods = []string{"GET", "POST", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept"}
	router.Use(cors.New(config))

	// Routes
	// Translation endpoint
	router.POST("/api/translate", func(c *gin.Context) {
		var req TranslateRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Build MyMemory API URL
		apiURL := fmt.Sprintf("https://api.mymemory.translated.net/get?q=%s&langpair=%s|%s",
			url.QueryEscape(req.Text),
			url.QueryEscape(req.SourceLang),
			url.QueryEscape(req.TargetLang))

		// Make request to MyMemory API
		resp, err := http.Get(apiURL)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Translation service unavailable"})
			return
		}
		defer resp.Body.Close()

		// Read response
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read translation response"})
			return
		}

		// Parse response
		var myMemoryResponse struct {
			ResponseData struct {
				TranslatedText string `json:"translatedText"`
			} `json:"responseData"`
		}
		if err := json.Unmarshal(body, &myMemoryResponse); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse translation response"})
			return
		}

		// Return translated text
		c.JSON(http.StatusOK, TranslateResponse{
			TranslatedText: myMemoryResponse.ResponseData.TranslatedText,
		})
	})

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "healthy",
		})
	})

	// Chat endpoint
	router.POST("/api/chat", func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Remove any hardcoded suggestions since they're now handled by the ChatGPT system prompt

		// Generate response using ChatGPT
		message, err := chatGPT.GenerateLanguageLearningResponse(
			req.Message,
			req.Language,
			req.Settings,
			req.History,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create response based on whether it's an initial message or not
		isInitialMessage := len(req.History) == 0 && strings.Contains(req.Message, "START_CHAT")

		// For initial messages, create a response without feedback and correct answer fields
		response := ChatResponse{
			Text: message.Content,
		}

		// For initial messages, create a response without feedback and correct answer fields
		if isInitialMessage {
			response = ChatResponse{
				Text:          message.Content,
				Feedback:      "",
				CorrectAnswer: "",
			}
		}

		// Parse the response
		lines := strings.Split(message.Content, "\n")
		mainTextLines := make([]string, 0, len(lines))

		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" {
				continue
			}

			if strings.HasPrefix(line, "Translation:") {
				response.Translation = strings.TrimSpace(strings.TrimPrefix(line, "Translation:"))
			} else if strings.HasPrefix(line, "Pronunciation:") {
				response.Pronunciation = strings.TrimSpace(strings.TrimPrefix(line, "Pronunciation:"))
			} else if strings.HasPrefix(line, "Suggestions:") {
				suggestionsStr := strings.TrimSpace(strings.TrimPrefix(line, "Suggestions:"))

				var suggestions []Suggestion
				if err := json.Unmarshal([]byte(suggestionsStr), &suggestions); err == nil {
					response.Suggestions = make([]Suggestion, len(suggestions))
					for i, s := range suggestions {
						response.Suggestions[i] = s
					}
				} else {
					// If both parsing attempts fail, log the error
					log.Printf("Failed to parse suggestions: %v", err)
				}
			} else if strings.HasPrefix(line, "Feedback:") {
				if !isInitialMessage {
					response.Feedback = strings.TrimSpace(strings.TrimPrefix(line, "Feedback:"))
				}
			} else if strings.HasPrefix(line, "Correct Answer:") {
				if !isInitialMessage {
					response.CorrectAnswer = strings.TrimSpace(strings.TrimPrefix(line, "Correct Answer:"))
				}
			} else {
				mainTextLines = append(mainTextLines, line)
			}
		}

		// Update the text to include only the main content
		response.Text = strings.TrimSpace(strings.Join(mainTextLines, "\n"))

		c.JSON(http.StatusOK, response)
	})

	// Start server
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
