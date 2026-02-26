async function loadBlogPosts() {
    const container = document.getElementById('blog-posts');
    
    const posts = [
        {
            title: 'Welcome to My Blog',
            date: '2026-02-26',
            description: 'This is my first blog post!',
            slug: 'welcome'
        }
    ];

    if (posts.length === 0) {
        container.innerHTML = '<p>No posts yet. Go to /admin to create one.</p>';
        return;
    }

    container.innerHTML = posts.map(post => `
        <article class="blog-post">
            <h2><a href="blog/${post.slug}.html">${post.title}</a></h2>
            <div class="meta">${post.date}</div>
            <p>${post.description}</p>
        </article>
    `).join('');
}

document.addEventListener('DOMContentLoaded', loadBlogPosts);
