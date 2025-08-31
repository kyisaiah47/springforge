import Link from "next/link";

export default function AuthCodeErrorPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						Authentication Error
					</h2>
					<p className="mt-2 text-center text-sm text-gray-600">
						There was an error signing you in. Please try again.
					</p>
				</div>
				<div>
					<Link
						href="/login"
						className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
					>
						Try Again
					</Link>
				</div>
			</div>
		</div>
	);
}
