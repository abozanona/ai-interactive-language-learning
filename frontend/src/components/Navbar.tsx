import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobeAltIcon, MapIcon, UserCircleIcon } from '@heroicons/react/24/outline';

interface NavbarProps {
	isAuthenticated: boolean;
	onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ isAuthenticated, onLogout }) => {
	const navigate = useNavigate();

	return (
		<div className="navbar bg-base-100 shadow-lg px-4">
			<div className="flex-1">
				<button
					className="btn btn-ghost normal-case text-xl gap-2"
					onClick={() => navigate('/')}
				>
					<GlobeAltIcon className="h-6 w-6 text-primary" />
					<span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
						Language Explorer
					</span>
				</button>
			</div>
			<div className="flex-none gap-2">
				{isAuthenticated ? (
					<>
						<button
							className="btn btn-ghost gap-2"
							onClick={() => navigate('/map')}
						>
							<MapIcon className="h-5 w-5" />
							Explore Map
						</button>
						<button
							className="btn btn-ghost gap-2"
							onClick={() => navigate('/profile')}
						>
							<UserCircleIcon className="h-5 w-5" />
							Profile
						</button>
						<button
							className="btn btn-outline btn-error"
							onClick={onLogout}
						>
							Logout
						</button>
					</>
				) : (
					<button
						className="btn btn-primary"
						onClick={() => navigate('/')}
					>
						Login
					</button>
				)}
			</div>
		</div>
	);
};

export default Navbar;
