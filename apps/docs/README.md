# Frey Documentation

This is the documentation website for Frey, built with Next.js and Tailwind CSS.

## Features

- 📝 **Markdown-based**: All documentation is written in Markdown files
- 🎨 **Modern UI**: Clean, responsive design with dark mode support
- 🔍 **Search-friendly**: Static generation for optimal SEO
- 📱 **Mobile-first**: Responsive design that works on all devices
- ⚡ **Fast**: Optimized for performance with Next.js

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

## Documentation Structure

The documentation is organized in the `../../docs/frey/` directory:

- `getting-started.md` - Quick start guide
- `entity-configuration.md` - Entity configuration options
- `custom-routes.md` - Custom route handlers
- `parameter-handling.md` - Query parameters and validation
- `type-safety.md` - TypeScript and Zod integration
- `api-reference.md` - Complete API reference
- `examples.md` - Real-world examples

## Adding New Documentation

1. Create a new `.md` file in the `../../docs/frey/` directory
2. Add frontmatter with title, description, and order:
   ```yaml
   ---
   title: Your Page Title
   description: Brief description of the page
   order: 8
   ---
   ```
3. The page will automatically appear in the navigation

## Deployment

The documentation is designed to be deployed as a static site:

- **Vercel**: Automatic deployment from Git
- **Netlify**: Static site deployment
- **GitHub Pages**: Free hosting for open source projects

## Customization

- **Styling**: Modify Tailwind classes in the components
- **Navigation**: Update `src/lib/navigation.ts`
- **Layout**: Customize `src/app/docs/layout.tsx`
- **Homepage**: Edit `src/app/page.tsx`
