import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AddStoryButton } from '@/components/story/add-story-button';
import type { EncodedImage } from '@/lib/image-processing';

const encodedImage: EncodedImage = {
  dataUrl: 'data:image/webp;base64,encoded',
  mimeType: 'image/webp',
  width: 800,
  height: 600,
};

function createImageFile() {
  return new File(['image'], 'story.png', { type: 'image/png' });
}

describe('AddStoryButton', () => {
  it('processes one selected file and emits the encoded image', async () => {
    const user = userEvent.setup();
    const onImageReady = vi.fn();
    const processFile = vi.fn().mockResolvedValue(encodedImage);

    render(<AddStoryButton onImageReady={onImageReady} processFile={processFile} />);
    await user.upload(screen.getByLabelText('选择 Story 图片'), createImageFile());

    await waitFor(() => expect(onImageReady).toHaveBeenCalledWith(encodedImage));
    expect(processFile).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '添加 Story' })).toBeEnabled();
  });

  it('shows an error and re-enables the button when processing fails', async () => {
    const user = userEvent.setup();
    const processFile = vi.fn().mockRejectedValue(new Error('图片无法读取或文件已经损坏。'));

    render(<AddStoryButton onImageReady={vi.fn()} processFile={processFile} />);
    await user.upload(screen.getByLabelText('选择 Story 图片'), createImageFile());

    expect(await screen.findByRole('alert')).toHaveTextContent('图片无法读取或文件已经损坏。');
    expect(screen.getByRole('button', { name: '添加 Story' })).toBeEnabled();
  });

  it('disables the trigger while processing to prevent duplicate work', async () => {
    const user = userEvent.setup();
    let resolveProcessing: (image: EncodedImage) => void = () => undefined;
    const processFile = vi.fn().mockReturnValue(
      new Promise<EncodedImage>((resolve) => {
        resolveProcessing = resolve;
      }),
    );

    render(<AddStoryButton onImageReady={vi.fn()} processFile={processFile} />);
    const input = screen.getByLabelText('选择 Story 图片');
    const button = screen.getByRole('button', { name: '添加 Story' });
    await user.upload(input, createImageFile());

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('处理中…');

    resolveProcessing(encodedImage);
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('does nothing when the file picker is cancelled', async () => {
    const user = userEvent.setup();
    const processFile = vi.fn();

    render(<AddStoryButton onImageReady={vi.fn()} processFile={processFile} />);
    const input = screen.getByLabelText('选择 Story 图片');
    await user.upload(input, []);

    expect(processFile).not.toHaveBeenCalled();
  });
});
