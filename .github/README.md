# GitHub Actions for Job Tracker

This repository contains GitHub Actions workflows to automate testing and CI/CD processes.

## Workflows

### 1. Backend Tests (`backend-tests.yml`)
This workflow runs the backend tests specifically and is triggered when:
- Pull requests are opened against the `main` branch
- Changes are made to backend code or the workflow file itself

**Features:**
- Tests on Node.js LTS version for stability
- Installs dependencies using `npm ci` for faster, reliable builds
- Initializes the test database
- Runs all backend tests
- Generates and uploads code coverage reports
- Only runs when backend files are modified (path filtering)

### 2. Full CI/CD Pipeline (`ci-cd.yml`)
A comprehensive workflow that tests both frontend and backend, plus integration tests.

## Setting Up

### Prerequisites
1. Ensure your repository has the following npm scripts in `backend/package.json`:
   - `test` - runs Jest tests
   - `test:coverage` - runs tests with coverage reporting
   - `init-db` - initializes the database

2. (Optional) For code coverage reporting, add `CODECOV_TOKEN` to your repository secrets:
   - Go to your repository Settings → Secrets and variables → Actions
   - Add a new secret named `CODECOV_TOKEN`
   - Get the token from [Codecov.io](https://codecov.io) after linking your repository

### Usage

The workflows will automatically run when:
- You create a pull request to the `main` branch

You can also manually trigger workflows from the Actions tab in your GitHub repository.

### Monitoring

View workflow runs in the **Actions** tab of your GitHub repository. Each run will show:
- Test results for each Node.js version
- Code coverage reports
- Any errors or failures

### Customization

You can customize the workflows by:
- Changing the Node.js version from LTS to a specific version if needed
- Changing the trigger branches in the `on.pull_request.branches` array
- Adding or removing steps as needed for your specific requirements
- Adjusting the paths filter to include/exclude specific directories

## Local Testing

Before pushing, you can run the same tests locally:

```bash
# Backend tests
cd backend
npm install
npm run init-db
npm test
npm run test:coverage

# Frontend tests (if applicable)
npm install
npm test
npm run build
```

## Troubleshooting

Common issues and solutions:

1. **Tests fail due to missing dependencies**: Ensure all required packages are listed in `package.json`
2. **Database initialization fails**: Check that the `init-db` script works locally
3. **Coverage upload fails**: This is non-blocking; tests will still pass if coverage upload fails
4. **Node version compatibility**: The workflow tests on multiple Node versions to catch compatibility issues

For more specific issues, check the workflow logs in the Actions tab of your repository.
