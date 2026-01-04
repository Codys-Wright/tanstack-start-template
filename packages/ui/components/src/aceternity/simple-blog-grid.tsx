'use client';

import { Link } from '@tanstack/react-router';
import { cn } from '@shadcn';
import { BackgroundRippleEffect } from './background-ripple-effect.js';

// =============================================================================
// TYPES
// =============================================================================

export interface BlogGridItem {
  title: string;
  description: string;
  slug: string;
  image?: string;
  author?: string;
  authorAvatar?: string;
}

export interface SimpleBlogWithGridProps {
  /** Title for the grid section */
  title: string;
  /** Description/subtitle for the grid section */
  description?: string;
  /** Array of blog items to display */
  items: BlogGridItem[];
  /** Base path for item links (e.g., "/artist-types") */
  basePath?: string;
  /** Custom class name for the container */
  className?: string;
  /** Number of columns on desktop (default: 3) */
  columns?: 2 | 3 | 4;
  /** Whether images are SVG icons that need special styling (default: auto-detects from .svg extension) */
  isIconImage?: boolean;
  /** Add top padding for fixed navbar (default: false) */
  withNavbarSpacing?: boolean;
  /** Custom render function for each card */
  renderCard?: (item: BlogGridItem, index: number) => React.ReactNode;
}

export interface BlogCardProps {
  blog: BlogGridItem;
  basePath?: string;
  /** Whether the image is an SVG/icon that needs special styling (default: false) */
  isIconImage?: boolean;
}

// =============================================================================
// BLOG CARD COMPONENT
// =============================================================================

export function BlogCard({ blog, basePath = '', isIconImage = false }: BlogCardProps) {
  const truncate = (text: string, length: number) => {
    return text.length > length ? text.slice(0, length) + '...' : text;
  };

  // Check if image is an SVG (either by extension or if isIconImage is explicitly set)
  const isSvgOrIcon = isIconImage || blog.image?.endsWith('.svg');

  return (
    <Link
      to={`${basePath}/${blog.slug}`}
      className="shadow-derek w-full overflow-hidden rounded-2xl md:rounded-3xl border border-border bg-card transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
    >
      {/* Mobile: horizontal layout, Desktop: vertical layout */}
      <div className="flex flex-row md:flex-col">
        {blog.image ? (
          <div
            className={cn(
              'flex items-center justify-center shrink-0',
              // Mobile: smaller square, Desktop: full width banner
              'h-24 w-24 md:h-52 md:w-full',
              isSvgOrIcon ? 'bg-muted p-3 md:p-6' : '',
            )}
          >
            <img
              src={blog.image}
              alt={blog.title}
              className={cn(
                'h-full w-full',
                isSvgOrIcon
                  ? 'object-contain dark:brightness-0 dark:invert'
                  : 'object-cover object-center',
              )}
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 md:h-52 md:w-full items-center justify-center bg-muted shrink-0">
            <span className="text-2xl md:text-4xl font-bold text-muted-foreground">
              {blog.title.charAt(0)}
            </span>
          </div>
        )}
        <div className="bg-card p-3 md:p-8 flex flex-col justify-center min-w-0">
          {(blog.author || blog.authorAvatar) && (
            <div className="mb-1 md:mb-2 flex items-center space-x-2">
              {blog.authorAvatar && (
                <img
                  src={blog.authorAvatar}
                  alt={blog.author ?? 'Author'}
                  className="h-4 w-4 md:h-5 md:w-5 rounded-full"
                />
              )}
              {blog.author && (
                <p className="text-xs md:text-sm font-normal text-neutral-600 dark:text-neutral-400">
                  {blog.author}
                </p>
              )}
            </div>
          )}
          <p className="mb-1 md:mb-4 text-base md:text-lg font-bold text-neutral-800 dark:text-neutral-100 truncate">
            {blog.title}
          </p>
          <p className="text-left text-xs md:text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 md:line-clamp-none">
            {truncate(blog.description, 100)}
          </p>
        </div>
      </div>
    </Link>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const COLUMN_CLASSES = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
} as const;

export function SimpleBlogWithGrid({
  title,
  description,
  items,
  basePath = '',
  className,
  columns = 3,
  isIconImage,
  withNavbarSpacing = false,
  renderCard,
}: SimpleBlogWithGridProps) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Header with animated ripple background - full width */}
      <div className="relative overflow-hidden">
        <BackgroundRippleEffect
          ambient
          ambientInterval={4000}
          vignettePosition="bottom"
          vignetteFadeCenter
          opacity={35}
        />
        {/* When withNavbarSpacing is true, add pt-24 for fixed navbar clearance */}
        <div
          className={cn(
            'relative z-20 mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-20',
            withNavbarSpacing && 'pt-24 md:pt-32',
          )}
        >
          <h1 className="mb-3 md:mb-6 scroll-m-20 text-center text-2xl md:text-4xl font-bold tracking-tight text-black md:text-left dark:text-white">
            {title}
          </h1>
          {description && (
            <p className="!mb-0 md:!mb-6 max-w-xl text-center text-sm md:text-lg text-neutral-600 md:text-left dark:text-neutral-400">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Grid of cards */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between px-4 pb-10 md:pb-20 md:px-8">
        <div
          className={cn(
            'relative z-20 grid w-full grid-cols-1 gap-3 md:gap-10',
            COLUMN_CLASSES[columns],
          )}
        >
          {items.map((item, index) =>
            renderCard ? (
              renderCard(item, index)
            ) : (
              <BlogCard
                key={item.slug + index}
                blog={item}
                basePath={basePath}
                isIconImage={isIconImage}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

SimpleBlogWithGrid.displayName = 'SimpleBlogWithGrid';
BlogCard.displayName = 'BlogCard';
