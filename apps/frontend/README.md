# Mama Bloemetjes - Handcrafted Velvet Flowers

A beautiful, production-ready e-commerce website for selling custom-made velvet flowers. Built with Next.js 15, TailwindCSS, and TypeScript.

## 🌸 About

Mama Bloemetjes is a boutique webshop specializing in handcrafted velvet flower arrangements. The website features a warm, cozy aesthetic that reflects the artisanal nature of the products, with a focus on user experience and conversion optimization.

## ✨ Features

### 🛍️ E-commerce Functionality
- **Product Catalog**: Browse 12+ sample velvet flower products with detailed descriptions
- **Advanced Filtering**: Filter by category, price, colors, size, occasions, and availability
- **Shopping Cart**: Add items, update quantities, and manage your order
- **Wishlist**: Save favorite products for later
- **Product Search**: Find products quickly with real-time search

### 🎨 Design & UX
- **Boutique Aesthetic**: Warm, cozy color palette with modern boutique vibes
- **Responsive Design**: Optimized for all devices (mobile, tablet, desktop)
- **Smooth Animations**: Subtle transitions and hover effects
- **Accessibility**: WCAG compliant with proper focus management
- **Performance**: Optimized images, lazy loading, and efficient code splitting

### 💬 Customer Engagement
- **Contact Forms**: General contact page and product-specific inquiry modals
- **Product Inquiries**: "Ask about this bouquet" functionality for special occasions
- **Custom Orders**: Support for wedding, anniversary, and special event arrangements
- **Newsletter**: Email subscription for updates and offers

### 🛠️ Technical Features
- **Next.js 15**: Latest React framework with App Router
- **TypeScript**: Full type safety and better development experience
- **TailwindCSS**: Utility-first CSS framework for rapid development
- **Modern Icons**: Feather icons for consistent visual language
- **SEO Optimized**: Meta tags, structured data, and semantic HTML
- **Local Storage**: Cart persistence across sessions

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Bun (recommended) or npm/yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mamabloemetjes.git
   cd mamabloemetjes/apps/frontend
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Start the development server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `bun run dev` - Start development server with Turbopack
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run ESLint
- `bun run repo` - Start both frontend and backend concurrently

## 📁 Project Structure

```
apps/frontend/
├── app/                    # Next.js App Router pages
│   ├── about/             # About page
│   ├── cart/              # Shopping cart
│   ├── contact/           # Contact form
│   ├── shop/              # Product catalog
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # Reusable React components
│   ├── Button.tsx         # Button component with variants
│   ├── ContactModal.tsx   # Product inquiry modal
│   ├── Footer.tsx         # Site footer
│   ├── Navigation.tsx     # Main navigation
│   └── ProductCard.tsx    # Product display card
├── context/               # React Context providers
│   └── CartContext.tsx    # Shopping cart state management
├── data/                  # Mock data and utilities
│   └── products.ts        # Sample product data
├── lib/                   # Utility functions
│   └── utils.ts           # Common utilities
├── types/                 # TypeScript type definitions
│   └── index.ts           # Core types and interfaces
└── public/                # Static assets
```

## 🎨 Design System

### Color Palette
- **Primary**: `#d4a574` (Warm gold)
- **Secondary**: `#8b9dc3` (Soft blue)
- **Accent**: `#ddb7ab` (Dusty rose)
- **Neutrals**: `#faf9f7` to `#2d2820`

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)
- **Responsive**: Fluid typography scaling

### Components
- **Buttons**: 4 variants (primary, secondary, outline, ghost)
- **Cards**: Consistent shadows and rounded corners
- **Forms**: Accessible inputs with validation states
- **Navigation**: Sticky header with mobile menu

## 🛒 Product Data Structure

Products include comprehensive information:

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  category: 'bouquet' | 'arrangement' | 'single' | 'seasonal';
  occasion?: string[];
  isCustomizable: boolean;
  colors?: string[];
  size?: 'small' | 'medium' | 'large';
}
```

## 📱 Responsive Breakpoints

- **Mobile**: 640px and below
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px and above
- **Large Desktop**: 1280px and above

## 🔧 Customization

### Adding New Products
1. Add product data to `data/products.ts`
2. Ensure image URLs are accessible
3. Include proper categorization and metadata

### Styling Changes
1. Update color variables in `globals.css`
2. Modify TailwindCSS config for custom utilities
3. Adjust component styles in respective files

### Adding New Pages
1. Create new folder in `app/` directory
2. Add `page.tsx` file with your component
3. Update navigation links in `Navigation.tsx`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Build Command: `bun run build`
   - Output Directory: `.next`
   - Install Command: `bun install`

### Other Platforms
The app can be deployed to any platform supporting Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🔮 Future Enhancements

### Phase 1 - Core Features
- [ ] User authentication and accounts
- [ ] Real payment integration (Stripe/Mollie)
- [ ] Inventory management system
- [ ] Order tracking functionality

### Phase 2 - Advanced Features
- [ ] Product reviews and ratings
- [ ] Wishlist sharing
- [ ] Advanced customization tools
- [ ] Email automation

### Phase 3 - Business Features
- [ ] Analytics dashboard
- [ ] CMS integration
- [ ] Multi-language support
- [ ] B2B wholesale portal

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Designer & Developer**: Built with love for artisanal businesses
- **Inspiration**: Real boutique flower shops and their personal touch

## 📞 Support

For questions about the codebase or deployment:
- Create an issue in the GitHub repository
- Check the documentation in `/docs` (coming soon)

---

**Made with 🌸 for Mama Bloemetjes**

*Handcrafted velvet flowers that last forever, just like great code.*