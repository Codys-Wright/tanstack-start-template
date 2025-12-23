import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Home, Search } from "lucide-react";
import { Button, Card, CardContent } from "@shadcn";

export const Route = createFileRoute("/$")({
	component: NotFoundPage,
});

function NotFoundPage() {
	const { _splat } = Route.useParams();

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl border-border/40 shadow-lg">
				<CardContent className="p-12">
					<div className="flex flex-col items-center text-center space-y-6">
						{/* 404 Number */}
						<div className="relative">
							<h1 className="text-9xl font-bold text-primary/20 select-none">
								404
							</h1>
							<div className="absolute inset-0 flex items-center justify-center">
								<Search className="w-16 h-16 text-muted-foreground/50" />
							</div>
						</div>

						{/* Message */}
						<div className="space-y-2">
							<h2 className="text-3xl font-bold tracking-tight">
								Page Not Found
							</h2>
							<p className="text-muted-foreground text-lg max-w-md">
								The page{" "}
								{_splat && (
									<code className="px-2 py-1 bg-muted rounded text-sm font-mono">
										/{_splat}
									</code>
								)}{" "}
								doesn't exist or has been moved.
							</p>
						</div>

						{/* Actions */}
						<div className="flex flex-col sm:flex-row gap-3 pt-4">
							<Button asChild size="lg" className="gap-2">
								<Link to="/">
									<Home className="w-4 h-4" />
									Go Home
								</Link>
							</Button>
							<Button
								asChild
								variant="outline"
								size="lg"
								className="gap-2"
								onClick={() => window.history.back()}
							>
								<button type="button">
									<ArrowLeft className="w-4 h-4" />
									Go Back
								</button>
							</Button>
						</div>

						{/* Helpful Links */}
						<div className="pt-8 border-t border-border/40 w-full">
							<p className="text-sm text-muted-foreground mb-3">
								You might be looking for:
							</p>
							<div className="flex flex-wrap gap-2 justify-center">
								<Button asChild variant="ghost" size="sm">
									<Link to="/">Home</Link>
								</Button>
								<Button asChild variant="ghost" size="sm">
									<Link to="/about">About</Link>
								</Button>
								<Button asChild variant="ghost" size="sm">
									<Link to="/settings">Settings</Link>
								</Button>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
