import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import 'leaflet/dist/leaflet.css';
import { mapContainerStyle, defaultIcon, languages, defaultPlaces } from '../constants/index';
import { Place } from '../interfaces/index';

// Component to update map view when language changes
const MapUpdater: React.FC<{ places: Place[] }> = ({ places }) => {
	const map = useMap();

	useEffect(() => {
		if (places.length > 0) {
			const latLngs = places.map(place => place.coordinates);
			const bounds = latLngs.reduce(
				(bounds, latLng) => bounds.extend(latLng),
				map.getBounds()
			);
			map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
		}
	}, [places, map]);

	return null;
};

const WorldMap: React.FC = () => {
	const navigate = useNavigate();
	const [selectedLanguage, setSelectedLanguage] = useState<string>('');
	const [places, setPlaces] = useState<Place[]>([]);

	useEffect(() => {
		// Default places to show on initial load
		if (!selectedLanguage) {
			setPlaces(defaultPlaces);
			return;
		}

		// Here we would fetch places for the selected language
		// For now, we'll use the same places for demonstration
		setPlaces(defaultPlaces);
	}, [selectedLanguage]);

	const defaultCenter: LatLngExpression = [20, 0];

	return (
		<div className="relative h-[calc(100vh-64px)]">
			<MapContainer
				center={defaultCenter}
				zoom={2}
				style={mapContainerStyle}
				scrollWheelZoom={true}
				className="h-full w-full"
			>
				<TileLayer
					url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
					minZoom={4}
				/>
				{places.map((place) => (
					<Marker
						key={place.id}
						position={place.coordinates}
						icon={defaultIcon}
					>
						<Popup>
							<div className="card bg-base-100 shadow-xl w-64">
								<div className="card-body p-4 text-center">
									<h3 className="card-title justify-center text-lg font-bold mb-2">
										{place.name}
									</h3>
									<div className="space-y-2 mb-4">
										<div className="badge badge-outline gap-1">
											<GlobeAltIcon className="w-4 h-4" />
											{place.type}
										</div>
										<p className="text-sm">
											<span className="font-semibold">Language:</span>{' '}
											{languages.find(l => l.code === place.language)?.name}
										</p>
										<p className="text-sm">
											<span className="font-semibold">Country:</span> {place.country}
										</p>
									</div>
									<button
										className="btn btn-primary btn-sm w-full gap-2"
										onClick={() => navigate(`/chat/${place.id}`)}
									>
										Start Chat
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M13 7l5 5m0 0l-5 5m5-5H6"
											/>
										</svg>
									</button>
								</div>
							</div>
						</Popup>
					</Marker>
				))}
				<MapUpdater places={places} />
			</MapContainer>
		</div>
	);
};

export default WorldMap;
