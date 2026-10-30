import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PolicyLayout({ title, updated, children }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        to="/profile"
        className="text-sm flex items-center gap-1 mb-6 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-3xl font-bold mb-2 dark:text-white">{title}</h1>
      {updated && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Last updated: {updated}
        </p>
      )}

      <div className="prose prose-sm dark:prose-invert max-w-none space-y-5 text-gray-700 dark:text-gray-300 leading-relaxed">
        {children}
      </div>
    </div>
  );
}
