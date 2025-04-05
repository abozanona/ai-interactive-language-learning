import { defaultPlaces } from '../constants';
import { ChatSettings, Message, Place } from '../interfaces';

const server = "https://language-api.abozanona.me/server"
// const server = "http://localhost:8080"

export const startTopicConversation = async (placeId: string, settings: ChatSettings): Promise<Message | undefined> => {
	const place = defaultPlaces.find((p) => p.id === placeId);
	if (!place) return;

	try {
		const response = await fetch(server + '/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				message: 'START_CHAT',
				language: place.language,
				settings,
				history: []
			})
		});

		if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

		const data = await response.json();
		const aiResponse = {
			id: Date.now().toString(),
			text: data.text,
			translation: data.translation,
			pronunciation: data.pronunciation,
			suggestions: data.suggestions,
			feedback: data.feedback,
			correctAnswer: data.correctAnswer,
			sender: 'ai' as 'ai',
			timestamp: new Date()
		};
		return aiResponse;
	} catch (error) {
		console.error('Failed to start conversation:', error);
	}
};

export const sendMessage = async (
	history: { role: string; Parts: string[] }[],
	message: string,
	settings: ChatSettings,
	place: Place
): Promise<Message | undefined> => {
	const response = await fetch(server + '/api/chat', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			message: message,
			language: place.language,
			settings: {
				topic: settings.topic,
				mode: settings.mode,
				speed: settings.speed,
				complexity: settings.complexity,
				place: place.name
			},
			history: history
		})
	});

	if (!response.ok) {
		throw new Error(`API request failed with status ${response.status}`);
	}

	const data = await response.json();
	const aiResponse: Message = {
		id: (Date.now() + 1).toString(),
		text: data.text || 'No response text available',
		translation: data.translation,
		pronunciation: data.pronunciation,
		suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
		feedback: data.feedback,
		correctAnswer: data.correctAnswer,
		sender: 'ai',
		timestamp: new Date()
	};
	return aiResponse;
};

export const handleWordTranslation = async (word: string, language: string): Promise<string> => {
	try {
		const response = await fetch(server + '/api/translate', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				text: word,
				sourceLang: language,
				targetLang: 'en'
			})
		});

		if (!response.ok) throw new Error(`API request failed with status ${response.status}`);

		const data = await response.json();
		if (!data.translated_text) throw new Error('Translation not available');

		return data.translated_text;
	} catch (error) {
		console.error('Failed to translate word:', error);
		return '';
	}
};
