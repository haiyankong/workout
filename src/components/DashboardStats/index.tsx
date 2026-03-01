import TotalStat from './TotalStat';
import PBStat from './PBStat';

const DashboardStats = () => {
  return (
    <div className="w-full mb-8 bg-card rounded-card shadow-lg border border-gray-800/50">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <TotalStat />
        </div>
        <div className="hidden md:block w-px bg-gray-800/60" />
        <div className="flex-1">
          <PBStat />
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;
