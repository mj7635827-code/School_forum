const PREFIX_STYLES = {
  question: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Question' },
  tutorial: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tutorial' },
  discussion: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Discussion' },
  news: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'News' },
  announcement: { bg: 'bg-red-100', text: 'text-red-700', label: 'Announcement' },
  help: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Help' },
  none: null,
};

const PrefixBadge = ({ prefix }) => {
  if (!prefix || prefix === 'none') return null;
  
  const style = PREFIX_STYLES[prefix] || PREFIX_STYLES.discussion;
  
  return (
    <span className={`px-2 py-1 ${style.bg} ${style.text} text-xs font-medium rounded`}>
      {style.label}
    </span>
  );
};

export default PrefixBadge;
