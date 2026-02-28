const Parser = require('rss-parser');
const parser = new Parser();

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

let cache = {
    data: null,
    timestamp: 0
};

const feeds = [
    'https://theunderhivecuttingfloor.blogspot.com/feeds/posts/default',
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
    'https://doomedtrooper.blogspot.com/feeds/posts/default',
    'https://convertordie.wordpress.com/feed/',
    'https://warbosskurgan.blogspot.com/feeds/posts/default?alt=rss',
    'https://www.bwamp.org/blob.rss',
    'https://bottomofthebitzbox.blogspot.com/feeds/posts/default',
    'https://rootr0t.blogspot.com/feeds/posts/default',
    'https://w0rmh0l3.blogspot.com/feeds/posts/default',
    'https://nemessosminis.net/feed/',
    'https://hobbydungeon.blogspot.com/feeds/posts/default',
    'https://the-lucky-space.blogspot.com/feeds/posts/default',
    'https://thesederelictthoughts.blogspot.com/feeds/posts/default?alt=rss',
    'https://exobscuris.blogspot.com/feeds/posts/default?alt=rss',
    'https://voidhalation.com/feed/',
    'https://averygoodpainter.blogspot.com/feeds/posts/default?alt=rss',
    'https://tylerisalrightatpainting.blogspot.com/feeds/posts/default?alt=rss',
    'https://darkeaten.blogspot.com/feeds/posts/default?alt=rss',
    'https://n3cromancer.blogspot.com/feeds/posts/default',
    'https://miniatorium.com/feed/',
    'https://gravesector.blogspot.com/feeds/posts/default',
    'https://thevvizardstower.blogspot.com/feeds/posts/default?alt=rss',
    'https://gardensofhecate.com/blog/rss',
    'https://underthedice.com/feed/',
    'https://knifesquid.wordpress.com/feed/',
    'https://nochudsnomasters.com/users/nvts8a.atom',
];

async function fetchAllFeeds() {
    const items = [];
    
    const feedPromises = feeds.map(async (url) => {
        try {
            const feed = await parser.parseURL(url);
            return feed.items.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '',
                description: item.contentSnippet?.slice(0, 400) + '...' || '',
                image: item.content ? item.content.match(/<img[^>]+src="([^"]+)"/)?.[1] : null,
                source: feed.title || url
            }));
        } catch (error) {
            console.log(`Failed: ${url} - ${error.message}`);
            return [];
        }
    });
    
    const results = await Promise.all(feedPromises);
    results.forEach(result => items.push(...result));
    
    items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
    
    return items;
}

exports.handler = async (event, context) => {
    // Check cache
    if (cache.data && (Date.now() - cache.timestamp < CACHE_DURATION)) {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: JSON.stringify(cache.data)
        };
    }
    
    const items = await fetchAllFeeds();
    
    cache.data = items;
    cache.timestamp = Date.now();
    
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: JSON.stringify(items)
    };
};

exports.scheduled = async (event) => {
    // This runs on cron schedule to keep cache warm
    const items = await fetchAllFeeds();
    cache.data = items;
    cache.timestamp = Date.now();
    console.log('Cache refreshed via cron');
};
