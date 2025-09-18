import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <main className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Frey
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Entity-driven API generation framework for Fastify. Build powerful
            REST APIs with minimal code using TypeScript and Zod validation.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/docs"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/docs/api-reference"
              className="bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              API Reference
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🚀 Fast Setup
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get your API running in minutes with entity-driven CRUD
                operations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                🔒 Type Safe
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built with TypeScript and Zod for end-to-end type safety and
                validation.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                ⚡ Performance
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Optimized for speed with Fastify and Bun runtime compatibility.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
