async function loadBlogPosts() {
    const container = document.getElementById('blog-posts');
    
    try {
        const repo = 'Wyrdstoned/28blogs';
        const branch = 'main';
        
        const response = await fetch(`https://api.github.com/repos/${repo}/contents/blog?ref=${branch}`);
        const files = await response.json();
        
        if (!Array.isArray(files) || files.length === 0) {
            container.innerHTML = '<p>No posts yet. Go to /admin to create one.</p>';
            return;
        }
        
        const posts = await Promise.all(
            files
                .filter(f => f.name.endsWith('.md'))
                .map(async (file) => {
                    const content = await fetch(file.download_url).then(r => r.text());
                    const titleMatch = content.match(/title:\s*(.+)/);
                    const dateMatch = content.match(/date:\s*(.+)/);
                    const descMatch = content.match(/description:\s*(.+)/);
                    let description = '';
                    if (descMatch) {
                        description = descMatch[1].trim().replace(/^["']|["']$/g, '');
                        if (!description || description === '\\n') description = '';
                    }
                    
                    return {
                        title: titleMatch ? titleMatch[1].trim() : file.name.replace('.md', ''),
                        date: dateMatch ? new Date(dateMatch[1]).toLocaleDateString() : '',
                        description: description,
                        slug: file.name
                    };
                })
        );
        
        posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        
    container.innerHTML = posts.map(post => `
        <article class="blog-post">
            <h2><a href="post.html?post=${post.slug}.md">${post.title}</a></h2>
            <div class="meta">${post.date}</div>
            <p>${post.description}</p>
        </article>
    `).join('');
        
    } catch (error) {
        container.innerHTML = '<p>Error loading posts. Please try again later.</p>';
    }
}

document.addEventListener('DOMContentLoaded', loadBlogPosts);
