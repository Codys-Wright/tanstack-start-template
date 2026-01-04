'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { cn } from '@shadcn';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

// =============================================================================
// TYPES
// =============================================================================

export interface TocLink {
  title: string;
  href: string;
}

export interface BlogContentProps {
  /** The main blog/article title */
  title: string;
  /** Optional subtitle or tagline */
  subtitle?: string;
  /** The markdown content */
  content: string;
  /** Hero/thumbnail image URL */
  thumbnail?: string;
  /** Whether the thumbnail is an SVG/icon that needs special styling (auto-detects from .svg extension) */
  isIconThumbnail?: boolean;
  /** Author name */
  author?: string;
  /** Author avatar URL */
  authorImage?: string;
  /** Publication date */
  date?: Date | string;
  /** Table of contents links - auto-generated from h2 headers if not provided */
  tocLinks?: TocLink[];
  /** Additional class name for the container */
  className?: string;
  /** Children to render after the content */
  children?: React.ReactNode;
}

// =============================================================================
// TOC COMPONENT
// =============================================================================

interface TocProps {
  links: TocLink[];
}

function Toc({ links }: TocProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

  if (links.length === 0) return null;

  return (
    <>
      {/* Desktop TOC - sticky sidebar */}
      <div className="sticky top-20 left-0 hidden max-w-xs flex-col self-start pr-10 md:flex">
        {links.map((link, index) => (
          <a
            className="group/toc-link relative rounded-lg px-2 py-1 text-sm text-neutral-700 dark:text-neutral-200"
            key={link.href}
            href={link.href}
            onMouseEnter={() => setHovered(index)}
            onMouseLeave={() => setHovered(null)}
          >
            {hovered === index && (
              <motion.span
                layoutId="toc-indicator"
                className="absolute top-0 left-0 h-full w-1 rounded-tr-full rounded-br-full bg-neutral-200 dark:bg-neutral-700"
              />
            )}
            <span className="inline-block transition duration-200 group-hover/toc-link:translate-x-1">
              {link.title}
            </span>
          </a>
        ))}
      </div>

      {/* Mobile TOC - floating button + dropdown */}
      <div className="sticky top-20 right-2 z-50 flex w-full flex-col items-end justify-end self-start md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm dark:bg-neutral-900"
        >
          <Menu className="h-6 w-6 text-black dark:text-white" />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 flex flex-col items-end rounded-3xl border border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {links.map((link, index) => (
                <a
                  className="group/toc-link relative rounded-lg px-2 py-1 text-right text-sm text-neutral-700 dark:text-neutral-200"
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {hovered === index && (
                    <motion.span
                      layoutId="toc-indicator-mobile"
                      className="absolute top-0 left-0 h-full w-1 rounded-tr-full rounded-br-full bg-neutral-200 dark:bg-neutral-700"
                    />
                  )}
                  <span className="inline-block transition duration-200 group-hover/toc-link:translate-x-1">
                    {link.title}
                  </span>
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

// =============================================================================
// HELPER: Extract TOC from markdown
// =============================================================================

function extractTocFromMarkdown(content: string): TocLink[] {
  const headingRegex = /^##\s+(.+)$/gm;
  const links: TocLink[] = [];
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const title = match[1].trim();
    // Create a slug from the title
    const href = `#${title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')}`;
    links.push({ title, href });
  }

  return links;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BlogContentWithToc({
  title,
  subtitle,
  content,
  thumbnail,
  isIconThumbnail,
  author,
  authorImage,
  date,
  tocLinks,
  className,
  children,
}: BlogContentProps) {
  // Auto-generate TOC from markdown if not provided
  const links = tocLinks ?? extractTocFromMarkdown(content);

  // Check if thumbnail is an SVG (either by extension or if isIconThumbnail is explicitly set)
  const isSvgOrIcon = isIconThumbnail || thumbnail?.endsWith('.svg');

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 md:flex-row md:px-8',
        className,
      )}
    >
      <Toc links={links} />

      <div className="flex max-w-2xl flex-1 flex-col">
        {/* Thumbnail */}
        {thumbnail && (
          <div
            className={cn(
              'flex items-center justify-center rounded-3xl',
              isSvgOrIcon
                ? 'h-48 bg-neutral-100 p-8 md:h-72 dark:bg-neutral-800'
                : 'h-60 md:h-[30rem]',
            )}
          >
            <img
              src={thumbnail}
              alt={title}
              className={cn(
                'h-full w-full rounded-3xl',
                isSvgOrIcon ? 'object-contain dark:brightness-0 dark:invert' : 'object-cover',
              )}
            />
          </div>
        )}

        {/* Title & Subtitle */}
        <h1 className="mt-6 mb-2 text-2xl font-bold tracking-tight text-black dark:text-white md:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="text-lg text-neutral-600 dark:text-neutral-400">{subtitle}</p>}

        {/* Markdown Content */}
        <div className="prose prose-sm dark:prose-invert mt-10 max-w-none prose-headings:scroll-mt-20">
          <ReactMarkdown
            components={{
              // Add IDs to h2 headings for TOC links
              h2: ({ node, children, ...props }) => {
                const text = String(children);
                const id = text
                  .toLowerCase()
                  .replace(/[^a-z0-9\s-]/g, '')
                  .replace(/\s+/g, '-');
                return (
                  <h2 id={id} {...props}>
                    {children}
                  </h2>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>

        {/* Children slot */}
        {children}

        {/* Author & Date footer */}
        {(author || date) && (
          <>
            <div className="mt-10 max-w-2xl">
              <div className="h-px w-full bg-neutral-200 dark:bg-neutral-900" />
              <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="mt-10 flex items-center">
              {authorImage && (
                <img src={authorImage} alt={author ?? 'Author'} className="h-5 w-5 rounded-full" />
              )}
              {author && (
                <p className="pl-2 text-sm text-neutral-600 dark:text-neutral-400">{author}</p>
              )}
              {author && date && (
                <div className="mx-2 h-1 w-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              )}
              {date && (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {format(new Date(date), 'LLLL d, yyyy')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

BlogContentWithToc.displayName = 'BlogContentWithToc';
