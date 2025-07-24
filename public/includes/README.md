# Modular Template System

A flexible system for reusing navigation and footer components across your website.

## 📁 Files

- **`navigation.html`** - Navigation template (based on composition.html)
- **`footer.html`** - Footer template (based on index.html) 
- **`template-loader.js`** - JavaScript module for loading templates
- **`example-usage.html`** - Working example of implementation
- **`README.md`** - This documentation

## 🚀 Quick Start

### 1. Include the Template Loader

Add this script tag to any page where you want to use modular templates:

```html
<script src="/includes/template-loader.js"></script>
```

### 2. Load Templates Automatically

Add this JavaScript to auto-load both templates:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    await TemplateLoader.loadAllTemplates();
});
```

## 🎯 Usage Methods

### Method 1: JavaScript API (Recommended)

```javascript
// Load both templates with default settings
await TemplateLoader.loadAllTemplates();

// Load individually
await TemplateLoader.loadNavigation(); // Top of body
await TemplateLoader.loadFooter();     // Bottom of body

// Custom injection targets
await TemplateLoader.loadNavigation('#header-area', 'beforeend');
await TemplateLoader.loadFooter('#footer-area', 'afterbegin');

// Advanced configuration
await TemplateLoader.loadAllTemplates({
    navTarget: '#custom-nav-container',
    navPosition: 'afterbegin',
    footerTarget: '#custom-footer-container', 
    footerPosition: 'beforeend'
});
```

### Method 2: Auto-load with Data Attributes

Add these elements to your HTML to auto-load templates:

```html
<!-- Auto-load navigation -->
<div data-auto-load-nav="body" data-nav-position="afterbegin"></div>

<!-- Auto-load footer -->
<div data-auto-load-footer="body" data-footer-position="beforeend"></div>
```

### Method 3: Manual Template Fetching

```javascript
// Get raw template HTML
const navHtml = await TemplateLoader.fetchTemplate('navigation');
const footerHtml = await TemplateLoader.fetchTemplate('footer');

// Inject manually
document.getElementById('my-container').innerHTML = navHtml;
```

## 🔧 Template Features

### Navigation Template Includes:
- ✅ Primary navigation menu with dropdowns
- ✅ Secondary navigation with social links
- ✅ Theme toggle (dark/light mode)
- ✅ Music catalog button
- ✅ Hamburger menu for mobile
- ✅ All social media links with proper SVG icons

### Footer Template Includes:
- ✅ Navigation groups
- ✅ Contact information
- ✅ Newsletter signup form
- ✅ Bottom navigation links
- ✅ Privacy-friendly design
- ✅ Responsive layout

## 🎨 Styling

Templates inherit styles from your existing CSS files:
- `/variables.css` - CSS custom properties and variables
- `/styles.css` - Main stylesheet

No additional CSS needed - templates use existing classes.

## ⚡ JavaScript Functionality

The template loader automatically initializes:

**Navigation:**
- Theme toggle with localStorage persistence
- Hamburger menu toggle
- Dropdown menu interactions
- Click-outside-to-close behavior

**Footer:**
- Newsletter form submission
- Success message display
- Form validation
- Auto-reset functionality

## 📱 Responsive Design

Both templates are fully responsive and include:
- Mobile-optimized layouts
- Touch-friendly navigation
- Adaptive social link sizing
- Collapsible newsletter form

## 🔄 Updating Templates

To update navigation or footer across all pages:

1. Edit `/includes/navigation.html` or `/includes/footer.html`
2. Changes automatically apply to all pages using the templates
3. No need to update individual HTML files!

## 🌟 Implementation Example

### Basic Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Page</title>
    <link rel="stylesheet" href="/variables.css">
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <!-- Navigation will be injected here -->
    
    <main>
        <h1>Page Content</h1>
        <p>Your main content goes here</p>
    </main>
    
    <!-- Footer will be injected here -->
    
    <script src="/includes/template-loader.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            await TemplateLoader.loadAllTemplates();
        });
    </script>
</body>
</html>
```

## 🐛 Troubleshooting

**Templates not loading?**
- Check browser console for error messages
- Ensure `/includes/` folder is accessible
- Verify template files exist and are valid HTML

**Styling issues?**
- Confirm `/variables.css` and `/styles.css` are loaded
- Check CSS file paths are correct
- Ensure templates load after stylesheets

**JavaScript not working?**
- Verify `template-loader.js` loads before template injection
- Check for JavaScript console errors
- Ensure DOM is ready before loading templates

## 🎯 Benefits

✅ **DRY Principle** - Don't Repeat Yourself  
✅ **Single Source of Truth** - Update once, applies everywhere  
✅ **Easy Maintenance** - No need to update multiple files  
✅ **Consistent Design** - Same navigation/footer across all pages  
✅ **Fast Implementation** - Just add one script tag  
✅ **Flexible Positioning** - Inject anywhere you want  

## 🔮 Future Enhancements

- Server-side template rendering support
- Template caching for better performance  
- Variable substitution in templates
- Multiple template variants
- Template versioning system 