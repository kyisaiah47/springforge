import { ProtectedRoute } from "@/lib/auth/protected-route";
import { AppShell } from "@/components/app-shell";

export default function DashboardLayout({
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
