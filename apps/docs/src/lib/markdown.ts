import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const docsDirectory = path.join(process.cwd(), '../../docs/frey');

export interface DocMetadata {
  title: string;
  description?: string;
  order?: number;
}

export interface DocData {
  id: string;
  content: string;
  metadata: DocMetadata;
}

export function getAllDocIds(): string[] {
  const fileNames = fs.readdirSync(docsDirectory);
  return fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => fileName.replace(/\.md$/, ''));
}

export async function getDocData(id: string): Promise<DocData> {
  const fullPath = path.join(docsDirectory, `${id}.md`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');

  // Use gray-matter to parse the post metadata section
  const matterResult = matter(fileContents);

  // Return the raw markdown content for react-markdown to process
  return {
    id,
    content: matterResult.content,
    metadata: matterResult.data as DocMetadata,
  };
}

export async function getAllDocs(): Promise<DocData[]> {
  const fileNames = fs.readdirSync(docsDirectory);
  const allDocsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const id = fileName.replace(/\.md$/, '');
      const fullPath = path.join(docsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      return {
        id,
        content: '', // We'll load content when needed
        metadata: {
          title: matterResult.data.title || id,
          description: matterResult.data.description,
          order: matterResult.data.order,
        } as DocMetadata,
      };
    });

  // Sort by order if specified, otherwise by title
  return allDocsData.sort((a, b) => {
    if (a.metadata.order !== undefined && b.metadata.order !== undefined) {
      return a.metadata.order - b.metadata.order;
    }
    if (a.metadata.title && b.metadata.title) {
      return a.metadata.title.localeCompare(b.metadata.title);
    }
    return 0;
  });
}
