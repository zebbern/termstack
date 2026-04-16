/**
 * Path utility functions for displaying file paths in the UI
 */

const PROJECT_PATH_PATTERN = /(?:^|\/)data\/projects\/[^/]+\/(.+)$/i;
const ROOT_DIRECTORY_MARKERS = new Set([
  'app',
  'assets',
  'components',
  'contexts',
  'data',
  'docs',
  'electron',
  'hooks',
  'lib',
  'pages',
  'prisma',
  'public',
  'scripts',
  'server',
  'services',
  'settings',
  'src',
  'styles',
  'test',
  'tests',
  'types',
]);
const ROOT_FILE_MARKERS = new Set([
  'README.md',
  'index.js',
  'next-env.d.ts',
  'next.config.js',
  'package.json',
  'postcss.config.js',
  'tailwind.config.ts',
  'tsconfig.json',
]);

function normalizePath(pathValue: string): string {
  return pathValue.replace(/\\/g, '/');
}

function extractProjectRelativePath(normalizedPath: string): string | null {
  const projectMatch = normalizedPath.match(PROJECT_PATH_PATTERN);
  if (projectMatch?.[1]) {
    return `/${projectMatch[1]}`;
  }

  const repoMarker = '/termstack/';
  const repoIndex = normalizedPath.lastIndexOf(repoMarker);
  if (repoIndex !== -1) {
    return `/${normalizedPath.slice(repoIndex + repoMarker.length)}`;
  }

  const pathParts = normalizedPath.split('/').filter(Boolean);
  const rootIndex = pathParts.findIndex(
    (segment, index) =>
      ROOT_DIRECTORY_MARKERS.has(segment) ||
      (index === pathParts.length - 1 && ROOT_FILE_MARKERS.has(segment)),
  );

  if (rootIndex !== -1) {
    return `/${pathParts.slice(rootIndex).join('/')}`;
  }

  return null;
}

/**
 * Converts an absolute file path to a project-relative path
 * Removes the system path prefix and shows only the path relative to the repo or project workspace.
 *
 * @param absolutePath - The file path to normalize for display
 * @returns The relative path from the current repo or generated project root
 *
 * @example
 * toRelativePath('C:/Users/zeb/Documents/workspace_for_ai/termstack/app/page.tsx')
 * // Returns: '/app/page.tsx'
 */
export function toRelativePath(absolutePath: string): string {
  if (!absolutePath) return absolutePath;

  const trimmedPath = absolutePath.trim();
  if (!trimmedPath) return trimmedPath;

  const normalizedPath = normalizePath(trimmedPath);
  const looksLikePath =
    normalizedPath.includes('/') ||
    /^[A-Za-z]:\//.test(normalizedPath) ||
    normalizedPath.startsWith('./') ||
    normalizedPath.startsWith('../') ||
    /^[^/\s]+\.[A-Za-z0-9]+$/.test(normalizedPath);

  if (!looksLikePath && /\s/.test(trimmedPath)) {
    return trimmedPath;
  }

  const isAbsolutePath =
    normalizedPath.startsWith('/') ||
    /^[A-Za-z]:\//.test(normalizedPath);

  if (!isAbsolutePath) {
    const relativeProjectPath = extractProjectRelativePath(normalizedPath);
    if (relativeProjectPath) {
      return relativeProjectPath;
    }

    const withoutLeadingDots = normalizedPath.replace(/^\.\//, '');
    return withoutLeadingDots.startsWith('/') ? withoutLeadingDots : `/${withoutLeadingDots}`;
  }

  const extractedPath = extractProjectRelativePath(normalizedPath);
  if (extractedPath) {
    return extractedPath;
  }

  const parts = normalizedPath.split('/').filter(Boolean);
  if (parts.length > 0) {
    return `/${parts[parts.length - 1]}`;
  }

  return normalizedPath;
}


