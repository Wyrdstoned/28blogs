const https = require('https');

exports.handler = async (event, context) => {
    const repo = 'Wyrdstoned/28blogs';
    const branch = 'main';
    
    // Fetch blog posts from GitHub
    const getContent = (path) => {
        return new Promise((resolve, reject) => {
            https.get(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}`, {
                headers: { 'User-Agent': '28blogs' }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', reject);
        });
    };
    
    try {
        const files = await getContent('blog');
        const posts = [];
        
        if (Array.isArray(files)) {
            for (const file of files.filter(f => f.name.endsWith('.md'))) {
                const content = await new Promise((resolve, reject) => {
                    https.get(file.download_url, (res) => {
                        let data = '';
                        res.on('data', chunk => data += chunk);
                        res.on('end', () => resolve(data));
                    }).on('error', reject);
                });
                
                const titleMatch = content.match(/title:\s*(.+)/);
                const dateMatch = content.match(/date:\s*(.+)/);
                
                if (titleMatch) {
                    posts.push({
                        title: titleMatch[1].trim(),
                        date: dateMatch ? new Date(dateMatch[1]).toISOString() : file.name,
                        slug: file.name.replace('.md', '')
                    });
                }
            }
        }
        
        // Sort by date (newest first)
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>28Blogs - Site Blog</title>
    <link>https://28blogs.com</link>
    <description>Blog posts from 28Blogs</description>
    <language>en</language>
    <atom:link href="https://28blogs.com/.netlify/functions/feed" rel="self" type="application/rss+xml"/>
    ${posts.map(post => `
    <item>
        <title><![CDATA[${post.title}]]></title>
        <link>https://28blogs.com/post.html?post=${post.slug}</link>
        <guid>https://28blogs.com/post.html?post=${post.slug}</guid>
        <pubDate>${new Date(post.date).toUTCString()}</pubDate>
    </item>`).join('')}
</channel>
</rss>`;
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: rss
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Error generating feed: ' + error.message
        };
    }
};
