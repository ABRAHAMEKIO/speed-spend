import { CodeBracketIcon } from '@heroicons/react/24/outline';
import { Typography } from '@material-tailwind/react';

export function Footer() {
  return (
    <footer className="w-full bg-white p-8">
      <div className="flex flex-row flex-wrap items-center justify-center gap-y-6 gap-x-12 bg-white text-center md:justify-between">
        <img src="/android-chrome-192x192.png" alt="logo-ct" className="w-10" />
        <ul className="flex flex-wrap items-center gap-y-2 gap-x-8">
          <li>
            <Typography
              as="a"
              href="https://github.com/friedger/speed-spend"
              color="blue-gray"
              className="font-normal transition-colors hover:text-blue-500 focus:text-blue-500"
            >
              <CodeBracketIcon className="inline-block size-4" /> Contribute
            </Typography>
          </li>
        </ul>
        <Typography color="blue-gray" className="text-center font-normal">
          &copy; 2024 OpenIntents
        </Typography>
      </div>
    </footer>
  );
}
