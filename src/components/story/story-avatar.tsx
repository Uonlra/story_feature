import Image from 'next/image';

import type { StoryPreview } from '@/types/story';

type StoryAvatarProps = {
  story: StoryPreview;
};

export function StoryAvatar({ story }: StoryAvatarProps) {
  return (
    <figure className="flex w-20 shrink-0 flex-col items-center gap-2">
      <div className="relative aspect-square w-16 overflow-hidden rounded-full border-2 border-brand bg-panel-muted">
        <Image src={story.imageSrc} alt="" fill sizes="64px" className="object-cover" />
      </div>

      <figcaption className="max-w-full truncate text-xs text-text-muted">{story.id}</figcaption>
    </figure>
  );
}
