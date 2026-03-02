import useActivities from '@/hooks/useActivities';
import styles from './style.module.css';

const RunMapButtons = ({ changeYear, thisYear, className }: { changeYear: (_year: string) => void, thisYear: string, className?: string }) => {
  const { years } = useActivities();
  const yearsButtons = years.slice();
  yearsButtons.push('Total');

  return (
    <ul className={className ?? styles.buttons}>
      {yearsButtons.map((year) => (
        <li
          key={`${year}button`}
          className={styles.button + ` ${year === thisYear ? styles.selected : ''}`}
          onClick={() => {
            changeYear(year);
          }}
        >
          {year}
        </li>
      ))}
    </ul>
  );
};

export default RunMapButtons;
