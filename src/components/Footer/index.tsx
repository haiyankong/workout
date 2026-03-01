import useSiteMetadata from '@/hooks/useSiteMetadata';

const Footer = () => {
  const { siteTitle } = useSiteMetadata();
  const year = new Date().getFullYear();

  return (
    <footer className="w-full px-6 py-8 mt-12 border-t border-gray-300">
      <div className="max-w-[1400px] mx-auto flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
        <span>© {year} {siteTitle}</span>
      </div>
    </footer>
  );
};

export default Footer;
