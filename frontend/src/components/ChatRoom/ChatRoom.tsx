import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { defaultPlaces } from '../../constants';
import styles from './ChatRoom.module.css';
import {
	ChatBubbleLeftIcon,
	AdjustmentsHorizontalIcon,
	SpeakerWaveIcon,
	PaperAirplaneIcon,
	InformationCircleIcon,
	CheckCircleIcon,
	XCircleIcon
} from '@heroicons/react/24/outline';

interface ChatSettings {
	topic: string;
	mode: string;
	speed: number;
	complexity: number;
	place: string;
	voice: SpeechSynthesisVoice | null;
}

interface Feedback {
	text: string;
	isCorrect: boolean;
}

interface Message {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp: Date;
	translation?: string;
	pronunciation?: string;
	suggestions?: { text: string; isCorrect: boolean }[];
	feedback?: Feedback;
	correctAnswer?: string;
}

const topics = [
	'Numbers and Counting',
	'Greetings and Basic Phrases',
	'Family and Relationships',
	'Food and Dining',
	'Travel and Directions',
	'Shopping and Money',
	'Weather and Seasons',
	'Hobbies and Activities',
	'Work and Professions',
	'Culture and Traditions',
];

const ChatRoom: React.FC = () => {
	const { placeId } = useParams<{ placeId: string }>();
	const [messages, setMessages] = useState<Message[]>([]);
	const [inputMessage, setInputMessage] = useState('');
	const messagesEndRef = useRef<null | HTMLDivElement>(null);
	const [settings, setSettings] = useState<ChatSettings>({
		topic: topics[0],
		mode: 'speaking',
		speed: 0,
		complexity: 0,
		place: '',
		voice: null,
	});
	const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
	const [selectedWord, setSelectedWord] = useState<string | null>(null);
	const [feedback, setFeedback] = useState<Feedback | null>(null);
	const [selectedSuggestions, setSelectedSuggestions] = useState<Record<string, string>>({});
	const [wordTranslation, setWordTranslation] = useState<{ word: string; translation: string } | null>(null);
	const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
	const [showSettings, setShowSettings] = useState(false);

	const getPlaceInfo = () => {
		return defaultPlaces.find(p => p.id === placeId);
	};

	const startTopicConversation = async () => {
		const place = getPlaceInfo();
		if (!place) return;

		try {
			const response = await fetch('http://localhost:8080/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: 'START_CHAT',
					language: place.language,
					settings: {
						topic: settings.topic,
						mode: settings.mode,
						speed: settings.speed,
						complexity: settings.complexity,
						place: place.name,
					},
					history: [],
				}),
			});

			if (!response.ok) {
				throw new Error(`API request failed with status ${response.status}`);
			}

			const data = await response.json();
			const aiResponse: Message = {
				id: Date.now().toString(),
				text: data.text,
				translation: data.translation,
				pronunciation: data.pronunciation,
				suggestions: data.suggestions,
				feedback: data.feedback,
				correctAnswer: data.correctAnswer,
				sender: 'ai',
				timestamp: new Date(),
			};

			setMessages([aiResponse]);
		} catch (error) {
			console.error('Failed to start conversation:', error);
		}
	};

	useEffect(() => {
		if (placeId) {
			const place = getPlaceInfo();
			if (place) {
				setSettings(prev => ({ ...prev, place: place.name }));
			}
		}
	}, [placeId]);

	useEffect(() => {
		if (settings.place && placeId) {
			startTopicConversation();
		}
	}, [settings.topic, settings.place]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleCloseTooltip = () => {
		setWordTranslation(null);
		setTooltipPosition(null);
	};

	const updateVoices = () => {
		const placeInfo = getPlaceInfo();
		if (!placeInfo) return;

		const voices = window.speechSynthesis.getVoices();
		const languageVoices = voices.filter(voice => voice.lang.startsWith(placeInfo.SpeechSynthesisCode));
		setAvailableVoices(languageVoices);

		// Set default voice if none selected
		if (!settings.voice && languageVoices.length > 0) {
			setSettings(prev => ({ ...prev, voice: languageVoices[0] }));
		}
	};

	useEffect(() => {
		// Initial voices load
		updateVoices();

		// Handle dynamic voice loading
		window.speechSynthesis.onvoiceschanged = updateVoices;

		return () => {
			window.speechSynthesis.onvoiceschanged = null;
		};
	}, []);

	const pronounceWord = (word: string) => {
		const utterance = new SpeechSynthesisUtterance(word);
		utterance.lang = getPlaceInfo()?.SpeechSynthesisCode || 'en-US';
		utterance.rate = settings.speed / 10;
		if (settings.voice) {
			utterance.voice = settings.voice;
		}
		window.speechSynthesis.speak(utterance);
	};

	const handleWordClick = async (word: string, event: React.MouseEvent<HTMLSpanElement>) => {
		event.preventDefault();
		const place = getPlaceInfo();
		if (!place) return;

		try {
			const response = await fetch('http://localhost:8080/api/translate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					text: word,
					sourceLang: place.language,
					targetLang: 'en',
				}),
			});

			if (!response.ok) {
				throw new Error(`API request failed with status ${response.status}`);
			}

			const data = await response.json();
			if (!data.translated_text) {
				throw new Error('Translation not available');
			}

			const rect = (event.target as HTMLElement).getBoundingClientRect();
			const padding = 20; // Space between tooltip and word

			// Calculate initial position
			let x = rect.left + (rect.width / 2) + window.scrollX;
			let y = rect.bottom + padding + window.scrollY;

			// Ensure tooltip stays within viewport
			const tooltipWidth = 200; // min-w-[200px]
			const viewportWidth = window.innerWidth;

			// Adjust horizontal position if too close to edges
			x = Math.min(Math.max(tooltipWidth / 2, x), viewportWidth - (tooltipWidth / 2));

			setWordTranslation({ word, translation: data.translated_text });
			setTooltipPosition({ x, y });
		} catch (error) {
			console.error('Failed to translate word:', error);
		}
	};

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (wordTranslation && tooltipPosition) {
				const tooltip = document.querySelector('.word-translation-tooltip');
				if (tooltip && !tooltip.contains(event.target as Node)) {
					handleCloseTooltip();
				}
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [wordTranslation, tooltipPosition]);

	const handleSendMessage = async () => {
		if (!inputMessage.trim()) return;

		const currentMessage = inputMessage;
		const newMessage: Message = {
			id: Date.now().toString(),
			text: currentMessage,
			sender: 'user',
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, newMessage]);
		setInputMessage('');

		const place = getPlaceInfo();
		if (!place) return;

		try {
			const conversationHistory = messages.map(msg => ({
				role: msg.sender === 'user' ? 'user' : 'assistant',
				content: msg.text
			}));

			const response = await fetch('http://localhost:8080/api/chat', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					message: currentMessage,
					language: place.language,
					settings: {
						topic: settings.topic,
						mode: settings.mode,
						speed: settings.speed,
						complexity: settings.complexity,
						place: place.name,
					},
					history: conversationHistory,
				}),
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
				feedback: data.feedback && typeof data.feedback === 'object' &&
					'text' in data.feedback && 'isCorrect' in data.feedback ? {
					text: String(data.feedback.text),
					isCorrect: Boolean(data.feedback.isCorrect)
				} : undefined,
				correctAnswer: data.correctAnswer,
				sender: 'ai',
				timestamp: new Date(),
			};

			setMessages((prev) => [...prev, aiResponse]);
		} catch (error) {
			console.error('Failed to get AI response:', error);
			const errorMessage: Message = {
				id: (Date.now() + 1).toString(),
				text: 'Sorry, I encountered an error. Please try again.',
				sender: 'ai',
				timestamp: new Date(),
			};
			setMessages((prev) => [...prev, errorMessage]);
		}
	};

	const renderFeedback = (feedback: Feedback | undefined) => {
		try {
			if (!feedback || typeof feedback.isCorrect !== 'boolean' || typeof feedback.text !== 'string') {
				return null;
			}

			const { isCorrect, text } = feedback;
			if (!text.trim()) return null;

			return (
				<div
					className={`flex items-center gap-2 mt-2 ${isCorrect ? 'text-success' : 'text-error'}`}
					role="status"
					aria-live="polite"
				>
					{isCorrect ? (
						<CheckCircleIcon className="h-5 w-5" aria-label="Correct" />
					) : (
						<XCircleIcon className="h-5 w-5" aria-label="Incorrect" />
					)}
					<span className="text-base-content">{text}</span>
				</div>
			);
		} catch (error) {
			console.error('Error rendering feedback:', error);
			return null;
		}
	};

	const renderSuggestions = (message: Message) => {
		if (!message.suggestions || message.suggestions.length === 0) return null;

		const selectedSuggestion = selectedSuggestions[message.id];

		return (
			<div className="flex flex-wrap gap-2 mt-2">
				{message.suggestions?.map((suggestion, index) => {
					const isSelected = selectedSuggestion === suggestion.text;
					const buttonClass = isSelected
						? suggestion.isCorrect
							? 'btn-success text-success-content'
							: 'btn-error text-error-content'
						: 'btn-outline hover:btn-primary';

					return (
						<div key={index} className="flex items-center gap-2">
							<button
								className={`btn btn-sm ${buttonClass} transition-colors duration-200`}
								onClick={() => {
									setSelectedSuggestions(prev => ({ ...prev, [message.id]: suggestion.text }));
									setInputMessage(suggestion.text);

									const utterance = new SpeechSynthesisUtterance(suggestion.text);
									utterance.lang = getPlaceInfo()?.SpeechSynthesisCode || 'en-US';
									utterance.rate = settings.speed / 10;
									if (settings.voice) {
										utterance.voice = settings.voice;
									}
									window.speechSynthesis.speak(utterance);
								}}
								aria-label={`Suggestion: ${suggestion.text}${isSelected ? suggestion.isCorrect ? ' (Correct)' : ' (Incorrect)' : ''}`}
							>
								<span className="flex items-center gap-2 relative pr-6">
									{suggestion.text}
									<span className="absolute right-0">
										{suggestion.isCorrect && isSelected && (
											<CheckCircleIcon className="h-4 w-4 text-success" aria-hidden="true" />
										)}
										{!suggestion.isCorrect && isSelected && (
											<XCircleIcon className="h-4 w-4 text-error" aria-hidden="true" />
										)}
									</span>
								</span>
							</button>
							<button
								className="btn btn-circle btn-xs hover:btn-primary tooltip tooltip-left"
								onClick={(e) => {
									handleWordClick(suggestion.text, e);
								}}
								aria-label={`Show translation of ${suggestion.text}`}
							>
								<InformationCircleIcon className="h-5 w-5" aria-hidden="true" />
							</button>
						</div>
					);
				})}
			</div>
		);
	};

	const renderMessage = (message: Message) => {
		const isUser = message.sender === 'user';

		const renderClickableText = (text: string) => {
			const words = text.split(/\s+/);
			return words.map((word, index) => (
				<React.Fragment key={index}>
					<span
						className="cursor-pointer hover:text-primary hover:underline"
						onClick={(e) => handleWordClick(word, e)}
					>
						{word}
					</span>
					{index < words.length - 1 ? ' ' : ''}
				</React.Fragment>
			));
		};

		return (
			<div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
				<div className={`rounded-lg px-4 py-2 max-w-[70%] ${isUser ? 'bg-primary/5 text-primary border border-primary/10' : 'bg-base-100 text-base-content border border-base-200'}`}>
					<div className="text-base-content">{renderClickableText(message.text)}</div>
					{!isUser && message.translation && (
						<div className="text-sm text-base-content/70 mt-2">{message.translation}</div>
					)}
					{!isUser && message.pronunciation && (
						<div className="flex items-center gap-2 mt-2">
							<span className="text-sm text-base-content/70 italic">{message.pronunciation}</span>
							<button
								className="btn btn-circle btn-xs hover:btn-primary"
								onClick={() => pronounceWord(message.text)}
								aria-label="Pronounce message"
							>
								<SpeakerWaveIcon className="w-4 h-4" aria-hidden="true" />
							</button>
						</div>
					)}
					{!isUser && renderFeedback(message.feedback)}
					{!isUser && message.suggestions && renderSuggestions(message)}
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto p-4 relative">
			{wordTranslation && tooltipPosition && (
				<div
					className="fixed bg-base-300 rounded-lg shadow-xl p-3 z-50 word-translation-tooltip min-w-[200px] animate-fadeIn"
					style={{
						left: `${tooltipPosition.x}px`,
						top: `${tooltipPosition.y}px`,
						transform: 'translate(-50%, 0)',
						maxWidth: 'calc(100vw - 40px)',
					}}
				>
					<div className="flex items-center justify-between gap-4">
						<div>
							<div className="font-bold">{wordTranslation.word}</div>
							<div className="text-sm">{wordTranslation.translation}</div>
						</div>
						<div className="flex gap-2">
							<button
								className="btn btn-circle btn-xs hover:btn-primary"
								onClick={() => pronounceWord(wordTranslation.word)}
								aria-label="Pronounce word"
							>
								<SpeakerWaveIcon className="h-4 w-4" aria-hidden="true" />
							</button>
							<button
								className="btn btn-circle btn-xs hover:btn-primary"
								onClick={handleCloseTooltip}
								aria-label="Close translation"
							>
								<XCircleIcon className="h-4 w-4" aria-hidden="true" />
							</button>
						</div>
					</div>
				</div>
			)}
			<div className="z-10 bg-base-100 border-b border-base-200 px-4 py-2">
				{showSettings && (
					<div className="max-w-7xl mx-auto py-4 border-t border-base-200 mt-2">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="form-control">
								<label className="label">
									<span className="label-text">Topic</span>
								</label>
								<select
									className={styles.topicSelector}
									value={settings.topic}
									onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
								>
									{topics.map((topic) => (
										<option key={topic} value={topic}>
											{topic}
										</option>
									))}
								</select>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Mode</span>
								</label>
								<select
									className={styles.topicSelector}
									value={settings.mode}
									onChange={(e) => setSettings({ ...settings, mode: e.target.value as 'speaking' | 'writing' })}
								>
									<option value="speaking">Speaking</option>
									<option value="writing">Writing</option>
								</select>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Speed</span>
									<div className={styles.tooltip} data-tip="Adjust conversation pace">
										<InformationCircleIcon className="w-4 h-4" />
									</div>
								</label>
								<input
									type="range"
									min="0"
									max="10"
									step="1"
									value={settings.speed}
									onChange={(e) => setSettings({ ...settings, speed: parseFloat(e.target.value) })}
									className={styles.slider}
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Complexity</span>
									<div className={styles.tooltip} data-tip="Adjust language difficulty">
										<InformationCircleIcon className="w-4 h-4" />
									</div>
								</label>
								<input
									type="range"
									min="0"
									max="10"
									step="1"
									value={settings.complexity}
									onChange={(e) => setSettings({ ...settings, complexity: parseFloat(e.target.value) })}
									className={styles.slider}
								/>
							</div>

							<div className="form-control">
								<label className="label">
									<span className="label-text">Voice</span>
									<div className={styles.tooltip} data-tip="Select voice for pronunciation">
										<InformationCircleIcon className="w-4 h-4" />
									</div>
								</label>
								<select
									className={styles.topicSelector}
									value={settings.voice?.voiceURI || ''}
									onChange={(e) => {
										const selectedVoice = availableVoices.find(v => v.voiceURI === e.target.value) || null;
										setSettings(prev => ({ ...prev, voice: selectedVoice }));
									}}
								>
									{availableVoices.map((voice) => (
										<option key={voice.voiceURI} value={voice.voiceURI}>
											{voice.name}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between max-w-7xl mx-auto">
				<button
					className={`btn btn-circle btn-sm ${showSettings ? 'btn-primary' : ''}`}
					onClick={() => setShowSettings(!showSettings)}
					aria-label={showSettings ? 'Hide settings' : 'Show settings'}
				>
					<AdjustmentsHorizontalIcon className="w-5 h-5" />
				</button>
			</div>

			<div className={`${styles.messageContainer} ${showSettings ? 'mt-32' : 'mt-16'}`}>
				{messages.map(renderMessage)}
				<div ref={messagesEndRef} />
			</div>

			<div className={styles.inputContainer}>
				<div className={styles.inputWrapper}>
					<input
						type="text"
						placeholder="Type your message..."
						className="input input-bordered flex-1"
						value={inputMessage}
						onChange={(e) => setInputMessage(e.target.value)}
						onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
					/>
					<button
						className="btn btn-primary"
						onClick={handleSendMessage}
						disabled={!inputMessage.trim()}
					>
						<PaperAirplaneIcon className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

export default ChatRoom;
