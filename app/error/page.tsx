import { FC } from 'react';

interface ErrorPageProps {
  searchParams: {
    title?: string;
    description?: string;
    code?: string;
  };
}

const ErrorPage: FC<ErrorPageProps> = ({ searchParams }) => {
  const {
    title = 'Unknown Error',
    description = 'An unexpected error occurred.',
    code = '000',
  } = searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4 py-8">
      <div className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 max-w-lg w-full border border-blue-200">
        <div className="text-center">
          <h1 className="text-3xl sm:text-6xl font-bold text-blue-600 mb-2 break-words">{title}</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-blue-800 mb-4 break-words">{code}</h2>
          <p className="text-blue-700 text-sm sm:text-base break-words">{description}</p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-block w-full sm:w-auto px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full transition text-center"
            >
              Ir a inicio
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
