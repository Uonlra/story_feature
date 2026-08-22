import Image from 'next/image';

import type { StoryPreview } from '@/types/story';

type StoryAvatarProps = {
  story: StoryPreview;
  onSelect?: () => void;
};

export function StoryAvatar({ story, onSelect }: StoryAvatarProps) {
  const avatar = (
    <div className="relative aspect-square w-16 overflow-hidden rounded-full border-2 border-brand bg-panel-muted transition-transform duration-180 ease-out group-hover:scale-105">
      <Image src={story.imageSrc} alt="" fill sizes="64px" className="object-cover" />
    </div>
  );

  return (
    <figure className="flex w-20 shrink-0 flex-col items-center gap-2">
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          aria-label={`打开 ${story.label} Story`}
          title={`打开 ${story.label} Story`}
          className="group inline-flex min-h-11 min-w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-3"
        >
          {avatar}
        </button>
      ) : (
        avatar
      )}

      <figcaption title={story.label} className="max-w-full truncate text-xs text-text-muted">
        {story.label}
      </figcaption>
    </figure>
  );
}
