import { Avatar, cn, Skeleton } 
from "@shadcn"
import { UserRoundIcon } from "lucide-react"
import type { ComponentProps } from "react"
import type { User } from "../../../domain/index.js"

export interface UserAvatarClassNames {
	base?: string
	image?: string
	fallback?: string
	fallbackIcon?: string
	skeleton?: string
}

export interface UserAvatarProps {
	classNames?: UserAvatarClassNames
	isPending?: boolean
	size?: "sm" | "default" | "lg" | "xl" | null
	user?: User | null
}

/**
 * Displays a user avatar with image and fallback support
 *
 * Renders a user's avatar image when available, with appropriate fallbacks:
 * - Shows a skeleton when isPending is true
 * - Displays first two characters of user's name when no image is available
 * - Falls back to a generic user icon when neither image nor name is available
 */
export function UserAvatar({
	className,
	classNames,
	isPending,
	size,
	user,
	...props
}: UserAvatarProps & ComponentProps<typeof Avatar>) {
	const name = user?.name || user?.email
	const userImage = user?.image

	if (isPending) {
		return (
			<Skeleton
				className={cn(
					"shrink-0 rounded-full",
					size === "sm"
						? "size-6"
						: size === "lg"
							? "size-10"
							: size === "xl"
								? "size-12"
								: "size-8",
					className,
					classNames?.base,
					classNames?.skeleton,
				)}
			/>
		)
	}

	return (
		<Avatar
			className={cn(
				"bg-muted",
				size === "sm"
					? "size-6"
					: size === "lg"
						? "size-10"
						: size === "xl"
							? "size-12"
							: "size-8",
				className,
				classNames?.base,
			)}
			{...props}
		>
			<Avatar.Image
				alt={name || "User"}
				className={classNames?.image}
				src={userImage || undefined}
			/>

			<Avatar.Fallback
				className={cn("text-foreground uppercase", classNames?.fallback)}
				delayMs={userImage ? 600 : undefined}
			>
				{firstTwoCharacters(name) || (
					<UserRoundIcon className={cn("size-[50%]", classNames?.fallbackIcon)} />
				)}
			</Avatar.Fallback>
		</Avatar>
	)
}

const firstTwoCharacters = (name?: string | null) => name?.slice(0, 2)
