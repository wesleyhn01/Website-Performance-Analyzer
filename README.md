# PageSpeed Insights Chrome Extension

This Chrome extension allows users to quickly analyze web pages using Google's PageSpeed Insights API directly from their browser.

## Features

- Analyze the current tab's URL with PageSpeed Insights
- Display performance, accessibility, best practices, and SEO scores
- Show detailed metrics and suggestions for improvement
- Option to view the full PageSpeed Insights report

## Setup

1. Clone this repository to your local machine.

2. Install dependencies:
   ```
   npm install
   ```

3. Set up your API key:
   - Rename `src/config.example.ts` to `src/config.ts`
   - Replace `YOUR_API_KEY_HERE` in `config.ts` with your actual Google PageSpeed Insights API key

4. Build the extension:
   ```
   npm run build
   ```

5. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked" and select the `dist` folder in your project directory

## Usage

1. Click on the extension icon in your Chrome toolbar.
2. Click the "Analyze" button to run PageSpeed Insights on the current tab.
3. View the results, including scores, metrics, and suggestions for improvement.
4. Use the "View Full Report" button to see the complete PageSpeed Insights report.
5. Click "Reanalyze" to run the analysis again.

## Development

- To watch for changes and rebuild automatically:
  ```
  npm run watch
  ```

- To build for production:
  ```
  npm run build
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)