import { ProtectedRoute } from "@/lib/auth/protected-route";
import { AppShell } from "@/components/app-shell";

export default function SettingsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProtectedRoute>
			<AppShell>{children}</AppShell>
		</ProtectedRoute>
	);
}
