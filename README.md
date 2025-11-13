<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Dmeet - Video Call Meeting App

A modern, peer-to-peer video calling application built with React and WebRTC. Share moments and watch together with Dmeet.

## Features

- 🎥 Real-time video and audio calling
- 💬 In-call chat messaging
- 📺 Screen/media sharing
- 🎨 Beautiful, modern UI
- 🔒 Peer-to-peer connections (no server required for signaling)
- 📱 Responsive design

## Run Locally

**Prerequisites:** Node.js (v16 or higher)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Deploy to Vercel

Deploying Dmeet to Vercel is quick and easy! Follow these steps:

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if you haven't already):

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:

   ```bash
   vercel
   ```

   Follow the prompts:

   - Link to existing project or create new? → Choose based on your preference
   - Project settings → Vercel will auto-detect Vite
   - Deploy → Wait for build to complete

4. **Deploy to production**:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push your code to GitHub** (if not already):

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

3. **Click "Add New Project"**

4. **Import your GitHub repository**

5. **Configure the project**:

   - Framework Preset: Vite (auto-detected)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)

6. **Click "Deploy"**

7. **Wait for deployment** - Vercel will automatically build and deploy your app!

### Post-Deployment

Once deployed, Vercel will provide you with:

- A production URL (e.g., `https://dmeet.vercel.app`)
- Automatic HTTPS
- Global CDN distribution
- Automatic deployments on every push to your main branch

### Environment Variables (Optional)

If you need to set environment variables (currently not required for Dmeet):

1. Go to your project settings in Vercel Dashboard
2. Navigate to "Environment Variables"
3. Add any required variables

### Custom Domain (Optional)

1. Go to your project settings in Vercel Dashboard
2. Navigate to "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## How It Works

Dmeet uses WebRTC for peer-to-peer video connections:

- **STUN Servers**: Google's public STUN servers help establish connections
- **Signaling**: Manual code-based signaling (copy/paste invite codes)
- **No Backend Required**: Everything runs client-side

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

**Note**: WebRTC requires HTTPS in production. Vercel automatically provides this!

## Troubleshooting

### Build Issues

- Ensure Node.js version is 16 or higher
- Run `npm install` before deploying
- Check that all dependencies are listed in `package.json`

### Connection Issues

- Ensure both users have stable internet connections
- Check browser permissions for camera/microphone
- Try using Chrome/Edge for best compatibility

## License

MIT

---

**Ready to deploy?** Follow the Vercel deployment steps above and start using Dmeet! 🚀
