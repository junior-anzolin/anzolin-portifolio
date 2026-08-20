export interface Article {
  title: string;
  url: string;
  pubDate: string; // ISO date string or formatted date
  excerpt: string;
  imageUrl?: string;
  categories: string[];
  readingTimeMin: number;
}
