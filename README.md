# Jobna - Job Seekers Web Application

A modern web application designed to help job seekers supercharge their job search with AI-powered tools.

## Features

- **AI Resume Analysis**: Get instant feedback on your resume
- **Smart Job Matching**: Find perfect job opportunities
- **Application Tracking**: Monitor your job applications
- **Modern UI**: Clean, professional design with Tailwind CSS
- **Demo Mode**: Test features without OpenAI API calls

## Tech Stack

- React 19
- Tailwind CSS
- PostCSS
- Netlify (Deployment)

## Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start development server**:

   ```bash
   npm start
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment to Netlify

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push your code to GitHub**:

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy on Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account
   - Select your repository
   - Set build command: `npm run build`
   - Set publish directory: `build`
   - Click "Deploy site"

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**:

   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:

   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Drag and Drop

1. **Build the project**:

   ```bash
   npm run build
   ```

2. **Drag the `build` folder** to [netlify.com](https://netlify.com)

## Netlify Configuration

The project includes the following Netlify configuration files:

- `netlify.toml`: Build settings and redirects
- `public/_redirects`: Client-side routing support
- `public/_headers`: Security headers and caching

## Environment Variables

For full AI functionality, you'll need to set up OpenAI API keys. See `ENVIRONMENT_SETUP.md` for details.

**Note**: The app includes a demo mode that works without API keys for testing purposes.

## Custom Domain

After deployment, you can add a custom domain in your Netlify dashboard under "Domain settings".

## Support

For deployment issues, check the [Netlify documentation](https://docs.netlify.com/).

For OpenAI API issues, see `TROUBLESHOOTING.md`.

## Demo Mode

If you're experiencing OpenAI API quota issues or want to test the interface:

1. Navigate to the "Analyze Now" page
2. Click the **"Demo Mode"** button
3. View sample analysis results without API calls

This is perfect for:

- Testing the interface
- Demonstrating features
- Development and testing
- When API quota is exceeded

## License

This project is private and proprietary.
