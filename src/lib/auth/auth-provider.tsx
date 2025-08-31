"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
	user: User | null;
	session: Session | null;
	loading: boolean;
	signInWithGitHub: () => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [loading, setLoading] = useState(true);
	const supabase = createClient();

	const handleUserSignIn = useCallback(async (user: User) => {
		try {
			// Call the onboarding API endpoint
			const response = await fetch("/api/auth/onboard", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to onboard user");
			}

			const result = await response.json();
			console.log("User onboarded:", result);
		} catch (error) {
			console.error("Error handling user sign in:", error);
		}
	}, []);

	useEffect(() => {
		// Get initial session
		const getSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);
		};

		getSession();

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(async (event, session) => {
			setSession(session);
			setUser(session?.user ?? null);
			setLoading(false);

			// Handle user creation/update after GitHub OAuth
			if (event === "SIGNED_IN" && session?.user) {
				await handleUserSignIn(session.user);
			}
		});

		return () => subscription.unsubscribe();
	}, [supabase.auth, handleUserSignIn]);

	const signInWithGitHub = async () => {
		const { error } = await supabase.auth.signInWithOAuth({
			provider: "github",
			options: {
				redirectTo: `${window.location.origin}/auth/callback`,
				scopes: "read:user user:email repo",
			},
		});
		if (error) throw error;
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) throw error;
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				session,
				loading,
				signInWithGitHub,
				signOut,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
