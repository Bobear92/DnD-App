import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MusicPlayer, { detectSource, parseYouTubeId, parseSpotifyEmbed } from './MusicPlayer';

describe('parseYouTubeId', () => {
  it('parses youtu.be short links', () => {
    expect(parseYouTubeId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });
  it('parses watch?v= links', () => {
    expect(parseYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
  });
  it('parses /embed/ and /shorts/ links', () => {
    expect(parseYouTubeId('https://youtube.com/embed/abc123')).toBe('abc123');
    expect(parseYouTubeId('https://youtube.com/shorts/xyz789')).toBe('xyz789');
  });
  it('returns null for non-YouTube urls', () => {
    expect(parseYouTubeId('https://example.com/song.html')).toBeNull();
    expect(parseYouTubeId('not a url')).toBeNull();
  });
});

describe('parseSpotifyEmbed', () => {
  it('builds an embed url for a track', () => {
    expect(parseSpotifyEmbed('https://open.spotify.com/track/abc123')).toBe(
      'https://open.spotify.com/embed/track/abc123'
    );
  });
  it('handles playlist and locale-prefixed links', () => {
    expect(parseSpotifyEmbed('https://open.spotify.com/playlist/pl123?si=x')).toBe(
      'https://open.spotify.com/embed/playlist/pl123'
    );
    expect(parseSpotifyEmbed('https://open.spotify.com/intl-fr/track/tk456')).toBe(
      'https://open.spotify.com/embed/track/tk456'
    );
  });
  it('returns null for non-Spotify urls', () => {
    expect(parseSpotifyEmbed('https://example.com/track/1')).toBeNull();
  });
});

describe('detectSource', () => {
  it('returns null for empty input', () => {
    expect(detectSource('')).toBeNull();
    expect(detectSource('   ')).toBeNull();
    expect(detectSource(null)).toBeNull();
  });
  it('classifies uploaded audio and video paths', () => {
    expect(detectSource('uploads/music/characters/3/x.mp3')).toMatchObject({ type: 'audio' });
    expect(detectSource('uploads/music/npcs/3/9/x.mp4')).toMatchObject({ type: 'video' });
  });
  it('classifies direct media file links', () => {
    expect(detectSource('https://cdn.example.com/song.mp3')).toMatchObject({ type: 'audio' });
    expect(detectSource('https://cdn.example.com/clip.webm')).toMatchObject({ type: 'video' });
  });
  it('classifies YouTube and Spotify links', () => {
    expect(detectSource('https://youtu.be/dQw4w9WgXcQ')).toMatchObject({ type: 'youtube', id: 'dQw4w9WgXcQ' });
    expect(detectSource('https://open.spotify.com/track/abc')).toMatchObject({ type: 'spotify' });
  });
  it('falls back to a link for unknown sources', () => {
    expect(detectSource('https://example.com/page')).toMatchObject({ type: 'link' });
  });
});

describe('MusicPlayer rendering', () => {
  it('renders nothing for empty src', () => {
    const { container } = render(<MusicPlayer src="" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('renders an audio element for an uploaded mp3', () => {
    render(<MusicPlayer src="uploads/music/characters/3/x.mp3" />);
    expect(screen.getByTestId('music-audio')).toBeInTheDocument();
  });
  it('renders a video element for an uploaded mp4', () => {
    render(<MusicPlayer src="uploads/music/characters/3/x.mp4" />);
    expect(screen.getByTestId('music-video')).toBeInTheDocument();
  });
  it('renders a YouTube iframe with the embed url', () => {
    render(<MusicPlayer src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    const frame = screen.getByTestId('music-youtube');
    expect(frame).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
  it('renders a Spotify iframe with the embed url and a premium note', () => {
    render(<MusicPlayer src="https://open.spotify.com/track/abc123" />);
    const frame = screen.getByTestId('music-spotify');
    expect(frame).toHaveAttribute('src', 'https://open.spotify.com/embed/track/abc123');
    expect(screen.getByText(/Premium/i)).toBeInTheDocument();
  });
  it('renders a link fallback for unknown sources', () => {
    render(<MusicPlayer src="https://example.com/page" />);
    const link = screen.getByTestId('music-link');
    expect(link).toHaveAttribute('href', 'https://example.com/page');
  });
});
