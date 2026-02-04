// app/intern/components/TweetEmbed.tsx
'use client';

import { Tweet } from 'react-tweet';
import { extractTweetId } from '../lib/transforms';

interface TweetEmbedProps {
  url: string;
}

export function TweetEmbed({ url }: TweetEmbedProps) {
  const tweetId = extractTweetId(url);

  if (!tweetId) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="intern-tweet-link"
      >
        View on X
      </a>
    );
  }

  return (
    <div className="intern-tweet-embed">
      <Tweet id={tweetId} />
    </div>
  );
}
