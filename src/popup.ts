import { API_KEY } from './config';

interface PageSpeedApiResponse {
  id: string;
  loadingExperience?: {
    metrics?: {
      FIRST_CONTENTFUL_PAINT_MS?: {
        category: string;
      };
      FIRST_INPUT_DELAY_MS?: {
        category: string;
      };
    };
  };
  lighthouseResult: {
    audits: {
      [key: string]: {
        displayValue?: string;
        score?: number;
        title?: string;
      };
    };
    categories: {
      performance?: { score?: number };
      accessibility?: { score?: number };
      'best-practices'?: { score?: number };
      seo?: { score?: number };
    };
  };
}

function getCurrentTabUrl(callback: (url: string | null) => void): void {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const url = tabs[0].url;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      callback(url);
    } else {
      callback(null);
    }
  });
}

function setUpQuery(pageUrl: string): string {
  const api = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
  const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
  
  const parameters = new URLSearchParams({
    url: pageUrl,
    key: API_KEY,
  });

  categories.forEach(category => {
    parameters.append('category', category);
  });

  return `${api}?${parameters.toString()}`;
}

function getColorFromScore(score: number | undefined): string {
  if (score === undefined) return '#666666'; // Gray for unknown scores
  if (score >= 0.9) return '#4ade80'; // Green for good scores
  if (score >= 0.5) return '#facc15'; // Yellow for average scores
  return '#f87171'; // Red for poor scores
}

function showResults(json: PageSpeedApiResponse): void {
  console.log('showResults function called with data:', json);
  
  // Remove the initial-view class from the body
  document.body.classList.remove('initial-view');
  
  const resultsDiv = document.getElementById('results');
  const tabsDiv = document.getElementById('tabs');
  const statsContent = document.getElementById('statsContent');
  const suggestionsContent = document.getElementById('suggestionsContent');
  
  if (!resultsDiv || !tabsDiv || !statsContent || !suggestionsContent) return;
  
  resultsDiv.innerHTML = '';
  statsContent.innerHTML = '';
  suggestionsContent.innerHTML = '';

  // Scores
  const scoresDiv = document.createElement('div');
  scoresDiv.className = 'scores';

  const categories: Array<{name: string, id: keyof PageSpeedApiResponse['lighthouseResult']['categories']}> = [
    { name: 'Performance', id: 'performance' },
    { name: 'Accessibility', id: 'accessibility' },
    { name: 'Best Practices', id: 'best-practices' },
    { name: 'SEO', id: 'seo' }
  ];

  categories.forEach(category => {
    const scoreDiv = document.createElement('div');
    scoreDiv.className = 'score';
    const categoryScore = json.lighthouseResult.categories[category.id];
    console.log(`Category: ${category.name}, Score:`, categoryScore);
    const score = categoryScore && categoryScore.score !== undefined 
      ? Math.round(categoryScore.score * 100) 
      : 'N/A';
    console.log(`Calculated score for ${category.name}:`, score);
    
    scoreDiv.innerHTML = `
      <span class="score-label">${category.name}</span>
      <span class="score-value" data-score="${score}">${score}</span>
    `;
    scoresDiv.appendChild(scoreDiv);
  });

  resultsDiv.appendChild(scoresDiv);

  // Add timestamp
  const timestampDiv = document.createElement('div');
  timestampDiv.className = 'timestamp';
  const currentTime = new Date().toLocaleString();
  timestampDiv.textContent = `Performed on: ${currentTime} EST`;
  resultsDiv.appendChild(timestampDiv);

  // Show tabs
  tabsDiv.style.display = 'flex';

  // Metrics
  const metrics = [
    { name: 'First Contentful Paint', id: 'first-contentful-paint', url: 'https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint/?utm_source=lighthouse&utm_medium=lr' },
    { name: 'Speed Index', id: 'speed-index', url: 'https://developer.chrome.com/docs/lighthouse/performance/speed-index/?utm_source=lighthouse&utm_medium=lr' },
    { name: 'Largest Contentful Paint', id: 'largest-contentful-paint', url: 'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint/?utm_source=lighthouse&utm_medium=lr' },
    { name: 'Time to Interactive', id: 'interactive', url: 'https://developer.chrome.com/docs/lighthouse/performance/interactive' },
    { name: 'Total Blocking Time', id: 'total-blocking-time', url: 'https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time/?utm_source=lighthouse&utm_medium=lr' },
    { name: 'Cumulative Layout Shift', id: 'cumulative-layout-shift', url: 'https://web.dev/articles/cls?utm_source=lighthouse&utm_medium=lr' }
  ];

  metrics.forEach(metric => {
    const metricDiv = document.createElement('div');
    metricDiv.className = 'metric';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'metric-name';
    
    const link = document.createElement('a');
    link.href = metric.url;
    link.textContent = metric.name;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: link.href });
    });
    
    nameSpan.appendChild(link);
    
    const valueSpan = document.createElement('span');
    valueSpan.className = 'metric-value';
    const metricAudit = json.lighthouseResult.audits[metric.id];
    valueSpan.textContent = metricAudit && metricAudit.displayValue ? metricAudit.displayValue : 'N/A';
    
    metricDiv.appendChild(nameSpan);
    metricDiv.appendChild(valueSpan);
    statsContent.appendChild(metricDiv);
  });

  // Add PageSpeed Insights button and Reanalyze button
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';

  const psiButton = document.createElement('button');
  psiButton.className = 'psi-button';
  psiButton.textContent = 'View Full Report';
  psiButton.onclick = () => {
    chrome.tabs.create({ url: `https://pagespeed.web.dev/report?url=${encodeURIComponent(json.id)}` });
  };

  const reanalyzeButton = document.createElement('button');
  reanalyzeButton.className = 'reanalyze-button';
  reanalyzeButton.textContent = 'Reanalyze';
  reanalyzeButton.onclick = reanalyze;

  buttonContainer.appendChild(psiButton);
  buttonContainer.appendChild(reanalyzeButton);
  statsContent.appendChild(buttonContainer);

  // Opportunities and Suggestions
  const opportunities = json.lighthouseResult.audits;
  const relevantOpportunities = [
    'render-blocking-resources',
    'offscreen-images',
    'unminified-css',
    'unminified-javascript',
    'unused-css-rules',
    'unused-javascript',
    'uses-webp-images',
    'uses-optimized-images',
    'uses-text-compression',
    'uses-responsive-images',
    'efficient-animated-content',
    'preload-lcp-image'
  ];

  relevantOpportunities.forEach(oppId => {
    const opportunity = opportunities[oppId];
    if (opportunity && opportunity.score !== undefined && opportunity.score < 1) {
      const oppDiv = document.createElement('div');
      oppDiv.className = 'opportunity';
      const color = getColorFromScore(opportunity.score);
      oppDiv.innerHTML = `
        <strong style="color: ${color};">${opportunity.title || 'Unknown opportunity'}</strong>
        <p>${opportunity.displayValue || 'N/A'}</p>
      `;
      suggestionsContent.appendChild(oppDiv);
    }
  });

  // Set up tab switching
  const statsTab = document.getElementById('statsTab') as HTMLButtonElement;
  const suggestionsTab = document.getElementById('suggestionsTab') as HTMLButtonElement;

  statsTab.addEventListener('click', () => {
    statsTab.classList.add('active');
    suggestionsTab.classList.remove('active');
    statsContent.style.display = 'block';
    suggestionsContent.style.display = 'none';
  });

  suggestionsTab.addEventListener('click', () => {
    suggestionsTab.classList.add('active');
    statsTab.classList.remove('active');
    suggestionsContent.style.display = 'block';
    statsContent.style.display = 'none';
  });

  // Show stats content by default
  statsContent.style.display = 'block';
}

function showError(message: string): void {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `<p style="color: red;">${message}</p>`;
  }
}

function showLoading(): void {
  const resultsDiv = document.getElementById('results');
  if (resultsDiv) {
    resultsDiv.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
      </div>
    `;
  }
}

function hideAnalyzeButton(): void {
  const buttonContainer = document.getElementById('buttonContainer');
  if (buttonContainer) {
    buttonContainer.style.display = 'none';
  }
}

function reanalyze(): void {
  // Clear previous results
  const resultsDiv = document.getElementById('results');
  const tabsDiv = document.getElementById('tabs');
  const statsContent = document.getElementById('statsContent');
  const suggestionsContent = document.getElementById('suggestionsContent');
  
  if (resultsDiv) resultsDiv.innerHTML = '';
  if (tabsDiv) tabsDiv.style.display = 'none';
  if (statsContent) statsContent.innerHTML = '';
  if (suggestionsContent) suggestionsContent.innerHTML = '';

  // Add the initial-view class back to the body
  document.body.classList.add('initial-view');

  // Start the analysis again
  run();
}

function expandContainer(): void {
  const buttonContainer = document.getElementById('buttonContainer');
  if (buttonContainer) {
    buttonContainer.style.maxWidth = '100%';
    buttonContainer.style.padding = '0';
    buttonContainer.style.background = 'none';
  }
}

function run(): void {
  hideAnalyzeButton();
  expandContainer();
  showLoading();
  getCurrentTabUrl((tabUrl) => {
    if (tabUrl) {
      const url = setUpQuery(tabUrl);
      console.log('Fetching URL:', url);
      fetch(url)
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`HTTP error! status: ${response.status}, body: ${text}`);
            });
          }
          return response.json();
        })
        .then((json: PageSpeedApiResponse) => {
          console.log('Received data:', json);
          if (!json.lighthouseResult) {
            throw new Error('Lighthouse result is missing from the API response');
          }
          showResults(json);
        })
        .catch(error => {
          console.error('Error:', error);
          showError(`Failed to fetch PageSpeed Insights data: ${error.message}`);
        });
    } else {
      showError('Not a valid URL for PageSpeed Insights');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Add the initial-view class to the body when the extension is first opened
  document.body.classList.add('initial-view');

  const analyzeButton = document.getElementById('analyzeButton');
  if (analyzeButton) {
    analyzeButton.addEventListener('click', run);
  }
});