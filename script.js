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
    container.innerHTML = '<p class="loading">Loading feeds...</p>';
    
    // Try localStorage cache first
    const cachedItems = getCachedFeeds();
    if (cachedItems) {
        renderFeedItems(cachedItems, container, 0);
    }

    try {
        // Call Netlify function (works locally and in production)
        const response = await fetch('/.netlify/functions/rss');
        const items = await response.json();
        
        if (items && items.length > 0) {
            setCachedFeeds(items);
            renderFeedItems(items, container, 0);
        } else if (!cachedItems) {
            container.innerHTML = '<p>Unable to load feeds. Please try again later.</p>';
        }
    } catch (error) {
        console.error('Failed to fetch feeds:', error);
        if (!cachedItems) {
            container.innerHTML = '<p>Error: ' + error.message + '</p>';
        }
    }
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
