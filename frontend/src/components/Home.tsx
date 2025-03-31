import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobeAltIcon, ChatBubbleBottomCenterTextIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

const features = [
	{
		title: '3D World Exploration',
		description: 'Explore cities and buildings in an immersive 3D environment',
		icon: GlobeAltIcon,
	},
	{
		title: 'AI Language Partner',
		description: 'Practice conversations with an AI tutor tailored to your level',
		icon: ChatBubbleBottomCenterTextIcon,
	},
	{
		title: 'Customized Learning',
		description: 'Choose topics, difficulty levels, and learning pace that suits you',
		icon: AcademicCapIcon,
	},
];

interface HomeProps {
	onLogin: () => void;
}

const Home: React.FC<HomeProps> = ({ onLogin }) => {
	const navigate = useNavigate();

	return (
		<div className="min-h-screen bg-base-100">
			{/* Hero Section */}
			<div className="hero min-h-[70vh] bg-gradient-to-br from-primary to-secondary text-primary-content">
				<div className="hero-content text-center">
					<div className="max-w-3xl">
						<h1 className="text-5xl font-bold mb-8 animate-fade-in">
							Learn Languages Through Immersion
						</h1>
						<p className="text-xl mb-8 opacity-90">
							Travel virtually around the world and learn languages naturally through
							conversations with AI in real-world contexts
						</p>
						<button
							className="btn btn-accent btn-lg gap-2 animate-bounce-slow"
							onClick={() => {
								onLogin();
								navigate('/map');
							}}
						>
							Start Learning
							<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						</button>
					</div>
				</div>
			</div>

			{/* Features Section */}
			<div className="py-16 px-4 sm:px-6 lg:px-8 bg-base-200">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-base-content">Why Choose Language Explorer?</h2>
					</div>
					<div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => {
							const Icon = feature.icon;
							return (
								<div key={feature.title} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
									<div className="card-body items-center text-center">
										<div className="w-16 h-16 mb-4 text-primary">
											<Icon className="w-full h-full" />
										</div>
										<h3 className="card-title text-xl font-bold mb-2">{feature.title}</h3>
										<p className="text-base-content/80">{feature.description}</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>

			{/* Call to Action */}
			<div className="bg-accent text-accent-content py-12">
				<div className="max-w-3xl mx-auto text-center px-4">
					<h3 className="text-2xl font-bold mb-4">Ready to Start Your Language Journey?</h3>
					<p className="mb-6">Join thousands of learners who are already exploring new languages with us.</p>
					<button
						className="btn btn-primary btn-lg"
						onClick={() => {
							onLogin();
							navigate('/map');
						}}
					>
						Get Started Now
					</button>
				</div>
			</div>
		</div>
	);
};

export default Home;
