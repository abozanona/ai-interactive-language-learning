import { LatLngExpression } from 'leaflet';

export interface Place {
	id: string;
	name: string;
	type: string;
	coordinates: LatLngExpression;
	language: string;
	country: string;
	SpeechSynthesisCode: string;
}

export interface LanguageProgress {
	language: string;
	level: number;
	progress: number;
	topics: string[];
	hoursSpent: number;
}

export interface Message {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp: Date;
	translation?: string;
	pronunciation?: string;
	suggestions?: {
		text: string,
		isCorrect: boolean,
	}[];
	feedback?: string;
	correctAnswer?: string;
}

export interface ChatSettings {
	topic: string;
	mode: 'speaking' | 'writing';
	speed: number;
	complexity: number;
	place?: string;
}