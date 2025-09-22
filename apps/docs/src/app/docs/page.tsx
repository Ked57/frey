import Link from "next/link";
import { getAllDocs } from "@/lib/markdown";

export default async function DocsPage() {
  const docs = await getAllDocs();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Documentation
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Learn how to build powerful APIs with Frey
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.id}
            href={`/docs/${doc.id}`}
            className="block p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {doc.metadata.title}
            </h3>
            {doc.metadata.description && (
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {doc.metadata.description}
              </p>
            )}
          </Link>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
          Quick Start
        </h3>
        <p className="mt-2 text-blue-800 dark:text-blue-200">
          New to Frey? Start with our{" "}
          <Link
            href="/docs/getting-started"
            className="font-medium underline hover:no-underline"
          >
            Getting Started guide
          </Link>{" "}
          to build your first API in minutes.
        </p>
      </div>
    </div>
  );
}
