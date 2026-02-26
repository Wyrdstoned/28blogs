const feeds = [
    // Add your RSS feed URLs here
    // Example: 'https://example.com/feed.xml',
];

async function fetchRSS() {
    const container = document.getElementById('feed-items');
    
    if (feeds.length === 0) {
        container.innerHTML = '<p>No feeds configured. Edit <code>script.js</code> to add RSS feed URLs.</p>';
        return;
    }

    const items = [];

    for (const url of feeds) {
        try {
            const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (data.status === 'ok') {
                data.items.forEach(item => {
                    items.push({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate).toLocaleDateString(),
                        description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) + '...',
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

    container.innerHTML = items.map(item => `
        <article class="feed-item">
            <h2><a href="${item.link}" target="_blank" rel="noopener">${item.title}</a></h2>
            <div class="meta">${item.pubDate} · ${item.source}</div>
            <p class="description">${item.description}</p>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', fetchRSS);
