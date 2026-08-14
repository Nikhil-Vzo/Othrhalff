import { NextRequest, NextResponse } from 'next/server';

interface ExtractedTrack {
    title: string;
    artist: string;
    query: string;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url } = body;

        if (!url || typeof url !== 'string') {
            return NextResponse.json({ error: 'Please provide a valid playlist URL.' }, { status: 400 });
        }

        const trimmedUrl = url.trim();
        const extracted: ExtractedTrack[] = [];

        // 1. Spotify Playlist / Album / Track
        if (trimmedUrl.includes('spotify.com')) {
            const playlistMatch = trimmedUrl.match(/playlist\/([a-zA-Z0-9]+)/);
            const albumMatch = trimmedUrl.match(/album\/([a-zA-Z0-9]+)/);
            const trackMatch = trimmedUrl.match(/track\/([a-zA-Z0-9]+)/);

            if (playlistMatch || albumMatch) {
                const type = playlistMatch ? 'playlist' : 'album';
                const id = playlistMatch ? playlistMatch[1] : albumMatch![1];
                
                try {
                    const embedRes = await fetch(`https://open.spotify.com/embed/${type}/${id}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    if (embedRes.ok) {
                        const html = await embedRes.text();
                        // Extract __NEXT_DATA__ json or resource data
                        const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
                        if (nextDataMatch && nextDataMatch[1]) {
                            const parsed = JSON.parse(nextDataMatch[1]);
                            const entity = parsed?.props?.pageProps?.state?.data?.entity || parsed?.props?.pageProps?.entityData;
                            const trackList = entity?.trackList || entity?.tracks?.items || [];
                            
                            trackList.forEach((t: any) => {
                                const title = t.title || t.name || '';
                                const artist = t.subtitle || t.artists?.map((a: any) => a.name).join(', ') || '';
                                if (title) {
                                    extracted.push({
                                        title,
                                        artist,
                                        query: `${title} ${artist}`.trim()
                                    });
                                }
                            });
                        }

                        // Fallback regex extraction if __NEXT_DATA__ schema varies
                        if (extracted.length === 0) {
                            const regex = /"name":\s*"([^"]+)",\s*"artists":\s*\[{"name":\s*"([^"]+)"/g;
                            let match: RegExpExecArray | null;
                            while ((match = regex.exec(html)) !== null) {
                                extracted.push({
                                    title: match[1],
                                    artist: match[2],
                                    query: `${match[1]} ${match[2]}`
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error('Spotify embed fetch error:', err);
                }
            } else if (trackMatch) {
                try {
                    const oembedRes = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(trimmedUrl)}`);
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        if (data.title) {
                            extracted.push({
                                title: data.title,
                                artist: data.author_name || '',
                                query: `${data.title} ${data.author_name || ''}`.trim()
                            });
                        }
                    }
                } catch (err) {
                    console.error('Spotify oembed error:', err);
                }
            }
        }

        // 2. YouTube / YouTube Music Playlist or Video
        else if (trimmedUrl.includes('youtube.com') || trimmedUrl.includes('youtu.be')) {
            const listMatch = trimmedUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
            
            if (listMatch) {
                const listId = listMatch[1];
                try {
                    const ytRes = await fetch(`https://www.youtube.com/playlist?list=${listId}`, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                        }
                    });

                    if (ytRes.ok) {
                        const html = await ytRes.text();
                        // Extract playlist video titles from ytInitialData
                        const jsonMatch = html.match(/var ytInitialData\s*=\s*({[\s\S]*?});<\/script>/);
                        if (jsonMatch && jsonMatch[1]) {
                            const data = JSON.parse(jsonMatch[1]);
                            const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
                            const tabContent = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                            const items = tabContent[0]?.itemSectionRenderer?.contents[0]?.playlistVideoListRenderer?.contents || [];

                            items.forEach((item: any) => {
                                const videoRenderer = item?.playlistVideoRenderer;
                                const title = videoRenderer?.title?.runs?.[0]?.text || videoRenderer?.title?.simpleText;
                                const artist = videoRenderer?.shortBylineText?.runs?.[0]?.text || '';
                                if (title && title !== '[Private video]' && title !== '[Deleted video]') {
                                    // Clean up YouTube title (e.g. remove "Official Video", "(Lyrics)", etc.)
                                    const cleanedTitle = title
                                        .replace(/\[.*?\]|\(.*?\)/g, '')
                                        .replace(/official\s*(music)?\s*video|lyric\s*video|audio|full\s*song|4k|hd/gi, '')
                                        .trim();
                                    extracted.push({
                                        title: cleanedTitle,
                                        artist,
                                        query: `${cleanedTitle} ${artist}`.trim()
                                    });
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error('YouTube playlist fetch error:', err);
                }
            } else {
                // Single YouTube Video
                try {
                    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(trimmedUrl)}&format=json`);
                    if (oembedRes.ok) {
                        const data = await oembedRes.json();
                        const title = (data.title || '')
                            .replace(/\[.*?\]|\(.*?\)/g, '')
                            .replace(/official\s*(music)?\s*video|lyric\s*video|audio|full\s*song/gi, '')
                            .trim();
                        extracted.push({
                            title,
                            artist: data.author_name || '',
                            query: `${title} ${data.author_name || ''}`.trim()
                        });
                    }
                } catch (err) {
                    console.error('YouTube video oembed error:', err);
                }
            }
        }

        // Return extracted list
        if (extracted.length === 0) {
            return NextResponse.json({
                error: 'Could not extract songs from this link. Make sure the playlist is public.'
            }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            count: extracted.length,
            tracks: extracted.slice(0, 50) // Limit to top 50 songs per import for optimal performance
        });
    } catch (error: any) {
        console.error('Playlist import error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error while importing playlist.' }, { status: 500 });
    }
}
