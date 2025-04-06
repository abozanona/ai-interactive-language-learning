package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"net/url"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"language-project/backend/pkg/gemini"

	"github.com/google/generative-ai-go/genai"
)

type TranslateRequest struct {
	Text       string `json:"text" binding:"required"`
	SourceLang string `json:"sourceLang" binding:"required"`
	TargetLang string `json:"targetLang" binding:"required"`
}

type TranslateResponse struct {
	TranslatedText string `json:"translated_text"`
}

type ChatHistoryItem struct {
	Role  string   `json:"role"`
	Parts []string `json:"Parts"` // Accepts raw strings from JSON
}

type ChatRequest struct {
	Message  string                 `json:"message" binding:"required"`
	Language string                 `json:"language" binding:"required"`
	Settings map[string]interface{} `json:"settings"`
	History  []ChatHistoryItem      `json:"history"`
}

func main() {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://abozanona.github.io"},
		AllowMethods:     []string{"GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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

	// Chat endpoint
	router.POST("/api/chat", func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		geminiClient := gemini.NewGemini(c)

		history := make([]*genai.Content, len(req.History))
		for i, item := range req.History {
			parts := make([]genai.Part, len(item.Parts))
			for j, part := range item.Parts {
				parts[j] = genai.Text(part) // Convert string to genai.Text
			}
			history[i] = &genai.Content{
				Role:  item.Role,
				Parts: parts,
			}
		}

		message, err := geminiClient.GenerateLanguageLearningResponse(
			req.Message,
			req.Language,
			req.Settings,
			history,
		)

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create response
		var text string
		if part, ok := message.Parts[0].(genai.Text); ok {
			text = string(part) // Convert genai.Text to string
		} else {
			log.Fatal("Failed to assert message part as genai.Text")
		}

		var res map[string]interface{}
		err = json.Unmarshal([]byte(text), &res)
		if err != nil {
			fmt.Printf("Error parsing JSON into map: %v\n", err)
			return
		}

		c.JSON(http.StatusOK, res)
	})

	// Start server
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
