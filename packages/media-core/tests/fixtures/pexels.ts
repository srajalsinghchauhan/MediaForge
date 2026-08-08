export const samplePexelsPhoto = {
  id: 2014422,
  width: 3024,
  height: 3024,
  url: 'https://www.pexels.com/photo/brown-rocks-during-golden-hour-2014422/',
  photographer: 'Joey Farina',
  photographer_url: 'https://www.pexels.com/@joey',
  photographer_id: 680589,
  avg_color: '#978E7F',
  src: {
    original: 'https://images.pexels.com/photos/2014422/original.jpeg',
    large2x: 'https://images.pexels.com/photos/2014422/large2x.jpeg',
    large: 'https://images.pexels.com/photos/2014422/large.jpeg',
    medium: 'https://images.pexels.com/photos/2014422/medium.jpeg',
    small: 'https://images.pexels.com/photos/2014422/small.jpeg',
    portrait: 'https://images.pexels.com/photos/2014422/portrait.jpeg',
    landscape: 'https://images.pexels.com/photos/2014422/landscape.jpeg',
    tiny: 'https://images.pexels.com/photos/2014422/tiny.jpeg',
  },
  alt: 'Brown Rocks During Golden Hour',
};

export const samplePexelsVideo = {
  id: 2499611,
  width: 1920,
  height: 1080,
  url: 'https://www.pexels.com/video/2499611/',
  image: 'https://images.pexels.com/videos/2499611/picture.jpg',
  duration: 22,
  user: {
    id: 680589,
    name: 'Joey Farina',
    url: 'https://www.pexels.com/@joey',
  },
  video_files: [
    {
      id: 125000,
      quality: 'hd',
      file_type: 'video/mp4',
      width: 1920,
      height: 1080,
      link: 'https://player.vimeo.com/external/125000.hd.mp4',
    },
  ],
  video_pictures: [
    {
      id: 300,
      nr: 0,
      picture: 'https://images.pexels.com/videos/2499611/picture-0.jpg',
    },
  ],
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain' },
  });
}
