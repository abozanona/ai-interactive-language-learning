import { Icon } from "leaflet";
import { Place } from "../interfaces/index";

export const mapContainerStyle = {
	height: '100%',
	width: '100%',
	position: 'relative' as const,
	zIndex: 1,
};

export const defaultIcon = new Icon({
	iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
	shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
	iconSize: [25, 41],
	iconAnchor: [12, 41],
});

export const languages = [
	{ code: 'en', name: 'English' },
	{ code: 'es', name: 'Spanish' },
	{ code: 'fr', name: 'French' },
	{ code: 'de', name: 'German' },
	{ code: 'it', name: 'Italian' },
	{ code: 'ja', name: 'Japanese' },
	{ code: 'ko', name: 'Korean' },
	{ code: 'zh', name: 'Chinese' },
	{ code: 'ar', name: 'Arabic' },
];

export const defaultPlaces: Place[] = [
	{
		id: '1',
		name: 'Five Guys restaurant',
		type: 'cafe',
		coordinates: [51.507351, -0.127758], // London
		language: 'en',
		country: 'United Kingdom',
		SpeechSynthesisCode: "en-GB"
	},
	{
		id: '2',
		name: 'Alhambra',
		type: 'tourism',
		coordinates: [40.4165, -3.7026], // Madrid
		language: 'es',
		country: 'Spain',
		SpeechSynthesisCode: "es-ES"
	},
	{
		id: '3',
		name: 'École Jeannine Manuel school',
		type: 'education',
		coordinates: [48.856614, 2.352222], // Paris
		language: 'fr',
		country: 'France',
		SpeechSynthesisCode: "fr-FR"
	},
	{
		id: '4',
		name: 'Die Hackeschen Hoefe',
		type: 'Shopping',
		coordinates: [52.5200, 13.4050], // Berlin
		language: 'de',
		country: 'Germany',
		SpeechSynthesisCode: "de-DE"
	},
	{
		id: '5',
		name: 'Li Rioni a Santiquattro',
		type: 'Pizza shop',
		coordinates: [41.9028, 12.4964], // Rome
		language: 'it',
		country: 'Italy',
		SpeechSynthesisCode: "it-IT"
	},
	{
		id: '6',
		name: 'The Westin Josun Seoul',
		type: 'Hotel',
		coordinates: [35.6895, 139.6917], // Tokyo
		language: 'ja',
		country: 'Japan',
		SpeechSynthesisCode: "ja-JP"
	},
	{
		id: '7',
		name: 'Seoul Language School',
		type: 'school',
		coordinates: [37.5665, 126.9780], // Seoul
		language: 'ko',
		country: 'South Korea',
		SpeechSynthesisCode: "ko-KR"
	},
	{
		id: '8',
		name: 'The pyramids',
		type: 'tourism',
		coordinates: [30.0444, 31.2357], // Cairo
		language: 'ar',
		country: 'Egypt',
		SpeechSynthesisCode: "ar-EG"
	}
];

export const levelLabels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Fluent'];
