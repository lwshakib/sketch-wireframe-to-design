/**
 * Extracts HTML content from artifact tags in AI responses
 * Supports <artifact>, <web_artifact>, and <app_artifact>
 * Handles partial matches for real-time streaming
 */
export function extractArtifact(text: string): { content: string, type: 'web' | 'app' | 'general', isComplete: boolean } | null {
  const tags = [
    { start: '<web_artifact>', end: '</web_artifact>', type: 'web' as const },
    { start: '<app_artifact>', end: '</app_artifact>', type: 'app' as const },
    { start: '<artifact>', end: '</artifact>', type: 'general' as const },
  ];

  for (const tag of tags) {
    const startIndex = text.toLowerCase().indexOf(tag.start);
    if (startIndex !== -1) {
      const contentStart = startIndex + tag.start.length;
      const endIndex = text.toLowerCase().indexOf(tag.end, contentStart);
      
      if (endIndex !== -1) {
        return { 
          content: text.substring(contentStart, endIndex).trim(), 
          type: tag.type,
          isComplete: true 
        };
      } else {
        // Handle streaming: return content up to current end of string
        return { 
          content: text.substring(contentStart).trim(), 
          type: tag.type,
          isComplete: false 
        };
      }
    }
  }

  return null;
}

/**
 * Removes all types of artifact blocks from text for display
 * Also removes partial tags at the end of strings during streaming
 */
export function stripArtifact(text: string): string {
  let cleaned = text;
  
  // Remove full artifacts
  cleaned = cleaned
    .replace(/<web_artifact>[\s\S]*?<\/web_artifact>/gi, '')
    .replace(/<app_artifact>[\s\S]*?<\/app_artifact>/gi, '')
    .replace(/<artifact>[\s\S]*?<\/artifact>/gi, '');

  // Remove trailing open tags
  const openTags = ['<web_artifact>', '<app_artifact>', '<artifact>'];
  for (const tag of openTags) {
    const lastOpen = cleaned.toLowerCase().lastIndexOf(tag);
    if (lastOpen !== -1) {
      cleaned = cleaned.substring(0, lastOpen);
    }
  }

  return cleaned.trim();
}

/**
 * Renders HTML content into an iframe for safe sandboxed execution
 */
export function renderHTMLToCanvas(
  canvas: HTMLCanvasElement,
  htmlContent: string
): void {
  // Create an off-screen iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '1920px';
  iframe.style.height = '1080px';
  iframe.sandbox.add('allow-scripts');
  
  document.body.appendChild(iframe);

  // Write the HTML content to the iframe
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for the iframe to fully load, then capture it to canvas
  iframe.onload = () => {
    setTimeout(() => {
      try {
        const iframeWindow = iframe.contentWindow;
        if (!iframeWindow) return;

        // Get the rendered dimensions
        const body = iframeDoc.body;
        const html = iframeDoc.documentElement;
        const width = Math.max(
          body.scrollWidth,
          body.offsetWidth,
          html.clientWidth,
          html.scrollWidth,
          html.offsetWidth
        );
        const height = Math.max(
          body.scrollHeight,
          body.offsetHeight,
          html.clientHeight,
          html.scrollHeight,
          html.offsetHeight
        );

        // Set iframe to actual content size
        iframe.style.width = `${width}px`;
        iframe.style.height = `${height}px`;

        // Use html2canvas or similar library to capture the iframe
        // For now, we'll use a simple approach with canvas drawing
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Scale canvas to fit content
        const scale = Math.min(
          canvas.width / width,
          canvas.height / height
        );

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(scale, scale);

        // Note: Direct iframe to canvas rendering requires additional libraries
        // This is a placeholder for the actual implementation
        // You would typically use html2canvas or similar here
        
        ctx.restore();
      } catch (error) {
        console.error('Error rendering HTML to canvas:', error);
      } finally {
        // Clean up
        document.body.removeChild(iframe);
      }
    }, 500);
  };
}

/**
 * Alternative: Render HTML in an iframe overlay instead of canvas
 * This provides better interactivity and fidelity
 */
export function createPreviewIframe(htmlContent: string): HTMLIFrameElement {
  const iframe = document.createElement('iframe');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.sandbox.add('allow-scripts', 'allow-same-origin');
  
  // Write content after iframe is in DOM
  setTimeout(() => {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(htmlContent);
      iframeDoc.close();
    }
  }, 0);

  return iframe;
}
