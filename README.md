# Language Learning Platform

An interactive language learning platform with AI-powered conversations.

## Features [Not fully implemented]
- Interactive world map with buildings and points of interest
- Language-specific country filtering
- AI-powered conversation practice using ChatGPT
- Customizable learning sessions (topic, difficulty, speed)
- Conversation history tracking
- Word definitions and pronunciation
- User authentication and progress tracking

## Tech Stack
- Frontend: React
- Backend: Golang

## Getting Started

Server restarts every 5 minutes. To make sure that server is running, open this page in a new tab https://language-api.abozanona.me/cgi-bin/app.cgi . If the page keeps loading forever, this means that the server is up and running.

To build code: `GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o app.cgi`