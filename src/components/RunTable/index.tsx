import React, { useState, useEffect } from 'react';
import {
  sortDateFunc,
  sortDateFuncReverse,
  convertMovingTime2Sec,
  Activity,
  RunIds,
} from '@/utils/utils';
import RunRow from './RunRow';
import styles from './style.module.css';

interface IRunTableProperties {
  runs: Activity[];
  locateActivity: (_runIds: RunIds) => void;
  setActivity: (_runs: Activity[]) => void;
  runIndex: number;
  setRunIndex: (_index: number) => void;
}

type SortFunc = (_a: Activity, _b: Activity) => number;

const PAGE_SIZE = 10;

const RunTable = ({
  runs,
  locateActivity,
  setActivity,
  runIndex,
  setRunIndex,
}: IRunTableProperties) => {
  const [sortFuncInfo, setSortFuncInfo] = useState('');
  const [page, setPage] = useState(1);
  const [animSeed, setAnimSeed] = useState(0);

  const sortTypeFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Type' ? a.type > b.type ? 1:-1 : b.type < a.type ? -1:1;
  const sortKMFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'KM' ? a.distance - b.distance : b.distance - a.distance;
  const sortElevationGainFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Elevation'
      ? (a.elevation_gain ?? 0) - (b.elevation_gain ?? 0)
      : (b.elevation_gain ?? 0) - (a.elevation_gain ?? 0);
  const sortPaceFunc: SortFunc = (a, b) =>
    sortFuncInfo === 'Pace'
      ? a.average_speed - b.average_speed
      : b.average_speed - a.average_speed;
  const sortBPMFunc: SortFunc = (a, b) => {
    return sortFuncInfo === 'Heart Rate'
      ? (a.average_heartrate ?? 0) - (b.average_heartrate ?? 0)
      : (b.average_heartrate ?? 0) - (a.average_heartrate ?? 0);
  };
  const sortRunTimeFunc: SortFunc = (a, b) => {
    const aTotalSeconds = convertMovingTime2Sec(a.moving_time);
    const bTotalSeconds = convertMovingTime2Sec(b.moving_time);
    return sortFuncInfo === 'Duration'
      ? aTotalSeconds - bTotalSeconds
      : bTotalSeconds - aTotalSeconds;
  };
  const sortDateFuncClick =
    sortFuncInfo === 'Start Time' ? sortDateFunc : sortDateFuncReverse;
  const sortFuncMap = new Map([
    ['Type', sortTypeFunc],
    ['KM', sortKMFunc],
    ['Elevation', sortElevationGainFunc],
    ['Pace', sortPaceFunc],
    ['Heart Rate', sortBPMFunc],
    ['Duration', sortRunTimeFunc],
    ['Start Time', sortDateFuncClick],
  ]);

  const totalCount = runs.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const pageEnd = Math.min(totalCount, pageStart + PAGE_SIZE);
  const pageRuns = runs.slice(pageStart, pageEnd);

  useEffect(() => {
    setAnimSeed((s) => s + 1);
  }, [page, totalCount]);

  const handleClick: React.MouseEventHandler<HTMLElement> = (e) => {
    const funcName = (e.target as HTMLElement).innerHTML;
    const f = sortFuncMap.get(funcName);

    setRunIndex(-1);
    setSortFuncInfo(sortFuncInfo === funcName ? '' : funcName);
    setPage(1);
    setActivity(runs.sort(f));
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.tableContainer}>
        <table className={styles.runTable} cellSpacing="0" cellPadding="0">
          <thead>
            <tr>
              <th />
              {Array.from(sortFuncMap.keys()).map((k) => (
                <th key={k} onClick={handleClick}>
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRuns.map((run, elementIndex) => (
              <RunRow
                key={`${run.run_id}-${animSeed}`}
                elementIndex={pageStart + elementIndex}
                locateActivity={locateActivity}
                run={run}
                runIndex={runIndex}
                setRunIndex={setRunIndex}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.metaBar}>
        <div className={styles.count}>
          {totalCount === 0 ? '0' : `${pageStart + 1}-${pageEnd}`} / {totalCount}
        </div>
        <div className={styles.pager}>
          <button
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            type="button"
          >
            Prev
          </button>
          <div className={styles.pageInfo}>
            {page} / {totalPages}
          </div>
          <button
            className={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunTable;
