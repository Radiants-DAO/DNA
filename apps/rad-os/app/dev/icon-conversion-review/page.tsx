import {
  type IconConversionReviewClientEntry,
  IconConversionReviewClient,
} from './IconConversionReviewClient';
import { getIconConversionReviewEntries } from '@/lib/icon-conversion-review';

export const dynamic = 'force-dynamic';

export default async function IconConversionReviewPage() {
  const entries = await getIconConversionReviewEntries();

  return (
    <IconConversionReviewClient
      entries={entries as readonly IconConversionReviewClientEntry[]}
    />
  );
}
