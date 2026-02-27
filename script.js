const feeds = [
    'https://theunderhivecuttingfloor.blogspot.com/',
    'https://kitbashchaos.blog/feed/',
    'https://www.betweenthebolterandme.com/feeds/posts/default',
    'https://jamesoftheempyrean.blogspot.com/feeds/posts/default?alt=rss',
    'https://distopus.blogspot.com/feeds/posts/default?alt=rss',
    'https://robhawkinshobby.blogspot.com/feeds/posts/default?alt=rss',
    'https://cursedmanufactorum.wordpress.com/feed/',
    'https://vexingworkshop.com/feeds/all.atom.xml',
    'https://worldsinamber.net/feed/',
    'https://portcullisgames.blogspot.com/feeds/posts/default?alt=rss',
    'https://apologentsia.blogspot.com/feeds/posts/default?alt=rss',
    'https://doomedtrooper.blogspot.com/',
    'https://convertordie.wordpress.com/feed/',
    'https://warbosskurgan.blogspot.com/feeds/posts/default?alt=rss',
    'https://www.bwamp.org/blob.rss',
    'https://bottomofthebitzbox.blogspot.com/feeds/posts/default',
    'https://rootr0t.blogspot.com/feeds/posts/default',
    'https://w0rmh0l3.blogspot.com/feeds/posts/default',
    'https://nemessosminis.net/feed/',
    'https://hobbydungeon.blogspot.com',
    'https://the-lucky-space.blogspot.com/feeds/posts/default',
    'https://thesederelictthoughts.blogspot.com/feeds/posts/default?alt=rss',
    'https://exobscuris.blogspot.com/feeds/posts/default?alt=rss',
    'https://voidhalation.com/feed/',
    'https://averygoodpainter.blogspot.com/feeds/posts/default?alt=rss',
    'https://tylerisalrightatpainting.blogspot.com/feeds/posts/default?alt=rss',
    'https://darkeaten.blogspot.com/feeds/posts/default?alt=rss',
    'https://n3cromancer.blogspot.com/feeds/posts/default',
    'https://miniatorium.com/feed/',
    'https://gravesector.blogspot.com/',
    'https://thevvizardstower.blogspot.com/feeds/posts/default?alt=rss',
    'https://gardensofhecate.com/blog/rss',
    'https://underthedice.com/feed/',
    'https://knifesquid.wordpress.com/feed/',
];

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const POSTS_PER_PAGE = 15;

function getCachedFeeds() {
    const cached = localStorage.getItem('rss_feeds');
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
        return data;
    }
    return null;
}

function setCachedFeeds(items) {
    localStorage.setItem('rss_feeds', JSON.stringify({
        data: items,
        timestamp: Date.now()
    }));
}

async function fetchRSS() {
    const container = document.getElementById('feed-items');
    
    if (feeds.length === 0) {
        container.innerHTML = '<p>No feeds configured. Edit <code>script.js</code> to add RSS feed URLs.</p>';
        return;
    }

    const cachedItems = getCachedFeeds();
    if (cachedItems) {
        renderFeedItems(cachedItems, container, 0);
    } else {
        container.innerHTML = '<p class="loading">Loading feeds...</p>';
    }

    const items = [];

    for (const url of feeds) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.status === 'ok') {
                data.items.forEach(item => {
                    const imgMatch = item.description?.match(/<img[^>]+src="([^"]+)"/);
                    const img = imgMatch ? imgMatch[1] : null;
                    const plainDesc = item.description?.replace(/<[^>]*>/g, '').slice(0, 400) + '...';
                    items.push({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate).toLocaleDateString(),
                        description: plainDesc,
                        image: img,
                        source: data.feed.title
                    });
                });
            }
        } catch (error) {
            console.error(`Failed to fetch feed: ${url}`, error);
        }
    }

    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    if (items.length === 0) {
        container.innerHTML = '<p>Unable to load feeds. Please check the URLs.</p>';
        return;
    }

    setCachedFeeds(items);
    renderFeedItems(items, container, 0);
}

function renderFeedItems(items, container, offset) {
    const visibleItems = items.slice(offset, offset + POSTS_PER_PAGE);
    const hasMore = offset + POSTS_PER_PAGE < items.length;
    
    if (offset === 0) {
        container.innerHTML = '';
    }
    
    container.innerHTML += visibleItems.map(item => `
        <article class="feed-item">
            ${item.image ? `<a href="${item.link}" target="_blank" rel="noopener"><img src="${item.image}" alt="${item.title}" class="feed-image"></a>` : ''}
            <h2><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></h2>
            <div class="meta">${item.pubDate} · ${item.source}</div>
            <p class="description">${item.description}</p>
        </article>
    `).join('');
    
    if (hasMore) {
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.remove();
        }
        container.innerHTML += `<button id="load-more" class="load-more-btn" onclick="loadMorePosts(${offset + POSTS_PER_PAGE})">Load More</button>`;
    } else {
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.remove();
        }
    }
}

window.loadMorePosts = function(offset) {
    const container = document.getElementById('feed-items');
    const cached = localStorage.getItem('rss_feeds');
    if (cached) {
        const { data } = JSON.parse(cached);
        renderFeedItems(data, container, offset);
    }
};

document.addEventListener('DOMContentLoaded', fetchRSS);
