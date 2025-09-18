import { getAllDocIds, getDocData } from '@/lib/markdown';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { navigation } from '@/lib/navigation';
import MarkdownContent from '@/components/MarkdownContent';

export async function generateStaticParams() {
  const docIds = getAllDocIds();
  return docIds.map((id) => ({
    id: id,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const docData = await getDocData(id);
    return {
      title: `${docData.metadata.title} | Frey Documentation`,
      description: docData.metadata.description || `Learn about ${docData.metadata.title} in Frey`,
    };
  } catch {
    return {
      title: 'Documentation | Frey',
      description: 'Frey documentation',
    };
  }
}

export default async function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let docData;
  try {
    docData = await getDocData(id);
  } catch {
    notFound();
  }

  const currentIndex = navigation.findIndex(item => item.href === `/docs/${id}`);
  const prevDoc = currentIndex > 0 ? navigation[currentIndex - 1] : null;
  const nextDoc = currentIndex < navigation.length - 1 ? navigation[currentIndex + 1] : null;

  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          {docData.metadata.title}
        </h1>
        {docData.metadata.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {docData.metadata.description}
          </p>
        )}
      </header>

      <MarkdownContent content={docData.content} />

      <nav className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between">
          <div>
            {prevDoc && (
              <Link
                href={prevDoc.href}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {prevDoc.title}
              </Link>
            )}
          </div>
          <div>
            {nextDoc && (
              <Link
                href={nextDoc.href}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {nextDoc.title}
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </article>
  );
}
