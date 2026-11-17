/**
 * Tile art for the "Up Next" rail.
 *
 * The app runs one station, but the design's rail still wants the tower's tile
 * imagery — the brand waveform tile plus two studio and event photographs — so
 * the rail cycles through this fixed set rather than repeating one image three
 * times. Everything here is real photography, shared with the website.
 *
 * Files live in the repo's public/assets/images, so they are served by both the
 * dev server and the native bundle. All four tiles are photographs, so no
 * placeholder artwork is left in the rail.
 */
export interface TileArt {
  /** Public path, or null for the brand waveform tile drawn in SVG. */
  src: string | null;
  alt: string;
}

export const upNextTiles: TileArt[] = [
  { src: "/assets/images/live-studio.jpg", alt: "The broadcast console in the Prototype FM studio" },
  { src: "/assets/images/tile-urban-radio.jpg", alt: "A presenter at the studio microphone" },
  { src: "/assets/images/tile-highlife.jpg", alt: "A DJ working the turntables" },
  { src: "/assets/images/event-afrobeats-zone.jpg", alt: "A crowd dancing under purple club lights" },
];

export function tileFor(index: number): TileArt {
  return upNextTiles[index % upNextTiles.length];
}
