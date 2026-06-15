/**
 * Pomocnicze funkcje do obsługi TikToka.
 *
 * Korzystamy z DARMOWEGO publicznego oEmbed API TikToka (bez klucza):
 *   https://www.tiktok.com/oembed?url=<link>
 * Zwraca tytuł, autora, miniaturę i HTML embeda (z którego wyciągamy video_id).
 */

export type TikTokOembed = {
  videoId: string;
  title: string | null;
  author: string | null;
  thumbnailUrl: string | null;
};

/**
 * Wyciąga ID filmu z różnych formatów linków TikToka.
 * Obsługuje:
 *   https://www.tiktok.com/@user/video/7281234567890123456
 *   https://m.tiktok.com/v/7281234567890123456.html
 * Dla skróconych linków (vm.tiktok.com/XXXX) zwraca null —
 * w takim wypadku ID bierzemy z oEmbed (data-video-id w html).
 */
export function parseVideoIdFromUrl(url: string): string | null {
  const m = url.match(/\/video\/(\d{6,25})/) || url.match(/\/v\/(\d{6,25})/);
  return m ? m[1] : null;
}

/** Wyciąga video_id z HTML embeda oEmbed (data-video-id="...") */
function parseVideoIdFromHtml(html: string): string | null {
  const m = html.match(/data-video-id="(\d{6,25})"/) || html.match(/\/video\/(\d{6,25})/);
  return m ? m[1] : null;
}

/**
 * Pobiera metadane filmu z oEmbed API TikToka.
 * Rzuca błędem gdy link jest nieprawidłowy lub film niedostępny.
 */
export async function fetchTikTokOembed(url: string): Promise<TikTokOembed> {
  const endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  const res = await fetch(endpoint, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; WrednyKubek/1.0)" },
    // oEmbed czasem wolno odpowiada — dajemy rozsądny timeout przez AbortSignal
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(
      `TikTok oEmbed zwrócił status ${res.status}. Sprawdź czy link jest publiczny i poprawny.`,
    );
  }

  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
    html?: string;
  };

  const videoId =
    parseVideoIdFromUrl(url) ?? (data.html ? parseVideoIdFromHtml(data.html) : null);

  if (!videoId) {
    throw new Error(
      "Nie udało się odczytać ID filmu z linku. Wklej pełny link (np. https://www.tiktok.com/@konto/video/...).",
    );
  }

  return {
    videoId,
    title: data.title ?? null,
    author: data.author_name ?? null,
    thumbnailUrl: data.thumbnail_url ?? null,
  };
}

/**
 * URL odtwarzacza embed (gra wewnątrz iframe na naszej stronie).
 * Używamy nowego Player v1 z parametrami:
 *   loop=1  → film zapętla się (klient zostaje w sklepie)
 *   rel=0   → po zakończeniu NIE pokazuje innych filmów / linków na TikToka
 *   autoplay=1, controls=1 → standardowe sterowanie
 *   music_info=1, description=1 → wygląd zbliżony do natywnego TikToka
 */
export function tiktokEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    loop: "1",
    autoplay: "1",
    controls: "1",
    rel: "0",
    music_info: "1",
    description: "1",
    native_context_menu: "0",
  });
  return `https://www.tiktok.com/player/v1/${videoId}?${params.toString()}`;
}
