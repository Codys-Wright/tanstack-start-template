// Active Quiz feature - client and domain exports
export * from './domain/index.js';
export * from './client/index.js';
export { QuestionCard } from './components/question-card.js';
export { QuizProgressBar } from './components/quiz-progress-bar.js';
export {
  QuizTakerPage,
  type QuizTakerPageProps,
} from './ui/quiz-taker.page.js';
export {
  loadQuizTaker,
  type QuizTakerLoaderData,
} from './ui/load-quiz-taker.js';
export {
  QuizTakerPageSkeleton,
  QuizLoadingSkeleton,
} from './ui/quiz-taker-skeleton.js';

// Artist type components and utilities
export * from './components/artist-type/index.js';

// My Response page (results display)
export {
  MyResponsePage,
  type MyResponsePageProps,
} from './ui/my-response.page.js';
export {
  MyResponsePageLoading,
  MyResponsePageSkeleton,
} from './ui/my-response-skeleton.js';
export {
  loadMyResponse,
  type MyResponseLoaderData,
} from './ui/load-my-response.js';

// Artist type descriptions
export {
  artistTypeDescriptions,
  getArtistTypeInfo,
  getAllArtistTypes,
  getArtistTypeFromEndingId,
  type ArtistTypeInfo,
} from './components/artist-type/artist-type-descriptions.js';

// Share utilities
export {
  encodeResultsForShare,
  decodeResultsFromShare,
  generateShareableUrl,
  copyToClipboard,
  ARTIST_TYPE_ORDER,
  ARTIST_TYPE_SHORT_NAMES,
  type ShareableResults,
} from './ui/share-utils.js';
