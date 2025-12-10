import Image from 'next/image';
import Link from 'next/link';

type HeaderProps = {
  downloadUrls: {
    android: string;
    ios: string;
  };
  variant?: 'hero' | 'light';
  showBack?: boolean;
};

export default function Header({ downloadUrls, variant = 'light', showBack = false }: HeaderProps) {
  const isHero = variant === 'hero';

  return (
    <header
      className={
        isHero
          ? 'absolute top-0 left-0 right-0 p-6 z-20 border-b border-white/10 backdrop-blur-md text-white'
          : 'sticky top-0 left-0 right-0 p-4 z-20 border-b border-gray-100 bg-white/90 backdrop-blur text-gray-900'
      }
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-3">
            <Image src="/logo.png" alt="Siargao Trading Road" width={220} height={64} priority className="h-14 w-auto" />
          </Link>
          {showBack && (
            <Link
              href="/"
              className={
                isHero
                  ? 'inline-flex items-center rounded-full border border-white/50 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10 transition'
                  : 'inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition'
              }
            >
              Back to Home
            </Link>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <a
            href={downloadUrls.android}
            target="_blank"
            rel="noopener noreferrer"
            className={
              isHero
                ? 'bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transform hover:scale-105 transition-all duration-300 text-sm'
                : 'bg-black hover:bg-gray-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 text-sm'
            }
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
            </svg>
            <span className="hidden sm:inline">Play Store</span>
          </a>
          <button
            className={
              isHero
                ? 'bg-white/10 hover:bg-white/20 border border-white/30 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transform hover:scale-105 transition-all duration-300 text-sm cursor-not-allowed opacity-60'
                : 'bg-gray-100 border border-gray-200 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm cursor-not-allowed opacity-70'
            }
            disabled
            aria-disabled
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
            </svg>
            <span className="hidden sm:inline">App Store</span>
          </button>
        </div>
      </div>
    </header>
  );
}
