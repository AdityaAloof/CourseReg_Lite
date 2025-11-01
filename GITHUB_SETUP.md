# GitHub Setup Instructions

Your repository is initialized and ready to push to GitHub!

## Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** icon in the top right → **New repository**
3. Name your repository (e.g., `semo-course-registration`)
4. Choose **Public** or **Private**
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click **Create repository**

## Step 2: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these commands (replace `YOUR_USERNAME` and `REPO_NAME`):

```bash
cd "C:\Users\aloof\OneDrive - Southeast Missouri State University\ASE-Project\site"
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Alternative: Using GitHub CLI (if installed)

```bash
gh repo create semo-course-registration --public --source=. --remote=origin --push
```

## Step 3: Verify

Visit your GitHub repository URL to verify all files are uploaded:
- `https://github.com/YOUR_USERNAME/REPO_NAME`

## GitHub Pages (Optional - Host Your Site for Free)

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**
6. Your site will be live at: `https://YOUR_USERNAME.github.io/REPO_NAME/`

**Note:** For GitHub Pages, you may need to rename `index.html` as the default entry point, or ensure your repository structure matches GitHub Pages expectations.

## Current Repository Status

✅ Git initialized
✅ All files committed
✅ Ready to push

Just run the commands from Step 2 after creating your GitHub repository!

