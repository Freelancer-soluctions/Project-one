import { useTranslation } from 'react-i18next';
import { LuBriefcase, LuBuilding2 } from 'react-icons/lu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackDashBoard } from '@/components/backDash/BackDashBoard';
import { PositionsManager, DepartmentsManager } from '../components';

const EmployeeCatalogs = () => {
  const { t } = useTranslation();

  return (
    <>
      <BackDashBoard link={'/home'} moduleName={t('employee_catalogs')} />
      <div className="w-full px-4 py-6">
        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="flex flex-wrap gap-5 overflow-x-auto md:flex-nowrap">
            <TabsTrigger value="positions" className="flex items-center gap-2">
              <LuBriefcase className="w-4 h-4" />
              {t('positions')}
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="flex items-center gap-2"
            >
              <LuBuilding2 className="w-4 h-4" />
              {t('departments')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="positions">
            <PositionsManager />
          </TabsContent>
          <TabsContent value="departments">
            <DepartmentsManager />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default EmployeeCatalogs;
