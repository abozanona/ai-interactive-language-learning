import React, { useState } from 'react';
import { levelLabels } from '../constants/index';
import {
	LanguageProgress
} from '../interfaces/index';
import { GlobeAltIcon, AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline';

const Profile: React.FC = () => {
	const [userProgress] = useState<LanguageProgress[]>([
		{
			language: 'Spanish',
			level: 2,
			progress: 65,
			topics: ['Greetings', 'Numbers', 'Family'],
			hoursSpent: 12,
		},
		{
			language: 'French',
			level: 1,
			progress: 30,
			topics: ['Basics', 'Greetings'],
			hoursSpent: 5,
		},
	]);

	const getLevelLabel = (level: number): string => {
		return levelLabels[level - 1] || 'Beginner';
	};

	return (
		<div className="container mx-auto p-4 max-w-7xl">
			{/* User Info */}
			<div className="card bg-base-100 shadow-xl mb-8">
				<div className="card-body">
					<div className="flex items-center gap-6">
						<div className="avatar placeholder">
							<div className="bg-primary text-primary-content rounded-full w-24 h-24">
								<span className="text-3xl">U</span>
							</div>
						</div>
						<div>
							<h2 className="card-title text-3xl">User Profile</h2>
							<p className="text-base-content/70">Member since: March 2024</p>
						</div>
					</div>
				</div>
			</div>

			{/* Language Progress */}
			<div className="mb-8">
				<h3 className="text-2xl font-bold mb-4">Language Progress</h3>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{userProgress.map((lang) => (
						<div key={lang.language} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
							<div className="card-body">
								<div className="flex items-center gap-2 mb-4">
									<GlobeAltIcon className="w-6 h-6 text-primary" />
									<h4 className="card-title">{lang.language}</h4>
								</div>

								<div className="mb-4">
									<div className="flex justify-between mb-2">
										<span className="text-base-content/70">Level: {getLevelLabel(lang.level)}</span>
										<span className="text-base-content/70">{lang.progress}%</span>
									</div>
									<progress
										className="progress progress-primary w-full"
										value={lang.progress}
										max="100"
									></progress>
								</div>

								<div className="mb-4">
									<p className="text-base-content/70 mb-2">Completed Topics:</p>
									<div className="flex flex-wrap gap-2">
										{lang.topics.map((topic) => (
											<div key={topic} className="badge badge-primary gap-1">
												<AcademicCapIcon className="w-4 h-4" />
												{topic}
											</div>
										))}
									</div>
								</div>

								<div className="flex items-center gap-2 text-base-content/70">
									<ClockIcon className="w-5 h-5" />
									<span>{lang.hoursSpent} hours spent learning</span>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Recent Activity */}
			<div>
				<h3 className="text-2xl font-bold mb-4">Recent Activity</h3>
				<div className="card bg-base-100 shadow-xl">
					<div className="card-body p-0">
						<div className="divide-y divide-base-300">
							<div className="p-4 flex justify-between items-center">
								<div>
									<h4 className="font-medium">Spanish Practice Session</h4>
									<p className="text-base-content/70">Café in Barcelona - Basic Conversations</p>
								</div>
								<span className="text-base-content/70">2 hours ago</span>
							</div>

							<div className="p-4 flex justify-between items-center">
								<div>
									<h4 className="font-medium">French Vocabulary Quiz</h4>
									<p className="text-base-content/70">Completed with 85% accuracy</p>
								</div>
								<span className="text-base-content/70">Yesterday</span>
							</div>

							<div className="p-4 flex justify-between items-center">
								<div>
									<h4 className="font-medium">New Language Started</h4>
									<p className="text-base-content/70">Added French to your learning languages</p>
								</div>
								<span className="text-base-content/70">3 days ago</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Profile;
