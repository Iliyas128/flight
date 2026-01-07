import { FilterType } from '@/types';

interface FilterTabsProps {
  activeFilter: FilterType;
  onChange: (filter: FilterType) => void;
  counts: Record<FilterType, number>;
}

export function FilterTabs({ activeFilter, onChange, counts }: FilterTabsProps) {
  const tabs: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'Все' },
    { value: 'open', label: 'Открытые' },
    { value: 'closing', label: 'Скоро закрываются' }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
            activeFilter === tab.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          {tab.label}
          <span className="ml-1 sm:ml-1.5 text-xs opacity-75">({counts[tab.value]})</span>
        </button>
      ))}
    </div>
  );
}
